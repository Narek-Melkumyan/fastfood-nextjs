import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE = "food_google_oauth_state";
const GOOGLE_VERIFIER_COOKIE = "food_google_oauth_verifier";

function getAppUrl() {
    const appUrl = process.env.APP_URL?.replace(/\/$/, "");

    if (!appUrl) {
        throw new Error("APP_URL is not configured.");
    }

    return appUrl;
}

function base64Url(buffer: Buffer) {
    return buffer.toString("base64url");
}

export async function GET() {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            throw new Error("GOOGLE_CLIENT_ID is not configured.");
        }

        const appUrl = getAppUrl();

        const redirectUri = `${appUrl}/api/auth/google/callback`;

        const state = randomBytes(32).toString("hex");

        const codeVerifier = base64Url(
            randomBytes(64)
        );

        const codeChallenge = base64Url(
            createHash("sha256")
                .update(codeVerifier)
                .digest()
        );

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
            prompt: "select_account",
        });

        const googleUrl =
            `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        const response = NextResponse.redirect(
            googleUrl
        );

        const secure = appUrl.startsWith("https://");

        const cookieOptions = {
            httpOnly: true,
            secure,
            sameSite: "lax" as const,
            path: "/api/auth/google/callback",
            maxAge: 10 * 60,
        };

        response.cookies.set(
            GOOGLE_STATE_COOKIE,
            state,
            cookieOptions
        );

        response.cookies.set(
            GOOGLE_VERIFIER_COOKIE,
            codeVerifier,
            cookieOptions
        );

        return response;
    } catch (error) {
        console.error(
            "GOOGLE OAUTH START ERROR:",
            error
        );

        const appUrl =
            process.env.APP_URL ||
            "http://localhost:3000";

        return NextResponse.redirect(
            new URL(
                "/login?oauth=configuration_error",
                appUrl
            )
        );
    }
}