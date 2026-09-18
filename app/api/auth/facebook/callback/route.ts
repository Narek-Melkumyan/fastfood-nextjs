import {
    timingSafeEqual,
} from "crypto";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
    REFRESH_COOKIE_NAME,
    generateRefreshToken,
    getRefreshExpiration,
    hashRefreshToken,
    refreshCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

const FACEBOOK_STATE_COOKIE =
    "food_facebook_oauth_state";

type FacebookTokenResponse = {
    access_token?: string;
    token_type?: string;
    expires_in?: number;

    error?: {
        message?: string;
        type?: string;
        code?: number;
    };
};

type FacebookUser = {
    id: string;
    name?: string;
    email?: string;

    picture?: {
        data?: {
            url?: string;
            width?: number;
            height?: number;
            is_silhouette?: boolean;
        };
    };

    error?: {
        message?: string;
        type?: string;
        code?: number;
    };
};

function getAppUrl() {
    const appUrl =
        process.env.APP_URL?.replace(/\/$/, "");

    if (!appUrl) {
        throw new Error(
            "APP_URL is not configured."
        );
    }

    return appUrl;
}

function safeEqual(
    first: string,
    second: string
) {
    const firstBuffer =
        Buffer.from(first);

    const secondBuffer =
        Buffer.from(second);

    if (
        firstBuffer.length !==
        secondBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        firstBuffer,
        secondBuffer
    );
}

function getIpAddress(
    request: NextRequest
) {
    const forwarded =
        request.headers.get(
            "x-forwarded-for"
        );

    if (forwarded) {
        return (
            forwarded
                .split(",")[0]
                ?.trim() || null
        );
    }

    return (
        request.headers.get(
            "x-real-ip"
        ) || null
    );
}

function redirectWithError(
    appUrl: string,
    error: string
) {
    return NextResponse.redirect(
        new URL(
            `/login?oauth=${encodeURIComponent(error)}`,
            appUrl
        )
    );
}

function clearFacebookCookie(
    response: NextResponse,
    secure: boolean
) {
    response.cookies.set(
        FACEBOOK_STATE_COOKIE,
        "",
        {
            httpOnly: true,
            secure,
            sameSite: "lax",
            path:
                "/api/auth/facebook/callback",
            maxAge: 0,
        }
    );
}

export async function GET(
    request: NextRequest
) {
    const appUrl = getAppUrl();

    const secure =
        appUrl.startsWith(
            "https://"
        );




    try {
        const appId =
            process.env.FACEBOOK_APP_ID;

        const appSecret =
            process.env.FACEBOOK_APP_SECRET;

        if (!appId) {
            throw new Error(
                "FACEBOOK_APP_ID is not configured."
            );
        }

        if (!appSecret) {
            throw new Error(
                "FACEBOOK_APP_SECRET is not configured."
            );
        }

        const searchParams =
            request.nextUrl.searchParams;

        const facebookError =
            searchParams.get("error");

        if (facebookError) {
            const response =
                redirectWithError(
                    appUrl,
                    facebookError ===
                    "access_denied"
                        ? "facebook_cancelled"
                        : "facebook_error"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        const code =
            searchParams.get("code");

        const returnedState =
            searchParams.get("state");

        const savedState =
            request.cookies.get(
                FACEBOOK_STATE_COOKIE
            )?.value;

        if (
            !code ||
            !returnedState ||
            !savedState
        ) {
            const response =
                redirectWithError(
                    appUrl,
                    "facebook_invalid_request"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        if (
            !safeEqual(
                returnedState,
                savedState
            )
        ) {
            const response =
                redirectWithError(
                    appUrl,
                    "facebook_invalid_state"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        const redirectUri =
            `${appUrl}/api/auth/facebook/callback`;

        /*
         * Exchange authorization code
         * for Facebook access token.
         */
        const tokenParams =
            new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code,
            });

        const tokenResponse =
            await fetch(
                `https://graph.facebook.com/oauth/access_token?${tokenParams.toString()}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

        const tokenData =
            (await tokenResponse.json()) as
                FacebookTokenResponse;



        if (
            !tokenResponse.ok ||
            !tokenData.access_token
        ) {
            console.error(
                "FACEBOOK TOKEN ERROR:",
                tokenData.error
            );

            const response =
                redirectWithError(
                    appUrl,
                    "facebook_token_exchange_failed"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        /*
         * Load Facebook profile.
         */
        const profileParams =
            new URLSearchParams({
                fields:
                    "id,name,email,picture.type(large)",
                access_token:
                tokenData.access_token,
            });

        const profileResponse =
            await fetch(
                `https://graph.facebook.com/me?${profileParams.toString()}`,
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

        const facebookUser =
            (await profileResponse.json()) as
                FacebookUser;


        if (
            !profileResponse.ok ||
            !facebookUser.id
        ) {
            console.error(
                "FACEBOOK PROFILE ERROR:",
                facebookUser.error
            );

            const response =
                redirectWithError(
                    appUrl,
                    "facebook_profile_failed"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        /*
         * Facebook does not always
         * return an email address.
         */
        if (!facebookUser.email) {
            const response =
                redirectWithError(
                    appUrl,
                    "facebook_email_missing"
                );

            clearFacebookCookie(
                response,
                secure
            );

            return response;
        }

        const email =
            facebookUser.email
                .trim()
                .toLowerCase();

        const facebookAccountId =
            facebookUser.id;

        const pictureUrl =
            facebookUser.picture
                ?.data?.url || null;

        const now =
            new Date();

        const user =
            await prisma.$transaction(
                async (tx) => {
                    /*
                     * First check whether this
                     * Facebook identity is already
                     * connected.
                     */
                    const existingOAuth =
                        await tx.oAuthAccount
                            .findUnique({
                                where: {
                                    provider_providerAccountId:
                                        {
                                            provider:
                                                "facebook",

                                            providerAccountId:
                                            facebookAccountId,
                                        },
                                },

                                include: {
                                    user: true,
                                },
                            });

                    if (existingOAuth) {
                        if (
                            !existingOAuth.user
                                .isActive
                        ) {
                            throw new Error(
                                "ACCOUNT_DISABLED"
                            );
                        }

                        return tx.user.update({
                            where: {
                                id:
                                existingOAuth
                                    .userId,
                            },

                            data: {
                                lastLoginAt: now,

                                avatarUrl:
                                    existingOAuth.user
                                        .avatarUrl ??
                                    pictureUrl,
                            },
                        });
                    }

                    /*
                     * Facebook does not expose the
                     * same explicit email_verified
                     * field Google does.
                     *
                     * For safety, do not silently
                     * attach Facebook to an existing
                     * Foodly account with the same
                     * email.
                     */
                    const existingUser =
                        await tx.user.findUnique({
                            where: {
                                email,
                            },
                        });

                    if (existingUser) {
                        throw new Error(
                            "EMAIL_ALREADY_EXISTS"
                        );
                    }

                    /*
                     * Brand-new Facebook account.
                     */
                    const newUser =
                        await tx.user.create({
                            data: {
                                name:
                                    facebookUser.name
                                        ?.trim() ||
                                    email.split("@")[0] ||
                                    "Foodly User",

                                email,

                                avatarUrl:
                                pictureUrl,

                                lastLoginAt:
                                now,

                                /*
                                 * We intentionally do not
                                 * set emailVerifiedAt here.
                                 */
                            },
                        });

                    await tx.oAuthAccount.create({
                        data: {
                            provider:
                                "facebook",

                            providerAccountId:
                            facebookAccountId,

                            userId:
                            newUser.id,
                        },
                    });

                    return newUser;
                }
            );

        /*
         * Create Foodly refresh session.
         */
        const remember = true;

        const refreshToken =
            generateRefreshToken();

        const tokenHash =
            hashRefreshToken(
                refreshToken
            );

        const expiresAt =
            getRefreshExpiration(
                remember
            );

        await prisma.refreshToken.create({
            data: {
                tokenHash,
                userId: user.id,
                expiresAt,
                remember,

                userAgent:
                    request.headers.get(
                        "user-agent"
                    ),

                ipAddress:
                    getIpAddress(
                        request
                    ),
            },
        });

        const response =
            NextResponse.redirect(
                new URL(
                    "/profile?oauth=facebook",
                    appUrl
                )
            );

        response.cookies.set(
            REFRESH_COOKIE_NAME,
            refreshToken,
            refreshCookieOptions(
                remember
            )
        );

        clearFacebookCookie(
            response,
            secure
        );

        return response;
    } catch (error) {
        console.error(
            "FACEBOOK OAUTH CALLBACK ERROR:",
            error
        );

        let reason =
            "facebook_failed";

        if (
            error instanceof Error &&
            error.message ===
            "ACCOUNT_DISABLED"
        ) {
            reason =
                "account_disabled";
        }

        if (
            error instanceof Error &&
            error.message ===
            "EMAIL_ALREADY_EXISTS"
        ) {
            reason =
                "facebook_email_exists";
        }

        const response =
            redirectWithError(
                appUrl,
                reason
            );

        clearFacebookCookie(
            response,
            secure
        );

        return response;
    }
}