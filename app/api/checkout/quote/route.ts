import {
    NextResponse,
} from "next/server";

import {
    calculateCheckout,
    CheckoutError,
    type CheckoutItemInput,
} from "@/lib/checkout";

type Body = {
    items?: CheckoutItemInput[];

    promoCode?: string;

    customerPhone?: string;
    customerEmail?: string;
};

export async function POST(
    request: Request
) {
    try {
        const body =
            (await request.json()) as Body;

        const quote =
            await calculateCheckout(
                body.items || [],
                body.promoCode,
                {
                    phone:
                    body.customerPhone,

                    email:
                    body.customerEmail,
                }
            );

        return NextResponse.json({
            subtotal:
            quote.subtotal,

            deliveryFee:
            quote.deliveryFee,

            discount:
            quote.discount,

            total:
            quote.total,

            promotionSavings:
            quote.promotionSavings,

            promotion:
            quote.promotion,
        });
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
            "CHECKOUT QUOTE ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Unable to calculate checkout.",
            },
            {
                status: 500,
            }
        );
    }
}