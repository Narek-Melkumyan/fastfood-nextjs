import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    buildDeliveryPreview,
} from "@/lib/maps";

export const runtime = "nodejs";

type RequestBody = {
    items?: Array<{
        productId?: number;
        quantity?: number;
    }>;

    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
};

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            (await request.json()) as
                RequestBody;

        const deliveryAddress =
            typeof body.deliveryAddress ===
            "string"
                ? body.deliveryAddress.trim()
                : "";

        const deliveryCity =
            typeof body.deliveryCity ===
            "string"
                ? body.deliveryCity.trim()
                : "";

        const deliveryDistrict =
            typeof body.deliveryDistrict ===
            "string"
                ? body.deliveryDistrict.trim()
                : "";

        if (
            deliveryAddress.length < 3
        ) {
            return NextResponse.json(
                {
                    error:
                        "Enter a valid delivery address.",
                },
                {
                    status: 400,
                }
            );
        }

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

        const items =
            body.items
                .map((item) => ({
                    productId:
                        Number(item.productId),

                    quantity:
                        Number(item.quantity),
                }))
                .filter(
                    (item) =>
                        Number.isInteger(
                            item.productId
                        ) &&
                        item.productId > 0 &&
                        Number.isInteger(
                            item.quantity
                        ) &&
                        item.quantity > 0 &&
                        item.quantity <= 50
                );

        if (!items.length) {
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

        const preview =
            await buildDeliveryPreview({
                items,
                address:
                deliveryAddress,
                city:
                deliveryCity,
                district:
                deliveryDistrict,
            });

        return NextResponse.json({
            preview,
        });
    } catch (error) {
        console.error(
            "DELIVERY PREVIEW ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to calculate delivery route.",
            },
            {
                status: 400,
            }
        );
    }
}