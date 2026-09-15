import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { deleteR2Object } from "@/lib/r2";
import { mediaKeyFromUrl } from "@/lib/media";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const { id } = await params;
        const restaurantId = Number(id);

        if (
            !Number.isInteger(restaurantId) ||
            restaurantId <= 0
        ) {
            return NextResponse.json(
                { error: "Invalid restaurant ID." },
                { status: 400 }
            );
        }

        const current = await prisma.restaurant.findUnique({
            where: {
                id: restaurantId,
            },
            select: {
                id: true,
                logoUrl: true,
                coverImageUrl: true,
            },
        });

        if (!current) {
            return NextResponse.json(
                { error: "Restaurant not found." },
                { status: 404 }
            );
        }

        const body = await request.json();

        const data: {
            name?: string;
            description?: string | null;
            address?: string;
            city?: string;
            logoUrl?: string | null;
            coverImageUrl?: string | null;
            deliveryMinMinutes?: number;
            deliveryMaxMinutes?: number;
            deliveryFee?: number;
            minimumOrder?: number;
            isAcceptingOrders?: boolean;
            isActive?: boolean;
        } = {};

        if (body.name !== undefined) {
            const name = String(body.name).trim();

            if (!name) {
                return NextResponse.json(
                    { error: "Restaurant name is required." },
                    { status: 400 }
                );
            }

            data.name = name;
        }

        if (body.description !== undefined) {
            data.description =
                String(body.description).trim() || null;
        }

        if (body.address !== undefined) {
            const address = String(body.address).trim();

            if (!address) {
                return NextResponse.json(
                    { error: "Address is required." },
                    { status: 400 }
                );
            }

            data.address = address;
        }

        if (body.city !== undefined) {
            data.city =
                String(body.city).trim() || "Yerevan";
        }

        if (body.logoUrl !== undefined) {
            data.logoUrl =
                String(body.logoUrl).trim() || null;
        }

        if (body.coverImageUrl !== undefined) {
            data.coverImageUrl =
                String(body.coverImageUrl).trim() || null;
        }

        if (body.deliveryMinMinutes !== undefined) {
            const value = Number(body.deliveryMinMinutes);

            if (!Number.isInteger(value) || value < 0) {
                return NextResponse.json(
                    { error: "Invalid minimum delivery time." },
                    { status: 400 }
                );
            }

            data.deliveryMinMinutes = value;
        }

        if (body.deliveryMaxMinutes !== undefined) {
            const value = Number(body.deliveryMaxMinutes);

            if (!Number.isInteger(value) || value < 0) {
                return NextResponse.json(
                    { error: "Invalid maximum delivery time." },
                    { status: 400 }
                );
            }

            data.deliveryMaxMinutes = value;
        }

        if (body.deliveryFee !== undefined) {
            const value = Number(body.deliveryFee);

            if (!Number.isInteger(value) || value < 0) {
                return NextResponse.json(
                    { error: "Invalid delivery fee." },
                    { status: 400 }
                );
            }

            data.deliveryFee = value;
        }

        if (body.minimumOrder !== undefined) {
            const value = Number(body.minimumOrder);

            if (!Number.isInteger(value) || value < 0) {
                return NextResponse.json(
                    { error: "Invalid minimum order." },
                    { status: 400 }
                );
            }

            data.minimumOrder = value;
        }

        if (body.isAcceptingOrders !== undefined) {
            data.isAcceptingOrders =
                Boolean(body.isAcceptingOrders);
        }

        if (body.isActive !== undefined) {
            data.isActive = Boolean(body.isActive);
        }

        if (
            data.deliveryMinMinutes !== undefined &&
            data.deliveryMaxMinutes !== undefined &&
            data.deliveryMaxMinutes <
            data.deliveryMinMinutes
        ) {
            return NextResponse.json(
                { error: "Maximum delivery time is too small." },
                { status: 400 }
            );
        }

        const restaurant = await prisma.restaurant.update({
            where: {
                id: restaurantId,
            },
            data,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                logoUrl: true,
                coverImageUrl: true,
                address: true,
                city: true,
                deliveryMinMinutes: true,
                deliveryMaxMinutes: true,
                deliveryFee: true,
                minimumOrder: true,
                isAcceptingOrders: true,
                isActive: true,
                createdAt: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (
            data.logoUrl !== undefined &&
            current.logoUrl &&
            current.logoUrl !== restaurant.logoUrl
        ) {
            const oldKey =
                mediaKeyFromUrl(current.logoUrl);

            if (oldKey) {
                deleteR2Object(oldKey).catch(console.error);
            }
        }

        if (
            data.coverImageUrl !== undefined &&
            current.coverImageUrl &&
            current.coverImageUrl !==
            restaurant.coverImageUrl
        ) {
            const oldKey =
                mediaKeyFromUrl(current.coverImageUrl);

            if (oldKey) {
                deleteR2Object(oldKey).catch(console.error);
            }
        }

        return NextResponse.json({
            success: true,
            restaurant,
        });
    } catch (error) {
        console.error(
            "ADMIN UPDATE RESTAURANT ERROR:",
            error
        );

        return NextResponse.json(
            { error: "Could not update restaurant." },
            { status: 500 }
        );
    }
}