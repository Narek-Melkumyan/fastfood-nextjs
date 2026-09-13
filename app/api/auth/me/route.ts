import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json(
                {
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }

        const payload =
            await verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId,
            },

            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                isActive: true,
                emailVerifiedAt: true,
                createdAt: true,
            },
        });

        if (!user || !user.isActive) {
            return NextResponse.json(
                {
                    message: "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }

        return NextResponse.json({
            user,
        });
    } catch {
        return NextResponse.json(
            {
                message: "Invalid or expired access token.",
            },
            {
                status: 401,
            }
        );
    }
}