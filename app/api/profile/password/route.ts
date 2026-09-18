import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

export const runtime = "nodejs";

async function getAuthenticatedUser(
    request: Request
) {
    const token = getBearerToken(request);

    if (!token) {
        return null;
    }

    try {
        const payload =
            await verifyAccessToken(token);

        return prisma.user.findUnique({
            where: {
                id: payload.userId,
            },

            select: {
                id: true,
                email: true,
                passwordHash: true,
                isActive: true,
            },
        });
    } catch {
        return null;
    }
}

export async function GET(
    request: Request
) {
    try {
        const user =
            await getAuthenticatedUser(
                request
            );

        if (!user) {
            return NextResponse.json(
                {
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    message:
                        "This account is disabled.",
                },
                {
                    status: 403,
                }
            );
        }

        return NextResponse.json({
            hasPassword:
                Boolean(user.passwordHash),
        });
    } catch (error) {
        console.error(
            "PASSWORD STATUS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to load password status.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function PATCH(
    request: Request
) {
    try {
        const user =
            await getAuthenticatedUser(
                request
            );

        if (!user) {
            return NextResponse.json(
                {
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    message:
                        "This account is disabled.",
                },
                {
                    status: 403,
                }
            );
        }

        const body =
            await request.json();

        const currentPassword =
            typeof body.currentPassword ===
            "string"
                ? body.currentPassword
                : "";

        const newPassword =
            typeof body.newPassword ===
            "string"
                ? body.newPassword
                : "";

        if (newPassword.length < 8) {
            return NextResponse.json(
                {
                    message:
                        "New password must be at least 8 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        const hadPassword =
            Boolean(user.passwordHash);

        /*
         * Existing password account:
         * require current password.
         */
        if (user.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json(
                    {
                        message:
                            "Current password is required.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const currentMatches =
                await compare(
                    currentPassword,
                    user.passwordHash
                );

            if (!currentMatches) {
                return NextResponse.json(
                    {
                        message:
                            "Current password is incorrect.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const samePassword =
                await compare(
                    newPassword,
                    user.passwordHash
                );

            if (samePassword) {
                return NextResponse.json(
                    {
                        message:
                            "New password must be different from your current password.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        const passwordHash =
            await hash(
                newPassword,
                12
            );

        await prisma.user.update({
            where: {
                id: user.id,
            },

            data: {
                passwordHash,
            },
        });

        return NextResponse.json({
            message: hadPassword
                ? "Password updated successfully."
                : "Password created successfully.",
        });
    } catch (error) {
        console.error(
            "PASSWORD UPDATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to update password.",
            },
            {
                status: 500,
            }
        );
    }
}