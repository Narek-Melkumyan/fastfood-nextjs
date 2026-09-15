import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

import {
    EmailVerificationCooldownError,
    sendEmailVerification,
} from "@/lib/emailVerification";

export async function POST(request: Request) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            );
        }

        let payload;

        try {
            payload = await verifyAccessToken(token);
        } catch {
            return NextResponse.json(
                { error: "Invalid access token." },
                { status: 401 }
            );
        }

        const userId = payload.userId;
        
        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json(
                { error: "Invalid access token." },
                { status: 401 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                emailVerifiedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        if (user.emailVerifiedAt) {
            return NextResponse.json({
                verified: true,
                message: "Your email is already verified.",
            });
        }

        await sendEmailVerification({
            id: user.id,
            email: user.email,
        });

        return NextResponse.json({
            success: true,
            message: "Verification email sent. Check your inbox.",
        });
    } catch (error) {
        if (error instanceof EmailVerificationCooldownError) {
            return NextResponse.json(
                {
                    error: `Please wait ${error.retryAfterSeconds} seconds before sending another email.`,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(error.retryAfterSeconds),
                    },
                }
            );
        }

        console.error("SEND EMAIL VERIFICATION ERROR:", error);

        return NextResponse.json(
            {
                error: "Could not send verification email.",
            },
            {
                status: 500,
            }
        );
    }
}