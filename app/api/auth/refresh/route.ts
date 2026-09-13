import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    createAccessToken,
    generateRefreshToken,
    getRefreshExpiration,
    hashRefreshToken,
    REFRESH_COOKIE_NAME,
    refreshCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

function unauthorizedResponse() {
    const response = NextResponse.json(
        {
            message: "Session expired.",
        },
        {
            status: 401,
        }
    );

    response.cookies.set(
        REFRESH_COOKIE_NAME,
        "",
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        }
    );

    return response;
}

export async function POST(request: NextRequest) {
    try {
        const refreshToken =
            request.cookies.get(REFRESH_COOKIE_NAME)?.value;

        if (!refreshToken) {
            return unauthorizedResponse();
        }

        const tokenHash = hashRefreshToken(refreshToken);

        const storedToken =
            await prisma.refreshToken.findUnique({
                where: {
                    tokenHash,
                },

                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
                            isActive: true,
                        },
                    },
                },
            });

        if (!storedToken) {
            return unauthorizedResponse();
        }

        if (storedToken.revokedAt) {
            return unauthorizedResponse();
        }

        if (storedToken.expiresAt <= new Date()) {
            return unauthorizedResponse();
        }

        if (!storedToken.user.isActive) {
            return unauthorizedResponse();
        }


        const newRefreshToken = generateRefreshToken();

        const newRefreshTokenHash =
            hashRefreshToken(newRefreshToken);

        const newExpiresAt =
            getRefreshExpiration(storedToken.remember);

        const now = new Date();

        const rotated = await prisma.$transaction(
            async (tx) => {
                const revokeResult =
                    await tx.refreshToken.updateMany({
                        where: {
                            id: storedToken.id,
                            revokedAt: null,
                        },
                        data: {
                            revokedAt: now,
                        },
                    });

                if (revokeResult.count !== 1) {
                    return false;
                }

                await tx.refreshToken.create({
                    data: {
                        tokenHash: newRefreshTokenHash,
                        userId: storedToken.userId,
                        userAgent:
                            request.headers.get("user-agent"),
                        ipAddress:
                            request.headers
                                .get("x-forwarded-for")
                                ?.split(",")[0]
                                ?.trim() ?? null,
                        expiresAt: newExpiresAt,
                        remember: storedToken.remember,
                    },
                });

                return true;
            }
        );

        if (!rotated) {
            return unauthorizedResponse();
        }

        const accessToken = await createAccessToken({
            id: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });

        const response = NextResponse.json({
            accessToken,

            user: {
                id: storedToken.user.id,
                name: storedToken.user.name,
                email: storedToken.user.email,
                avatarUrl: storedToken.user.avatarUrl,
                role: storedToken.user.role,
            },
        });

        response.cookies.set(
            REFRESH_COOKIE_NAME,
            newRefreshToken,
            refreshCookieOptions(storedToken.remember)
        );

        return response;
    } catch (error) {
        console.error("REFRESH ERROR:", error);

        return unauthorizedResponse();
    }
}