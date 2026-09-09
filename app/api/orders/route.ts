import {
    NextResponse,
} from "next/server";

import {
    calculateCheckout,
    CheckoutError,
    type CheckoutItemInput,
} from "@/lib/checkout";

import { prisma } from "@/lib/prisma";

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
        const body =
            (await request.json()) as OrderBody;

        const customerName =
            body.customerName?.trim();

        const customerPhone =
            body.customerPhone?.trim();

        const deliveryAddress =
            body.deliveryAddress?.trim();

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

        /*
         * Card processing will later be
         * handled by Stripe.
         */
        if (
            body.paymentMethod ===
            "CARD"
        ) {
            throw new CheckoutError(
                "Card payments are not connected yet. Please choose cash."
            );
        }

        const quote =
            await calculateCheckout(
                body.items || [],
                body.promoCode,
                {
                    phone:
                    customerPhone,

                    email:
                    body.customerEmail,
                }
            );

        const orderNumber =
            `FD-${Date.now()
                .toString(36)
                .toUpperCase()}-${crypto
                .randomUUID()
                .slice(0, 5)
                .toUpperCase()}`;

        const order =
            await prisma.$transaction(
                async (tx) => {
                    const createdOrder =
                        await tx.order.create({
                            data: {
                                orderNumber,

                                paymentMethod:
                                    "CASH",

                                paymentStatus:
                                    "PENDING",

                                customerName,

                                customerPhone,

                                customerEmail:
                                    body.customerEmail
                                        ?.trim() ||
                                    null,

                                customerNote:
                                    body.customerNote
                                        ?.trim() ||
                                    null,

                                deliveryCity:
                                    body.deliveryCity
                                        ?.trim() ||
                                    "Yerevan",

                                deliveryDistrict:
                                    body.deliveryDistrict
                                        ?.trim() ||
                                    null,

                                deliveryAddress,

                                deliveryTime:
                                    body.deliveryTime
                                        ?.trim() ||
                                    "As soon as possible",

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

                                promotionId:
                                    quote.promotion
                                        ?.id ||
                                    null,

                                items: {
                                    create:
                                    quote.orderItems,
                                },
                            },

                            select: {
                                id: true,
                                orderNumber: true,
                                status: true,

                                subtotal: true,
                                deliveryFee: true,
                                discount: true,
                                total: true,

                                createdAt: true,
                            },
                        });

                    /*
                     * Record promo usage
                     */
                    if (
                        quote.promotion
                    ) {
                        await tx.promotionRedemption.create(
                            {
                                data: {
                                    promotionId:
                                    quote.promotion
                                        .id,

                                    orderId:
                                    createdOrder.id,

                                    discountAmount:
                                    quote.promotionSavings,
                                },
                            }
                        );
                    }

                    return createdOrder;
                }
            );

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

        console.error(
            "CREATE ORDER ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not place your order."
            },
            {
                status: 500,
            }
        );
    }
}