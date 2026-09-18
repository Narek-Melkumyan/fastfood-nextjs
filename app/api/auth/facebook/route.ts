import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FACEBOOK_STATE_COOKIE =
    "food_facebook_oauth_state";

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

export async function GET() {
    try {
        const appId =
            process.env.FACEBOOK_APP_ID;

        if (!appId) {
            throw new Error(
                "FACEBOOK_APP_ID is not configured."
            );
        }

        const appUrl = getAppUrl();

        const redirectUri =
            `${appUrl}/api/auth/facebook/callback`;

        const state =
            randomBytes(32).toString("hex");

        const params =
            new URLSearchParams({
                client_id: appId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope: "email,public_profile",
                state,
                auth_type: "rerequest",
            });

        const facebookUrl =
            `https://www.facebook.com/dialog/oauth?${params.toString()}`;

        const response =
            NextResponse.redirect(
                facebookUrl
            );

        response.cookies.set(
            FACEBOOK_STATE_COOKIE,
            state,
            {
                httpOnly: true,
                secure:
                    appUrl.startsWith(
                        "https://"
                    ),
                sameSite: "lax",
                path:
                    "/api/auth/facebook/callback",
                maxAge: 10 * 60,
            }
        );

        return response;
    } catch (error) {
        console.error(
            "FACEBOOK OAUTH START ERROR:",
            error
        );

        const appUrl =
            process.env.APP_URL ||
            "http://localhost:3000";

        return NextResponse.redirect(
            new URL(
                "/login?oauth=facebook_configuration_error",
                appUrl
            )
        );
    }
}