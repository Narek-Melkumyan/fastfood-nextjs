import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { deleteR2Object } from "@/lib/r2";
import { mediaKeyFromUrl } from "@/lib/media";

const promotionTypes = [
    "PERCENTAGE",
    "FIXED_AMOUNT",
    "FREE_DELIVERY",
] as const;

type PromotionType =
    (typeof promotionTypes)[number];

type Props = {
    params: Promise<{
        id: string;
    }>;
};

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

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const admin =
            await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const { id } = await params;

        const promotionId =
            Number(id);

        if (
            !Number.isInteger(
                promotionId
            ) ||
            promotionId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid promotion ID.",
                },
                {
                    status: 400,
                }
            );
        }

        const current =
            await prisma.promotion.findUnique({
                where: {
                    id: promotionId,
                },
                select: {
                    id: true,
                    imageUrl: true,
                    code: true,
                },
            });

        if (!current) {
            return NextResponse.json(
                {
                    error:
                        "Promotion not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const body =
            await request.json();

        const data: {
            title?: string;
            description?: string | null;
            code?: string | null;
            imageUrl?: string | null;
            type?: PromotionType;
            value?: number;
            minimumOrder?: number;
            maxDiscount?: number | null;
            newCustomersOnly?: boolean;
            isStackable?: boolean;
            usageLimit?: number | null;
            perUserLimit?: number | null;
            startsAt?: Date | null;
            endsAt?: Date | null;
            isActive?: boolean;

            restaurants?: {
                set: {
                    id: number;
                }[];
            };

            categories?: {
                set: {
                    id: number;
                }[];
            };

            products?: {
                set: {
                    id: number;
                }[];
            };
        } = {};

        if (
            body.title !==
            undefined
        ) {
            const title =
                String(
                    body.title
                ).trim();

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

            data.title = title;
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

        if (
            body.code !== undefined
        ) {
            const code =
                String(body.code)
                    .trim()
                    .toUpperCase() ||
                null;

            if (code) {
                const existing =
                    await prisma.promotion.findFirst({
                        where: {
                            code,
                            NOT: {
                                id: promotionId,
                            },
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

            data.code = code;
        }

        if (
            body.imageUrl !==
            undefined
        ) {
            data.imageUrl =
                String(
                    body.imageUrl
                ).trim() || null;
        }

        if (
            body.type !== undefined
        ) {
            const type =
                String(
                    body.type
                ) as PromotionType;

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

            data.type = type;
        }

        if (
            body.value !== undefined
        ) {
            const value =
                Number(body.value);

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

            const type =
                data.type ||
                String(
                    body.type || ""
                );

            if (
                type === "PERCENTAGE" &&
                (
                    value <= 0 ||
                    value > 100
                )
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

            data.value =
                type ===
                "FREE_DELIVERY"
                    ? 0
                    : value;
        }

        if (
            body.minimumOrder !==
            undefined
        ) {
            const value =
                Number(
                    body.minimumOrder
                );

            if (
                !Number.isInteger(value) ||
                value < 0
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

            data.minimumOrder =
                value;
        }

        if (
            body.maxDiscount !==
            undefined
        ) {
            const value =
                parseOptionalNumber(
                    body.maxDiscount
                );

            if (
                Number.isNaN(value) ||
                (
                    value !== null &&
                    value < 0
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Invalid maximum discount.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.maxDiscount =
                value;
        }

        if (
            body.usageLimit !==
            undefined
        ) {
            const value =
                parseOptionalNumber(
                    body.usageLimit
                );

            if (
                Number.isNaN(value) ||
                (
                    value !== null &&
                    value < 0
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Invalid usage limit.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.usageLimit =
                value;
        }

        if (
            body.perUserLimit !==
            undefined
        ) {
            const value =
                parseOptionalNumber(
                    body.perUserLimit
                );

            if (
                Number.isNaN(value) ||
                (
                    value !== null &&
                    value < 0
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Invalid per-user limit.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.perUserLimit =
                value;
        }

        if (
            body.newCustomersOnly !==
            undefined
        ) {
            data.newCustomersOnly =
                Boolean(
                    body.newCustomersOnly
                );
        }

        if (
            body.isStackable !==
            undefined
        ) {
            data.isStackable =
                Boolean(
                    body.isStackable
                );
        }

        if (
            body.isActive !==
            undefined
        ) {
            data.isActive =
                Boolean(
                    body.isActive
                );
        }

        if (
            body.startsAt !==
            undefined
        ) {
            if (!body.startsAt) {
                data.startsAt =
                    null;
            } else {
                const date =
                    new Date(
                        body.startsAt
                    );

                if (
                    Number.isNaN(
                        date.getTime()
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

                data.startsAt =
                    date;
            }
        }

        if (
            body.endsAt !==
            undefined
        ) {
            if (!body.endsAt) {
                data.endsAt =
                    null;
            } else {
                const date =
                    new Date(
                        body.endsAt
                    );

                if (
                    Number.isNaN(
                        date.getTime()
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

                data.endsAt =
                    date;
            }
        }

        if (
            body.restaurantIds !==
            undefined
        ) {
            data.restaurants = {
                set:
                    parseIds(
                        body.restaurantIds
                    ).map((id) => ({
                        id,
                    })),
            };
        }

        if (
            body.categoryIds !==
            undefined
        ) {
            data.categories = {
                set:
                    parseIds(
                        body.categoryIds
                    ).map((id) => ({
                        id,
                    })),
            };
        }

        if (
            body.productIds !==
            undefined
        ) {
            data.products = {
                set:
                    parseIds(
                        body.productIds
                    ).map((id) => ({
                        id,
                    })),
            };
        }

        const promotion =
            await prisma.promotion.update({
                where: {
                    id: promotionId,
                },
                data,

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

        if (
            data.imageUrl !==
            undefined &&
            current.imageUrl &&
            current.imageUrl !==
            promotion.imageUrl
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
            promotion,
        });
    } catch (error) {
        console.error(
            "ADMIN UPDATE PROMOTION ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not update promotion.",
            },
            {
                status: 500,
            }
        );
    }
}