import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";

const roles = ["CUSTOMER", "PARTNER", "ADMIN"] as const;

export async function PATCH(
    request: Request,
    context: {
        params: Promise<{ id: string }>;
    }
) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const { id } = await context.params;
        const userId = Number(id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json(
                { error: "Invalid user ID." },
                { status: 400 }
            );
        }

        const body = await request.json();

        const existingUser = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                role: true,
                isActive: true,
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found." },
                { status: 404 }
            );
        }

        if (userId === admin.id) {
            if (
                body.role !== undefined &&
                body.role !== "ADMIN"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "You cannot remove your own admin role.",
                    },
                    { status: 400 }
                );
            }

            if (body.isActive === false) {
                return NextResponse.json(
                    {
                        error:
                            "You cannot disable your own account.",
                    },
                    { status: 400 }
                );
            }
        }

        const data: {
            role?: (typeof roles)[number];
            isActive?: boolean;
        } = {};

        if (body.role !== undefined) {
            if (!roles.includes(body.role)) {
                return NextResponse.json(
                    { error: "Invalid role." },
                    { status: 400 }
                );
            }

            data.role = body.role;
        }

        if (body.isActive !== undefined) {
            data.isActive = Boolean(body.isActive);
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: "Nothing to update." },
                { status: 400 }
            );
        }

        const user = await prisma.user.update({
            where: {
                id: userId,
            },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                emailVerifiedAt: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(
            "ADMIN UPDATE USER ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not update user.",
            },
            { status: 500 }
        );
    }
}