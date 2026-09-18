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

const GOOGLE_STATE_COOKIE =
    "food_google_oauth_state";

const GOOGLE_VERIFIER_COOKIE =
    "food_google_oauth_verifier";

type GoogleTokenResponse = {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    id_token?: string;

    error?: string;
    error_description?: string;
};

type GoogleUser = {
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
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

function clearGoogleCookies(
    response: NextResponse,
    secure: boolean
) {
    const options = {
        httpOnly: true,
        secure,
        sameSite: "lax" as const,
        path: "/api/auth/google/callback",
        maxAge: 0,
    };

    response.cookies.set(
        GOOGLE_STATE_COOKIE,
        "",
        options
    );

    response.cookies.set(
        GOOGLE_VERIFIER_COOKIE,
        "",
        options
    );
}

export async function GET(
    request: NextRequest
) {
    const appUrl = getAppUrl();

    const secure =
        appUrl.startsWith("https://");

    try {
        const clientId =
            process.env.GOOGLE_CLIENT_ID;

        const clientSecret =
            process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId) {
            throw new Error(
                "GOOGLE_CLIENT_ID is not configured."
            );
        }

        if (!clientSecret) {
            throw new Error(
                "GOOGLE_CLIENT_SECRET is not configured."
            );
        }

        const searchParams =
            request.nextUrl.searchParams;

        const googleError =
            searchParams.get("error");

        if (googleError) {
            const response =
                redirectWithError(
                    appUrl,
                    googleError ===
                    "access_denied"
                        ? "cancelled"
                        : "google_error"
                );

            clearGoogleCookies(
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
                GOOGLE_STATE_COOKIE
            )?.value;

        const codeVerifier =
            request.cookies.get(
                GOOGLE_VERIFIER_COOKIE
            )?.value;

        if (
            !code ||
            !returnedState ||
            !savedState ||
            !codeVerifier
        ) {
            const response =
                redirectWithError(
                    appUrl,
                    "invalid_request"
                );

            clearGoogleCookies(
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
                    "invalid_state"
                );

            clearGoogleCookies(
                response,
                secure
            );

            return response;
        }

        const redirectUri =
            `${appUrl}/api/auth/google/callback`;

        /*
         * Exchange Google's authorization
         * code for an access token.
         */
        const tokenResponse =
            await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },

                    body:
                        new URLSearchParams({
                            code,
                            client_id:
                            clientId,
                            client_secret:
                            clientSecret,
                            redirect_uri:
                            redirectUri,
                            grant_type:
                                "authorization_code",
                            code_verifier:
                            codeVerifier,
                        }),

                    cache: "no-store",
                }
            );

        const tokenData =
            (await tokenResponse.json()) as
                GoogleTokenResponse;

        if (
            !tokenResponse.ok ||
            !tokenData.access_token
        ) {
            console.error(
                "GOOGLE TOKEN ERROR:",
                tokenData.error,
                tokenData.error_description
            );

            const response =
                redirectWithError(
                    appUrl,
                    "token_exchange_failed"
                );

            clearGoogleCookies(
                response,
                secure
            );

            return response;
        }

        /*
         * Get the authenticated Google
         * user's identity.
         */
        const userResponse =
            await fetch(
                "https://openidconnect.googleapis.com/v1/userinfo",
                {
                    headers: {
                        Authorization:
                            `Bearer ${tokenData.access_token}`,
                    },

                    cache: "no-store",
                }
            );

        if (!userResponse.ok) {
            const response =
                redirectWithError(
                    appUrl,
                    "profile_failed"
                );

            clearGoogleCookies(
                response,
                secure
            );

            return response;
        }

        const googleUser =
            (await userResponse.json()) as
                GoogleUser;

        if (
            !googleUser.sub ||
            !googleUser.email ||
            googleUser.email_verified !== true
        ) {
            const response =
                redirectWithError(
                    appUrl,
                    "email_not_verified"
                );

            clearGoogleCookies(
                response,
                secure
            );

            return response;
        }

        const email =
            googleUser.email
                .trim()
                .toLowerCase();

        const googleAccountId =
            googleUser.sub;

        const now =
            new Date();

        /*
         * Find existing Google account,
         * link by verified email,
         * or create a new Foodly user.
         */
        const user =
            await prisma.$transaction(
                async (tx) => {
                    const existingOAuth =
                        await tx.oAuthAccount
                            .findUnique({
                                where: {
                                    provider_providerAccountId:
                                        {
                                            provider:
                                                "google",
                                            providerAccountId:
                                            googleAccountId,
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

                                emailVerifiedAt:
                                    existingOAuth.user
                                        .emailVerifiedAt ??
                                    now,

                                avatarUrl:
                                    existingOAuth.user
                                        .avatarUrl ??
                                    googleUser.picture ??
                                    null,
                            },
                        });
                    }

                    /*
                     * No Google account is linked
                     * yet. Check whether a Foodly
                     * account already uses this
                     * verified email.
                     */
                    const existingUser =
                        await tx.user.findUnique({
                            where: {
                                email,
                            },
                        });

                    if (existingUser) {
                        if (
                            !existingUser.isActive
                        ) {
                            throw new Error(
                                "ACCOUNT_DISABLED"
                            );
                        }

                        await tx.oAuthAccount.create({
                            data: {
                                provider:
                                    "google",

                                providerAccountId:
                                googleAccountId,

                                userId:
                                existingUser.id,
                            },
                        });

                        return tx.user.update({
                            where: {
                                id:
                                existingUser.id,
                            },

                            data: {
                                lastLoginAt: now,

                                emailVerifiedAt:
                                    existingUser
                                        .emailVerifiedAt ??
                                    now,

                                avatarUrl:
                                    existingUser
                                        .avatarUrl ??
                                    googleUser.picture ??
                                    null,
                            },
                        });
                    }

                    /*
                     * Brand-new Google user.
                     *
                     * passwordHash is omitted
                     * because it is String? now.
                     */
                    const newUser =
                        await tx.user.create({
                            data: {
                                name:
                                    googleUser.name
                                        ?.trim() ||
                                    email.split("@")[0] ||
                                    "Foodly User",

                                email,

                                avatarUrl:
                                    googleUser.picture ??
                                    null,

                                emailVerifiedAt:
                                now,

                                lastLoginAt:
                                now,
                            },
                        });

                    await tx.oAuthAccount.create({
                        data: {
                            provider:
                                "google",

                            providerAccountId:
                            googleAccountId,

                            userId:
                            newUser.id,
                        },
                    });

                    return newUser;
                }
            );

        /*
         * Create Foodly's own refresh
         * session.
         *
         * Google is only used to prove
         * identity. From here on, the
         * normal Foodly auth system is used.
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

        /*
         * AuthProvider already refreshes
         * the access token on page load,
         * so the callback only needs to
         * establish the HttpOnly refresh
         * session.
         */
        const response =
            NextResponse.redirect(
                new URL(
                    "/profile?oauth=google",
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

        clearGoogleCookies(
            response,
            secure
        );

        return response;
    } catch (error) {
        console.error(
            "GOOGLE OAUTH CALLBACK ERROR:",
            error
        );

        const reason =
            error instanceof Error &&
            error.message ===
            "ACCOUNT_DISABLED"
                ? "account_disabled"
                : "failed";

        const response =
            redirectWithError(
                appUrl,
                reason
            );

        clearGoogleCookies(
            response,
            secure
        );

        return response;
    }
}