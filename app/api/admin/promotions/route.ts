import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";

const promotionTypes = [
    "PERCENTAGE",
    "FIXED_AMOUNT",
    "FREE_DELIVERY",
] as const;

type PromotionType =
    (typeof promotionTypes)[number];

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(value: string) {
    const base = slugify(value) || "promotion";

    let slug = base;
    let number = 2;

    while (
        await prisma.promotion.findUnique({
            where: { slug },
            select: { id: true },
        })
        ) {
        slug = `${base}-${number}`;
        number++;
    }

    return slug;
}

function parseOptionalNumber(value: unknown) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number)
        ? number
        : NaN;
}

function parseIds(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [
        ...new Set(
            value
                .map(Number)
                .filter(
                    (id) =>
                        Number.isInteger(id) &&
                        id > 0
                )
        ),
    ];
}

export async function GET(request: Request) {
    try {
        const admin =
            await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const [
            promotions,
            restaurants,
            categories,
            products,
        ] = await Promise.all([
            prisma.promotion.findMany({
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    code: true,
                    imageUrl: true,
                    type: true,
                    value: true,
                    minimumOrder: true,
                    maxDiscount: true,
                    newCustomersOnly: true,
                    isStackable: true,
                    usageLimit: true,
                    perUserLimit: true,
                    startsAt: true,
                    endsAt: true,
                    isActive: true,
                    createdAt: true,

                    restaurants: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    categories: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    products: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    _count: {
                        select: {
                            redemptions: true,
                            orders: true,
                        },
                    },
                },
            }),

            prisma.restaurant.findMany({
                where: {
                    isActive: true,
                },
                orderBy: {
                    name: "asc",
                },
                select: {
                    id: true,
                    name: true,
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
                },
            }),

            prisma.product.findMany({
                where: {
                    isActive: true,
                },
                orderBy: {
                    name: "asc",
                },
                select: {
                    id: true,
                    name: true,
                    restaurant: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            promotions,
            restaurants,
            categories,
            products,
        });
    } catch (error) {
        console.error(
            "ADMIN PROMOTIONS ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not load promotions.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(request: Request) {
    try {
        const admin =
            await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const body =
            await request.json();

        const title =
            String(body.title || "").trim();

        const description =
            String(
                body.description || ""
            ).trim() || null;

        const code =
            String(body.code || "")
                .trim()
                .toUpperCase() || null;

        const imageUrl =
            String(
                body.imageUrl || ""
            ).trim() || null;

        const type =
            String(
                body.type || ""
            ) as PromotionType;

        const value =
            Number(body.value || 0);

        const minimumOrder =
            Number(
                body.minimumOrder || 0
            );

        const maxDiscount =
            parseOptionalNumber(
                body.maxDiscount
            );

        const usageLimit =
            parseOptionalNumber(
                body.usageLimit
            );

        const perUserLimit =
            parseOptionalNumber(
                body.perUserLimit
            );

        const restaurantIds =
            parseIds(
                body.restaurantIds
            );

        const categoryIds =
            parseIds(
                body.categoryIds
            );

        const productIds =
            parseIds(
                body.productIds
            );

        if (!title) {
            return NextResponse.json(
                {
                    error:
                        "Promotion title is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !promotionTypes.includes(
                type
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid promotion type.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(value) ||
            value < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid promotion value.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            type === "PERCENTAGE" &&
            (value <= 0 || value > 100)
        ) {
            return NextResponse.json(
                {
                    error:
                        "Percentage must be between 1 and 100.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            type === "FIXED_AMOUNT" &&
            value <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Fixed discount must be greater than 0.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                minimumOrder
            ) ||
            minimumOrder < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid minimum order.",
                },
                {
                    status: 400,
                }
            );
        }

        for (const number of [
            maxDiscount,
            usageLimit,
            perUserLimit,
        ]) {
            if (
                number !== null &&
                (
                    !Number.isInteger(number) ||
                    number < 0
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Invalid promotion limits.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        const startsAt =
            body.startsAt
                ? new Date(body.startsAt)
                : null;

        const endsAt =
            body.endsAt
                ? new Date(body.endsAt)
                : null;

        if (
            startsAt &&
            Number.isNaN(
                startsAt.getTime()
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid start date.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            endsAt &&
            Number.isNaN(
                endsAt.getTime()
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid end date.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            startsAt &&
            endsAt &&
            endsAt <= startsAt
        ) {
            return NextResponse.json(
                {
                    error:
                        "End date must be after start date.",
                },
                {
                    status: 400,
                }
            );
        }

        if (code) {
            const existing =
                await prisma.promotion.findUnique({
                    where: {
                        code,
                    },
                    select: {
                        id: true,
                    },
                });

            if (existing) {
                return NextResponse.json(
                    {
                        error:
                            "This promotion code is already in use.",
                    },
                    {
                        status: 409,
                    }
                );
            }
        }

        const slug =
            await createUniqueSlug(
                String(
                    body.slug || ""
                ).trim() || title
            );

        const promotion =
            await prisma.promotion.create({
                data: {
                    title,
                    slug,
                    description,
                    code,
                    imageUrl,
                    type,
                    value:
                        type ===
                        "FREE_DELIVERY"
                            ? 0
                            : value,
                    minimumOrder,
                    maxDiscount:
                        type ===
                        "PERCENTAGE"
                            ? maxDiscount
                            : null,
                    newCustomersOnly:
                        body.newCustomersOnly ===
                        true,
                    isStackable:
                        body.isStackable ===
                        true,
                    usageLimit,
                    perUserLimit,
                    startsAt,
                    endsAt,
                    isActive:
                        body.isActive !==
                        false,

                    restaurants: {
                        connect:
                            restaurantIds.map(
                                (id) => ({
                                    id,
                                })
                            ),
                    },

                    categories: {
                        connect:
                            categoryIds.map(
                                (id) => ({
                                    id,
                                })
                            ),
                    },

                    products: {
                        connect:
                            productIds.map(
                                (id) => ({
                                    id,
                                })
                            ),
                    },
                },

                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    code: true,
                    imageUrl: true,
                    type: true,
                    value: true,
                    minimumOrder: true,
                    maxDiscount: true,
                    newCustomersOnly: true,
                    isStackable: true,
                    usageLimit: true,
                    perUserLimit: true,
                    startsAt: true,
                    endsAt: true,
                    isActive: true,
                    createdAt: true,

                    restaurants: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    categories: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    products: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    _count: {
                        select: {
                            redemptions: true,
                            orders: true,
                        },
                    },
                },
            });

        return NextResponse.json(
            {
                success: true,
                promotion,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "ADMIN CREATE PROMOTION ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not create promotion.",
            },
            {
                status: 500,
            }
        );
    }
}