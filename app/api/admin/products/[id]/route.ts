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
                {
                    error:
                        "Admin access required.",
                },
                {
                    status: 403,
                }
            );
        }

        const { id } = await params;
        const productId = Number(id);

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid product ID.",
                },
                {
                    status: 400,
                }
            );
        }

        const current =
            await prisma.product.findUnique({
                where: {
                    id: productId,
                },
                select: {
                    id: true,
                    imageUrl: true,
                },
            });

        if (!current) {
            return NextResponse.json(
                {
                    error:
                        "Product not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const body = await request.json();

        const data: {
            name?: string;
            description?: string | null;
            price?: number;
            imageUrl?: string | null;
            ingredients?: string[];
            allergens?: string[];
            badge?: string | null;
            restaurantId?: number;
            categoryId?: number;
            sortOrder?: number;
            isAvailable?: boolean;
            isFeatured?: boolean;
            isActive?: boolean;
        } = {};

        if (body.name !== undefined) {
            const name =
                String(body.name).trim();

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

            data.name = name;
        }

        if (
            body.description !==
            undefined
        ) {
            data.description =
                String(
                    body.description
                ).trim() || null;
        }

        if (body.price !== undefined) {
            const price =
                Number(body.price);

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

            data.price = price;
        }

        if (body.imageUrl !== undefined) {
            data.imageUrl =
                String(
                    body.imageUrl
                ).trim() || null;
        }

        if (
            body.ingredients !==
            undefined
        ) {
            data.ingredients =
                Array.isArray(
                    body.ingredients
                )
                    ? body.ingredients
                        .map((value: unknown) =>
                            String(
                                value
                            ).trim()
                        )
                        .filter(Boolean)
                    : [];
        }

        if (
            body.allergens !==
            undefined
        ) {
            data.allergens =
                Array.isArray(
                    body.allergens
                )
                    ? body.allergens
                        .map((value: unknown) =>
                            String(
                                value
                            ).trim()
                        )
                        .filter(Boolean)
                    : [];
        }

        if (body.badge !== undefined) {
            data.badge =
                String(body.badge).trim() ||
                null;
        }

        if (
            body.restaurantId !==
            undefined
        ) {
            const restaurantId =
                Number(body.restaurantId);

            const restaurant =
                await prisma.restaurant.findUnique(
                    {
                        where: {
                            id: restaurantId,
                        },
                        select: {
                            id: true,
                        },
                    }
                );

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

            data.restaurantId =
                restaurantId;
        }

        if (
            body.categoryId !==
            undefined
        ) {
            const categoryId =
                Number(body.categoryId);

            const category =
                await prisma.productCategory.findUnique({
                    where: {
                        id: categoryId,
                    },
                    select: {
                        id: true,
                    },
                });

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

            data.categoryId =
                categoryId;
        }

        if (
            body.sortOrder !== undefined
        ) {
            const sortOrder =
                Number(body.sortOrder);

            if (
                !Number.isInteger(
                    sortOrder
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Invalid sort order.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.sortOrder =
                sortOrder;
        }

        if (
            body.isAvailable !==
            undefined
        ) {
            data.isAvailable =
                Boolean(
                    body.isAvailable
                );
        }

        if (
            body.isFeatured !==
            undefined
        ) {
            data.isFeatured =
                Boolean(
                    body.isFeatured
                );
        }

        if (
            body.isActive !== undefined
        ) {
            data.isActive =
                Boolean(
                    body.isActive
                );
        }

        const product =
            await prisma.product.update({
                where: {
                    id: productId,
                },

                data,

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

        if (
            data.imageUrl !==
            undefined &&
            current.imageUrl &&
            current.imageUrl !==
            product.imageUrl
        ) {
            const oldKey =
                mediaKeyFromUrl(
                    current.imageUrl
                );

            if (oldKey) {
                deleteR2Object(
                    oldKey
                ).catch(
                    console.error
                );
            }
        }

        return NextResponse.json({
            success: true,
            product,
        });
    } catch (error) {
        console.error(
            "ADMIN UPDATE PRODUCT ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not update product.",
            },
            {
                status: 500,
            }
        );
    }
}