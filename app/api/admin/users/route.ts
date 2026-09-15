import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";

const roles = ["CUSTOMER", "PARTNER", "ADMIN"] as const;

export async function GET(request: Request) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            },
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

        return NextResponse.json({ users });
    } catch (error) {
        console.error("ADMIN USERS ERROR:", error);

        return NextResponse.json(
            { error: "Could not load users." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const body = await request.json();

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const phone = String(body.phone || "").trim() || null;
        const password = String(body.password || "");
        const role = String(body.role || "CUSTOMER");

        if (!name) {
            return NextResponse.json(
                { error: "Name is required." },
                { status: 400 }
            );
        }

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Valid email is required." },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        if (!roles.includes(role as (typeof roles)[number])) {
            return NextResponse.json(
                { error: "Invalid role." },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "A user with this email already exists." },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                passwordHash,
                role: role as (typeof roles)[number],
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("ADMIN CREATE USER ERROR:", error);

        return NextResponse.json(
            { error: "Could not create user." },
            { status: 500 }
        );
    }
}