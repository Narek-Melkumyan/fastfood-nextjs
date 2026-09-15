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
    const base = slugify(value) || "product";

    let slug = base;
    let number = 2;

    while (
        await prisma.product.findUnique({
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

        const [products, restaurants, categories] =
            await Promise.all([
                prisma.product.findMany({
                    orderBy: [
                        {
                            sortOrder: "asc",
                        },
                        {
                            createdAt: "desc",
                        },
                    ],
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        price: true,
                        currency: true,
                        imageUrl: true,
                        ingredients: true,
                        allergens: true,
                        badge: true,
                        ratingAverage: true,
                        reviewCount: true,
                        isAvailable: true,
                        isFeatured: true,
                        isActive: true,
                        sortOrder: true,
                        createdAt: true,

                        restaurant: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                isActive: true,
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
                }),

                prisma.restaurant.findMany({
                    orderBy: {
                        name: "asc",
                    },
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                }),

                prisma.productCategory.findMany({
                    where: {
                        isActive: true,
                    },
                    orderBy: [
                        {
                            sortOrder: "asc",
                        },
                        {
                            name: "asc",
                        },
                    ],
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                }),
            ]);

        return NextResponse.json({
            products,
            restaurants,
            categories,
        });
    } catch (error) {
        console.error(
            "ADMIN PRODUCTS ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not load products.",
            },
            {
                status: 500,
            }
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

        const name =
            String(body.name || "").trim();

        const description =
            String(body.description || "").trim() ||
            null;

        const imageUrl =
            String(body.imageUrl || "").trim() ||
            null;

        const badge =
            String(body.badge || "").trim() ||
            null;

        const price = Number(body.price);
        const restaurantId = Number(body.restaurantId);
        const categoryId = Number(body.categoryId);
        const sortOrder = Number(body.sortOrder || 0);

        const ingredients = Array.isArray(
            body.ingredients
        )
            ? body.ingredients
                .map((value: unknown) =>
                    String(value).trim()
                )
                .filter(Boolean)
            : [];

        const allergens = Array.isArray(
            body.allergens
        )
            ? body.allergens
                .map((value: unknown) =>
                    String(value).trim()
                )
                .filter(Boolean)
            : [];

        if (!name) {
            return NextResponse.json(
                {
                    error:
                        "Product name is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(price) ||
            price < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid product price.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(restaurantId) ||
            restaurantId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Restaurant is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(categoryId) ||
            categoryId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Category is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const [restaurant, category] =
            await Promise.all([
                prisma.restaurant.findUnique({
                    where: {
                        id: restaurantId,
                    },
                    select: {
                        id: true,
                    },
                }),

                prisma.productCategory.findUnique({
                    where: {
                        id: categoryId,
                    },
                    select: {
                        id: true,
                    },
                }),
            ]);

        if (!restaurant) {
            return NextResponse.json(
                {
                    error:
                        "Restaurant not found.",
                },
                {
                    status: 404,
                }
            );
        }

        if (!category) {
            return NextResponse.json(
                {
                    error:
                        "Category not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const slug = await createUniqueSlug(
            String(body.slug || "").trim() ||
            name
        );

        const product =
            await prisma.product.create({
                data: {
                    name,
                    slug,
                    description,
                    price,
                    currency: "AMD",
                    imageUrl,
                    ingredients,
                    allergens,
                    badge,
                    restaurantId,
                    categoryId,
                    sortOrder:
                        Number.isInteger(sortOrder)
                            ? sortOrder
                            : 0,
                    isAvailable:
                        body.isAvailable !== false,
                    isFeatured:
                        body.isFeatured === true,
                    isActive:
                        body.isActive !== false,
                },

                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    price: true,
                    currency: true,
                    imageUrl: true,
                    ingredients: true,
                    allergens: true,
                    badge: true,
                    ratingAverage: true,
                    reviewCount: true,
                    isAvailable: true,
                    isFeatured: true,
                    isActive: true,
                    sortOrder: true,
                    createdAt: true,

                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isActive: true,
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
            });

        return NextResponse.json(
            {
                success: true,
                product,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "ADMIN CREATE PRODUCT ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not create product.",
            },
            {
                status: 500,
            }
        );
    }
}