import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(value: string) {
    const base = slugify(value) || "restaurant";
    let slug = base;
    let number = 2;

    while (
        await prisma.restaurant.findUnique({
            where: { slug },
            select: { id: true },
        })
        ) {
        slug = `${base}-${number}`;
        number++;
    }

    return slug;
}

export async function GET(request: Request) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const restaurants = await prisma.restaurant.findMany({
            orderBy: {
                createdAt: "desc",
            },
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

        return NextResponse.json({ restaurants });
    } catch (error) {
        console.error("ADMIN RESTAURANTS ERROR:", error);

        return NextResponse.json(
            { error: "Could not load restaurants." },
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
        const description =
            String(body.description || "").trim() || null;

        const address = String(body.address || "").trim();
        const city =
            String(body.city || "").trim() || "Yerevan";

        const logoUrl =
            String(body.logoUrl || "").trim() || null;

        const coverImageUrl =
            String(body.coverImageUrl || "").trim() || null;

        const deliveryMinMinutes = Number(
            body.deliveryMinMinutes
        );

        const deliveryMaxMinutes = Number(
            body.deliveryMaxMinutes
        );

        const deliveryFee = Number(body.deliveryFee);
        const minimumOrder = Number(body.minimumOrder);

        if (!name) {
            return NextResponse.json(
                { error: "Restaurant name is required." },
                { status: 400 }
            );
        }

        if (!address) {
            return NextResponse.json(
                { error: "Address is required." },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(deliveryMinMinutes) ||
            deliveryMinMinutes < 0 ||
            !Number.isInteger(deliveryMaxMinutes) ||
            deliveryMaxMinutes < deliveryMinMinutes
        ) {
            return NextResponse.json(
                { error: "Invalid delivery time." },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(deliveryFee) ||
            deliveryFee < 0 ||
            !Number.isInteger(minimumOrder) ||
            minimumOrder < 0
        ) {
            return NextResponse.json(
                { error: "Invalid price values." },
                { status: 400 }
            );
        }

        const slug = await createUniqueSlug(
            String(body.slug || "").trim() || name
        );

        const restaurant = await prisma.restaurant.create({
            data: {
                name,
                slug,
                description,
                address,
                city,
                logoUrl,
                coverImageUrl,
                deliveryMinMinutes,
                deliveryMaxMinutes,
                deliveryFee,
                minimumOrder,
                isAcceptingOrders:
                    body.isAcceptingOrders !== false,
                isActive: body.isActive !== false,
            },
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

        return NextResponse.json(
            {
                success: true,
                restaurant,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("ADMIN CREATE RESTAURANT ERROR:", error);

        return NextResponse.json(
            { error: "Could not create restaurant." },
            { status: 500 }
        );
    }
}