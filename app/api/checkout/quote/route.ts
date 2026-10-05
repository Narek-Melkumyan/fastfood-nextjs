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
        /*
         * =====================================
         * READ REQUEST BODY SAFELY
         * =====================================
         */

        const rawBody =
            await request.text();

        if (!rawBody.trim()) {
            return NextResponse.json(
                {
                    error:
                        "Request body is required.",
                },
                {
                    status: 400,
                }
            );
        }

        let body: Body;

        try {
            body =
                JSON.parse(
                    rawBody
                ) as Body;
        } catch {
            return NextResponse.json(
                {
                    error:
                        "Invalid JSON request body.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================
         * VALIDATION
         * =====================================
         */

        if (!Array.isArray(body.items)) {
            return NextResponse.json(
                {
                    error:
                        "Basket items are required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (body.items.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "Your basket is empty.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================
         * CALCULATE CHECKOUT
         * =====================================
         */

        const quote =
            await calculateCheckout(
                body.items,
                body.promoCode,
                {
                    phone:
                    body.customerPhone,

                    email:
                    body.customerEmail,
                }
            );

        /*
         * =====================================
         * RESPONSE
         * =====================================
         */

        return NextResponse.json(
            {
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
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        /*
         * =====================================
         * CHECKOUT ERROR
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