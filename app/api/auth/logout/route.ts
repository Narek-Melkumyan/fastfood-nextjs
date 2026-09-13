import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    hashRefreshToken,
    REFRESH_COOKIE_NAME,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const refreshToken =
            request.cookies.get(REFRESH_COOKIE_NAME)?.value;

        if (refreshToken) {
            const tokenHash =
                hashRefreshToken(refreshToken);

            await prisma.refreshToken.updateMany({
                where: {
                    tokenHash,
                    revokedAt: null,
                },

                data: {
                    revokedAt: new Date(),
                },
            });
        }

        const response = NextResponse.json({
            message: "Logged out.",
        });

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
    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        return NextResponse.json(
            {
                message: "Something went wrong.",
            },
            {
                status: 500,
            }
        );
    }
}