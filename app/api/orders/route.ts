import {
    NextResponse,
} from "next/server";

import {
    calculateCheckout,
    CheckoutError,
    type CheckoutItemInput,
} from "@/lib/checkout";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

import {
    prisma,
} from "@/lib/prisma";

type OrderBody = {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerNote?: string;

    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryAddress?: string;
    deliveryTime?: string;

    paymentMethod?:
        | "CASH"
        | "CARD";

    promoCode?: string;

    items?: CheckoutItemInput[];
};

export async function POST(
    request: Request
) {
    try {
        /*
         * =====================================
         * AUTH - OPTIONAL
         * =====================================
         *
         * Guest:
         * userId = null
         *
         * Logged in:
         * userId comes ONLY from JWT.
         */

        let userId:
            number | null = null;

        const accessToken =
            getBearerToken(request);

        if (accessToken) {
            try {
                const auth =
                    await verifyAccessToken(
                        accessToken
                    );

                /*
                 * Make sure the user still exists
                 * and is active.
                 */
                const user =
                    await prisma.user.findUnique({
                        where: {
                            id: auth.userId,
                        },

                        select: {
                            id: true,
                            isActive: true,
                        },
                    });

                if (
                    !user ||
                    !user.isActive
                ) {
                    return NextResponse.json(
                        {
                            error:
                                "Your account is not available.",
                        },
                        {
                            status: 401,
                        }
                    );
                }

                userId =
                    user.id;
            } catch {
                /*
                 * If a Bearer token was sent,
                 * but it is invalid/expired,
                 * don't silently treat the request
                 * as a guest.
                 *
                 * AuthProvider apiFetch() can refresh
                 * the access token and retry.
                 */
                return NextResponse.json(
                    {
                        error:
                            "Your session has expired. Please sign in again.",
                    },
                    {
                        status: 401,
                    }
                );
            }
        }

        /*
         * =====================================
         * BODY
         * =====================================
         */

        const body =
            (await request.json()) as OrderBody;

        const customerName =
            body.customerName?.trim();

        const customerPhone =
            body.customerPhone?.trim();

        const customerEmail =
            body.customerEmail
                ?.trim() || null;

        const customerNote =
            body.customerNote
                ?.trim() || null;

        const deliveryCity =
            body.deliveryCity
                ?.trim() || "Yerevan";

        const deliveryDistrict =
            body.deliveryDistrict
                ?.trim() || null;

        const deliveryAddress =
            body.deliveryAddress?.trim();

        const deliveryTime =
            body.deliveryTime
                ?.trim() ||
            "As soon as possible";

        /*
         * =====================================
         * VALIDATION
         * =====================================
         */

        if (!customerName) {
            throw new CheckoutError(
                "Full name is required."
            );
        }

        if (!customerPhone) {
            throw new CheckoutError(
                "Phone number is required."
            );
        }

        if (!deliveryAddress) {
            throw new CheckoutError(
                "Delivery address is required."
            );
        }

        if (
            !body.items ||
            body.items.length === 0
        ) {
            throw new CheckoutError(
                "Your basket is empty."
            );
        }

        /*
         * Card processing will later
         * be handled by Stripe.
         */

        if (
            body.paymentMethod ===
            "CARD"
        ) {
            throw new CheckoutError(
                "Card payments are not connected yet. Please choose cash."
            );
        }

        /*
         * =====================================
         * CALCULATE ORDER
         * =====================================
         */

        const quote =
            await calculateCheckout(
                body.items,
                body.promoCode,
                {
                    phone:
                    customerPhone,

                    email:
                        customerEmail ??
                        undefined,
                }
            );

        /*
         * =====================================
         * ORDER NUMBER
         * =====================================
         */

        const orderNumber =
            `FD-${Date.now()
                .toString(36)
                .toUpperCase()}-${crypto
                .randomUUID()
                .slice(0, 5)
                .toUpperCase()}`;

        /*
         * =====================================
         * DATABASE TRANSACTION
         * =====================================
         */

        const order =
            await prisma.$transaction(
                async (tx) => {
                    const createdOrder =
                        await tx.order.create({
                            data: {
                                /*
                                 * IMPORTANT:
                                 *
                                 * Logged-in user:
                                 * userId = JWT user id
                                 *
                                 * Guest:
                                 * userId = null
                                 */
                                userId,

                                orderNumber,

                                paymentMethod:
                                    "CASH",

                                paymentStatus:
                                    "PENDING",

                                /*
                                 * Customer information
                                 */

                                customerName,

                                customerPhone,

                                customerEmail,

                                customerNote,

                                /*
                                 * Delivery
                                 */

                                deliveryCity,

                                deliveryDistrict,

                                deliveryAddress,

                                deliveryTime,

                                /*
                                 * Prices
                                 */

                                subtotal:
                                quote.subtotal,

                                deliveryFee:
                                quote.deliveryFee,

                                discount:
                                quote.discount,

                                walletCreditUsed:
                                    0,

                                total:
                                quote.total,

                                currency:
                                    "AMD",

                                /*
                                 * Promotion
                                 */

                                promotionId:
                                    quote.promotion
                                        ?.id ??
                                    null,

                                /*
                                 * Order items
                                 */

                                items: {
                                    create:
                                    quote.orderItems,
                                },
                            },

                            select: {
                                id: true,

                                userId: true,

                                orderNumber: true,

                                status: true,

                                paymentMethod: true,

                                paymentStatus: true,

                                subtotal: true,

                                deliveryFee: true,

                                discount: true,

                                total: true,

                                currency: true,

                                createdAt: true,

                                items: {
                                    select: {
                                        id: true,

                                        productName:
                                            true,

                                        restaurantName:
                                            true,

                                        quantity:
                                            true,

                                        unitPrice:
                                            true,

                                        lineTotal:
                                            true,
                                    },
                                },
                            },
                        });

                    /*
                     * =================================
                     * PROMOTION REDEMPTION
                     * =================================
                     */

                    if (
                        quote.promotion
                    ) {
                        await tx
                            .promotionRedemption
                            .create({
                                data: {
                                    promotionId:
                                    quote
                                        .promotion
                                        .id,

                                    orderId:
                                    createdOrder.id,

                                    /*
                                     * Logged-in account
                                     * gets associated with
                                     * promo redemption.
                                     *
                                     * Guest = null
                                     */
                                    userId,

                                    discountAmount:
                                    quote
                                        .promotionSavings,
                                },
                            });
                    }

                    return createdOrder;
                }
            );

        /*
         * =====================================
         * RESPONSE
         * =====================================
         */

        return NextResponse.json(
            {
                success: true,

                order,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        /*
         * =====================================
         * CHECKOUT ERRORS
         * =====================================
         */

        if (
            error instanceof
            CheckoutError
        ) {
            return NextResponse.json(
                {
                    error:
                    error.message,
                },
                {
                    status:
                    error.status,
                }
            );
        }

        /*
         * =====================================
         * UNKNOWN ERROR
         * =====================================
         */

        console.error(
            "CREATE ORDER ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not place your order.",
            },
            {
                status: 500,
            }
        );
    }
}