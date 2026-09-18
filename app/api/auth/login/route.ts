import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";

import {
    createAccessToken,
    generateRefreshToken,
    getRefreshExpiration,
    hashRefreshToken,
    REFRESH_COOKIE_NAME,
    refreshCookieOptions,
} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        const remember = body.remember === true;

        if (!email || !password) {
            return NextResponse.json(
                {
                    message: "Email and password are required.",
                },
                {
                    status: 400,
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                avatarUrl: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    message: "Invalid email or password.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    message: "Your account is disabled.",
                },
                {
                    status: 403,
                }
            );
        }

        if (!user.passwordHash) {
            return NextResponse.json(
                {
                    message: "Invalid email or password.",
                },
                {
                    status: 401,
                }
            );
        }

        const passwordMatches = await compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return NextResponse.json(
                {
                    message: "Invalid email or password.",
                },
                {
                    status: 401,
                }
            );
        }

        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashRefreshToken(refreshToken);

        const expiresAt = getRefreshExpiration(remember);

        const userAgent = request.headers.get("user-agent");

        const forwardedFor =
            request.headers.get("x-forwarded-for");

        const ipAddress =
            forwardedFor?.split(",")[0]?.trim() ?? null;

        await prisma.$transaction([
            prisma.refreshToken.create({
                data: {
                    tokenHash: refreshTokenHash,
                    userId: user.id,
                    userAgent,
                    ipAddress,
                    expiresAt,
                    remember,
                },
            }),

            prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    lastLoginAt: new Date(),
                },
            }),
        ]);

        const accessToken = await createAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json({
            accessToken,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role,
            },
        });

        response.cookies.set(
            REFRESH_COOKIE_NAME,
            refreshToken,
            refreshCookieOptions(remember)
        );

        return response;
    } catch (error) {
        console.error("LOGIN ERROR:", error);

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