import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const REFRESH_COOKIE_NAME = "food_refresh_token";

export const ACCESS_TOKEN_SECONDS = 15 * 60;

export const ONE_DAY_SECONDS = 24 * 60 * 60;
export const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

function getAccessSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is missing");
    }

    return new TextEncoder().encode(secret);
}

function getRefreshPepper() {
    const pepper = process.env.REFRESH_TOKEN_PEPPER;

    if (!pepper) {
        throw new Error("REFRESH_TOKEN_PEPPER is missing");
    }

    return pepper;
}

export async function createAccessToken(user: {
    id: number;
    email: string;
    role: string;
}) {
    return new SignJWT({
        email: user.email,
        role: user.role,
    })
        .setProtectedHeader({
            alg: "HS256",
            typ: "JWT",
        })
        .setSubject(String(user.id))
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(
        token,
        getAccessSecret(),
        {
            algorithms: ["HS256"],
        }
    );

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
        throw new Error("Invalid token subject");
    }

    return {
        userId,
        email: String(payload.email ?? ""),
        role: String(payload.role ?? ""),
    };
}

export function generateRefreshToken() {
    return randomBytes(64).toString("base64url");
}

export function hashRefreshToken(token: string) {
    return createHash("sha256")
        .update(`${token}:${getRefreshPepper()}`)
        .digest("hex");
}

export function getBearerToken(request: Request) {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
        return null;
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
        return null;
    }

    return token;
}

export function getRefreshExpiration(remember: boolean) {
    const seconds = remember
        ? SEVEN_DAYS_SECONDS
        : ONE_DAY_SECONDS;

    return new Date(Date.now() + seconds * 1000);
}

export function refreshCookieOptions(remember: boolean) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",

        ...(remember
            ? {
                maxAge: SEVEN_DAYS_SECONDS,
            }
            : {}),
    };
}