import { prisma } from "@/lib/prisma";

export type CheckoutItemInput = {
    id: number;
    quantity: number;
};

type CustomerIdentity = {
    phone?: string | null;
    email?: string | null;
};

export class CheckoutError extends Error {
    status: number;

    constructor(
        message: string,
        status = 400
    ) {
        super(message);
        this.status = status;
    }
}

export async function calculateCheckout(
    inputItems: CheckoutItemInput[],
    promoCode?: string | null,
    identity?: CustomerIdentity
) {
    if (
        !Array.isArray(inputItems) ||
        inputItems.length === 0
    ) {
        throw new CheckoutError(
            "Your basket is empty."
        );
    }

    /*
     * Combine duplicate product IDs
     */
    const quantities =
        new Map<number, number>();

    for (const item of inputItems) {
        if (
            !Number.isInteger(item.id) ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > 50
        ) {
            throw new CheckoutError(
                "Invalid basket item."
            );
        }

        quantities.set(
            item.id,
            (quantities.get(item.id) || 0) +
            item.quantity
        );
    }

    const productIds = Array.from(
        quantities.keys()
    );

    /*
     * IMPORTANT:
     * Client prices are NOT trusted.
     *
     * We get real product prices from DB.
     */
    const products =
        await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },

            include: {
                restaurant: true,
            },
        });

    if (
        products.length !==
        productIds.length
    ) {
        throw new CheckoutError(
            "One or more products no longer exist."
        );
    }

    const productMap = new Map(
        products.map((product) => [
            product.id,
            product,
        ])
    );

    type RestaurantGroup = {
        restaurant:
            (typeof products)[number]["restaurant"];

        subtotal: number;
    };

    const restaurantGroups =
        new Map<number, RestaurantGroup>();

    const orderItems: {
        quantity: number;
        productName: string;
        restaurantName: string;
        unitPrice: number;
        lineTotal: number;
        productId: number;
        restaurantId: number;
    }[] = [];

    let subtotal = 0;

    for (const [
        productId,
        quantity,
    ] of quantities.entries()) {
        const product =
            productMap.get(productId);

        if (!product) {
            throw new CheckoutError(
                "Product not found."
            );
        }

        if (
            !product.isActive ||
            !product.isAvailable
        ) {
            throw new CheckoutError(
                `${product.name} is currently unavailable.`
            );
        }

        if (
            !product.restaurant.isActive ||
            !product.restaurant
                .isAcceptingOrders
        ) {
            throw new CheckoutError(
                `${product.restaurant.name} is not accepting orders right now.`
            );
        }

        const lineTotal =
            product.price * quantity;

        subtotal += lineTotal;

        orderItems.push({
            quantity,

            productName:
            product.name,

            restaurantName:
            product.restaurant.name,

            unitPrice:
            product.price,

            lineTotal,

            productId:
            product.id,

            restaurantId:
            product.restaurant.id,
        });

        const current =
            restaurantGroups.get(
                product.restaurant.id
            );

        if (current) {
            current.subtotal +=
                lineTotal;
        } else {
            restaurantGroups.set(
                product.restaurant.id,
                {
                    restaurant:
                    product.restaurant,

                    subtotal:
                    lineTotal,
                }
            );
        }
    }

    /*
     * Calculate delivery separately
     * for every restaurant.
     */
    let baseDeliveryFee = 0;

    for (const {
        restaurant,
        subtotal: restaurantSubtotal,
    } of restaurantGroups.values()) {
        if (
            restaurantSubtotal <
            restaurant.minimumOrder
        ) {
            throw new CheckoutError(
                `Minimum order for ${restaurant.name} is ${restaurant.minimumOrder.toLocaleString()}֏.`
            );
        }

        const qualifiesForFreeDelivery =
            restaurant.freeDeliveryFrom !==
            null &&
            restaurantSubtotal >=
            restaurant.freeDeliveryFrom;

        if (
            !qualifiesForFreeDelivery
        ) {
            baseDeliveryFee +=
                restaurant.deliveryFee;
        }
    }

    let deliveryFee =
        baseDeliveryFee;

    let discount = 0;

    let promotion:
        | Awaited<
        ReturnType<
            typeof prisma.promotion.findUnique
        >
    >
        | null = null;

    const normalizedPromo =
        promoCode
            ?.trim()
            .toUpperCase() || "";

    /*
     * PROMO
     */
    if (normalizedPromo) {
        promotion =
            await prisma.promotion.findUnique({
                where: {
                    code: normalizedPromo,
                },
            });

        if (
            !promotion ||
            !promotion.isActive
        ) {
            throw new CheckoutError(
                "That promo code is not valid."
            );
        }

        const now = new Date();

        if (
            promotion.startsAt &&
            promotion.startsAt > now
        ) {
            throw new CheckoutError(
                "This promotion has not started yet."
            );
        }

        if (
            promotion.endsAt &&
            promotion.endsAt < now
        ) {
            throw new CheckoutError(
                "This promotion has expired."
            );
        }

        if (
            subtotal <
            promotion.minimumOrder
        ) {
            throw new CheckoutError(
                `This promotion requires a minimum order of ${promotion.minimumOrder.toLocaleString()}֏.`
            );
        }

        /*
         * Global usage limit
         */
        if (
            promotion.usageLimit !== null
        ) {
            const used =
                await prisma.promotionRedemption.count(
                    {
                        where: {
                            promotionId:
                            promotion.id,
                        },
                    }
                );

            if (
                used >=
                promotion.usageLimit
            ) {
                throw new CheckoutError(
                    "This promotion has reached its usage limit."
                );
            }
        }

        /*
         * New customers only
         */
        if (
            promotion.newCustomersOnly &&
            (identity?.phone ||
                identity?.email)
        ) {
            const identityFilters: {
                customerPhone?: string;
                customerEmail?: string;
            }[] = [];

            if (
                identity.phone?.trim()
            ) {
                identityFilters.push({
                    customerPhone:
                        identity.phone.trim(),
                });
            }

            if (
                identity.email?.trim()
            ) {
                identityFilters.push({
                    customerEmail:
                        identity.email.trim(),
                });
            }

            if (
                identityFilters.length >
                0
            ) {
                const oldOrder =
                    await prisma.order.findFirst({
                        where: {
                            OR: identityFilters,
                        },

                        select: {
                            id: true,
                        },
                    });

                if (oldOrder) {
                    throw new CheckoutError(
                        "This promo code is only for new customers."
                    );
                }
            }
        }

        /*
         * Per customer limit.
         * Until auth is implemented we
         * identify a guest by phone/email.
         */
        if (
            promotion.perUserLimit !==
            null &&
            (identity?.phone ||
                identity?.email)
        ) {
            const identityFilters: {
                customerPhone?: string;
                customerEmail?: string;
            }[] = [];

            if (
                identity.phone?.trim()
            ) {
                identityFilters.push({
                    customerPhone:
                        identity.phone.trim(),
                });
            }

            if (
                identity.email?.trim()
            ) {
                identityFilters.push({
                    customerEmail:
                        identity.email.trim(),
                });
            }

            if (
                identityFilters.length >
                0
            ) {
                const usage =
                    await prisma.order.count({
                        where: {
                            promotionId:
                            promotion.id,

                            OR: identityFilters,
                        },
                    });

                if (
                    usage >=
                    promotion.perUserLimit
                ) {
                    throw new CheckoutError(
                        "You have already used this promotion the maximum number of times."
                    );
                }
            }
        }

        /*
         * Calculate promotion
         */
        switch (promotion.type) {
            case "PERCENTAGE": {
                discount = Math.floor(
                    subtotal *
                    (promotion.value /
                        100)
                );

                if (
                    promotion.maxDiscount !==
                    null
                ) {
                    discount = Math.min(
                        discount,
                        promotion.maxDiscount
                    );
                }

                break;
            }

            case "FIXED_AMOUNT": {
                discount = Math.min(
                    promotion.value,
                    subtotal
                );

                break;
            }

            case "FREE_DELIVERY": {
                deliveryFee = 0;

                break;
            }
        }
    }

    const total = Math.max(
        0,
        subtotal -
        discount +
        deliveryFee
    );

    const promotionSavings =
        discount +
        (baseDeliveryFee -
            deliveryFee);

    return {
        subtotal,
        baseDeliveryFee,
        deliveryFee,
        discount,
        total,

        promotionSavings,

        promotion:
            promotion
                ? {
                    id:
                    promotion.id,

                    code:
                    promotion.code,

                    title:
                    promotion.title,

                    type:
                    promotion.type,
                }
                : null,

        orderItems,
    };
}