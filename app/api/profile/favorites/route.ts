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
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const auth = await verifyAccessToken(token);

        const favorites = await prisma.favorite.findMany({
            where: {
                userId: auth.userId,
            },

            orderBy: {
                createdAt: "desc",
            },

            select: {
                id: true,
                createdAt: true,

                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,

                        price: true,
                        currency: true,

                        imageUrl: true,
                        badge: true,

                        ratingAverage: true,
                        reviewCount: true,

                        isAvailable: true,

                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },

                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            favorites,
        });
    } catch (error) {
        console.error(
            "GET FAVORITES ERROR:",
            error
        );

        return NextResponse.json(
            { message: "Unauthorized." },
            { status: 401 }
        );
    }
}