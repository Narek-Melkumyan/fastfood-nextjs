import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendEmailVerification } from "@/lib/emailVerification";

import {
    createAccessToken,
    generateRefreshToken,
    getRefreshExpiration,
    hashRefreshToken,
    REFRESH_COOKIE_NAME,
    refreshCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const phone =
            typeof body.phone === "string"
                ? body.phone.trim()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        const remember = body.remember === true;

        if (!name || !email || !password) {
            return NextResponse.json(
                {
                    message: "Name, email and password are required.",
                },
                {
                    status: 400,
                }
            );
        }

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

        if (password.length < 8) {
            return NextResponse.json(
                {
                    message: "Password must be at least 8 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    message: "Enter a valid email address.",
                },
                {
                    status: 400,
                }
            );
        }

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                },
            });

        if (existingUser) {
            return NextResponse.json(
                {
                    message: "An account with this email already exists.",
                },
                {
                    status: 409,
                }
            );
        }

        const passwordHash =
            await hash(password, 12);

        const refreshToken =
            generateRefreshToken();

        const expiresAt =
            getRefreshExpiration(remember);

        const userAgent =
            request.headers.get("user-agent");

        const forwardedFor =
            request.headers.get("x-forwarded-for");

        const ipAddress =
            forwardedFor
                ?.split(",")[0]
                ?.trim() ?? null;

        const user =
            await prisma.$transaction(
                async (tx) => {
                    const newUser =
                        await tx.user.create({
                            data: {
                                name,
                                email,
                                phone:
                                    phone.length > 0
                                        ? phone
                                        : null,
                                passwordHash,
                            },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                avatarUrl: true,
                                role: true,
                            },
                        });

                    await tx.refreshToken.create({
                        data: {
                            tokenHash:
                                hashRefreshToken(
                                    refreshToken
                                ),
                            userId:
                            newUser.id,
                            expiresAt,
                            remember,
                            userAgent,
                            ipAddress,
                        },
                    });

                    return newUser;
                }
            );

        await sendEmailVerification({
            id: user.id,
            email: user.email,
        }).catch((error) => {
            console.error(
                "REGISTER VERIFICATION EMAIL ERROR:",
                error
            );
        });

        const accessToken =
            await createAccessToken({
                id: user.id,
                email: user.email,
                role: user.role,
            });

        const response =
            NextResponse.json(
                {
                    accessToken,
                    user,
                },
                {
                    status: 201,
                }
            );

        response.cookies.set(
            REFRESH_COOKIE_NAME,
            refreshToken,
            refreshCookieOptions(remember)
        );

        return response;
    } catch (error: unknown) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return NextResponse.json(
                {
                    message:
                        "An account with this email already exists.",
                },
                {
                    status: 409,
                }
            );
        }

        return NextResponse.json(
            {
                message:
                    "Something went wrong while creating your account.",
            },
            {
                status: 500,
            }
        );
    }
}