import {
    NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import {
    prisma,
} from "@/lib/prisma";

import {
    hashPasswordResetToken,
} from "@/lib/passwordReset";

type ResetPasswordBody = {
    token?: string;
    password?: string;
};

export async function POST(
    request: Request
) {
    try {
        /*
         * =====================================
         * BODY
         * =====================================
         */

        const body =
            (await request.json()) as
                ResetPasswordBody;

        const token =
            body.token
                ?.trim()
                .toUpperCase();

        const password =
            body.password || "";

        /*
         * =====================================
         * VALIDATION
         * =====================================
         */

        if (!token) {
            return NextResponse.json(
                {
                    error:
                        "Reset token is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            password.length < 8
        ) {
            return NextResponse.json(
                {
                    error:
                        "Password must be at least 8 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================
         * HASH PROVIDED TOKEN
         * =====================================
         */

        const tokenHash =
            hashPasswordResetToken(
                token
            );

        /*
         * =====================================
         * FIND TOKEN
         * =====================================
         */

        const resetToken =
            await prisma
                .passwordResetToken
                .findUnique({
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
                                id: true,
                                isActive: true,
                            },
                        },
                    },
                });

        /*
         * =====================================
         * INVALID TOKEN
         * =====================================
         */

        if (!resetToken) {
            return NextResponse.json(
                {
                    error:
                        "Invalid or expired reset token.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Already used.
         */

        if (
            resetToken.usedAt
        ) {
            return NextResponse.json(
                {
                    error:
                        "This reset token has already been used.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Expired.
         */

        if (
            resetToken.expiresAt <
            new Date()
        ) {
            await prisma
                .passwordResetToken
                .delete({
                    where: {
                        id:
                        resetToken.id,
                    },
                });

            return NextResponse.json(
                {
                    error:
                        "This reset token has expired. Request a new one.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Account disabled.
         */

        if (
            !resetToken.user
                .isActive
        ) {
            return NextResponse.json(
                {
                    error:
                        "This account is not available.",
                },
                {
                    status: 403,
                }
            );
        }

        /*
         * =====================================
         * HASH NEW PASSWORD
         * =====================================
         */

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        /*
         * =====================================
         * TRANSACTION
         * =====================================
         */

        await prisma.$transaction(
            async (tx) => {
                /*
                 * Update password.
                 */

                await tx.user.update({
                    where: {
                        id:
                        resetToken.userId,
                    },

                    data: {
                        passwordHash,
                    },
                });

                /*
                 * Revoke all existing login
                 * refresh tokens.
                 *
                 * This logs out existing sessions
                 * after a password reset.
                 */

                await tx.refreshToken.updateMany({
                    where: {
                        userId:
                        resetToken.userId,

                        revokedAt:
                            null,
                    },

                    data: {
                        revokedAt:
                            new Date(),
                    },
                });

                /*
                 * Mark current reset token used.
                 */

                await tx
                    .passwordResetToken
                    .update({
                        where: {
                            id:
                            resetToken.id,
                        },

                        data: {
                            usedAt:
                                new Date(),
                        },
                    });

                /*
                 * Remove any other old reset
                 * tokens belonging to this user.
                 */

                await tx
                    .passwordResetToken
                    .deleteMany({
                        where: {
                            userId:
                            resetToken.userId,

                            id: {
                                not:
                                resetToken.id,
                            },
                        },
                    });
            }
        );

        

        return NextResponse.json({
            success: true,

            message:
                "Your password has been updated.",
        });
    } catch (error) {
        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not reset your password.",
            },
            {
                status: 500,
            }
        );
    }
}