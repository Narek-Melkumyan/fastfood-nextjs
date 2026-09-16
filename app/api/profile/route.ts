import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json(
                {
                    message: "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        let payload;

        try {
            payload = await verifyAccessToken(token);
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

        const userId = payload.userId;

        const body = await request.json();

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const phone =
            typeof body.phone === "string"
                ? body.phone.trim()
                : "";

        if (name.length < 2) {
            return NextResponse.json(
                {
                    message: "Name must be at least 2 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                {
                    message: "Name is too long.",
                },
                {
                    status: 400,
                }
            );
        }

        if (phone.length > 30) {
            return NextResponse.json(
                {
                    message: "Phone number is too long.",
                },
                {
                    status: 400,
                }
            );
        }

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    isActive: true,
                },
            });

        if (!existingUser) {
            return NextResponse.json(
                {
                    message: "User not found.",
                },
                {
                    status: 404,
                }
            );
        }

        if (!existingUser.isActive) {
            return NextResponse.json(
                {
                    message: "This account is disabled.",
                },
                {
                    status: 403,
                }
            );
        }

        const user =
            await prisma.user.update({
                where: {
                    id: userId,
                },

                data: {
                    name,
                    phone:
                        phone.length > 0
                            ? phone
                            : null,
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
                    updatedAt: true,
                },
            });

        return NextResponse.json({
            message: "Profile updated successfully.",
            user,
        });
    } catch (error) {
        console.error(
            "PROFILE UPDATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message: "Unable to update profile.",
            },
            {
                status: 500,
            }
        );
    }
}