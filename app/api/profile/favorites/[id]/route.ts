import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

export async function DELETE(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const token =
            getBearerToken(request);

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const auth =
            await verifyAccessToken(token);

        const { id } =
            await context.params;

        const favoriteId =
            Number(id);

        if (!Number.isInteger(favoriteId)) {
            return NextResponse.json(
                { message: "Invalid favorite." },
                { status: 400 }
            );
        }

        const favorite =
            await prisma.favorite.findFirst({
                where: {
                    id: favoriteId,
                    userId: auth.userId,
                },
            });

        if (!favorite) {
            return NextResponse.json(
                {
                    message:
                        "Favorite not found.",
                },
                {
                    status: 404,
                }
            );
        }

        await prisma.favorite.delete({
            where: {
                id: favorite.id,
            },
        });

        return NextResponse.json({
            message: "Favorite removed.",
        });
    } catch (error) {
        console.error(
            "DELETE FAVORITE:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to remove favorite.",
            },
            {
                status: 500,
            }
        );
    }
}