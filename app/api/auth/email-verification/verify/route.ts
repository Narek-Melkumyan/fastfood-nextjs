import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashEmailVerificationToken } from "@/lib/emailVerification";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const token = String(body.token || "").trim();

        if (!token) {
            return NextResponse.json(
                { error: "Verification token is required." },
                { status: 400 }
            );
        }

        const tokenHash = hashEmailVerificationToken(token);

        const verificationToken =
            await prisma.emailVerificationToken.findUnique({
                where: {
                    tokenHash,
                },
                select: {
                    id: true,
                    userId: true,
                    expiresAt: true,
                    usedAt: true,

                    user: {
                        select: {
                            isActive: true,
                            emailVerifiedAt: true,
                        },
                    },
                },
            });

        if (!verificationToken) {
            return NextResponse.json(
                {
                    error: "This verification link is invalid.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!verificationToken.user.isActive) {
            return NextResponse.json(
                {
                    error: "This account is disabled.",
                },
                {
                    status: 403,
                }
            );
        }

        if (verificationToken.user.emailVerifiedAt) {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "Your email is already verified.",
            });
        }

        if (verificationToken.usedAt) {
            return NextResponse.json(
                {
                    error: "This verification link has already been used.",
                },
                {
                    status: 400,
                }
            );
        }

        if (verificationToken.expiresAt <= new Date()) {
            return NextResponse.json(
                {
                    error: "This verification link has expired.",
                },
                {
                    status: 400,
                }
            );
        }

        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {
                    id: verificationToken.userId,
                },
                data: {
                    emailVerifiedAt: now,
                },
            });

            await tx.emailVerificationToken.update({
                where: {
                    id: verificationToken.id,
                },
                data: {
                    usedAt: now,
                },
            });

            await tx.emailVerificationToken.deleteMany({
                where: {
                    userId: verificationToken.userId,
                    id: {
                        not: verificationToken.id,
                    },
                    usedAt: null,
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: "Your email has been verified successfully.",
        });
    } catch (error) {
        console.error("VERIFY EMAIL ERROR:", error);

        return NextResponse.json(
            {
                error: "Could not verify email.",
            },
            {
                status: 500,
            }
        );
    }
}