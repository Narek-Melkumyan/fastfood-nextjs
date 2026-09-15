import {
    NextResponse,
} from "next/server";

import {
    prisma,
} from "@/lib/prisma";

import {
    getAdminFromRequest,
} from "@/lib/adminAuth";

export async function GET(
    request: Request
) {
    try {
        const admin =
            await getAdminFromRequest(
                request
            );

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

        const orders =
            await prisma.order.findMany({
                orderBy: {
                    createdAt: "desc",
                },

                select: {
                    id: true,

                    orderNumber: true,

                    status: true,

                    paymentMethod: true,
                    paymentStatus: true,

                    customerName: true,
                    customerPhone: true,
                    customerEmail: true,

                    deliveryCity: true,
                    deliveryDistrict: true,
                    deliveryAddress: true,

                    subtotal: true,
                    deliveryFee: true,
                    discount: true,
                    walletCreditUsed: true,
                    total: true,
                    currency: true,

                    createdAt: true,
                    deliveredAt: true,
                    cancelledAt: true,

                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },

                    items: {
                        select: {
                            id: true,

                            quantity: true,

                            productName: true,
                            restaurantName: true,

                            unitPrice: true,
                            lineTotal: true,
                        },
                    },
                },
            });

        return NextResponse.json({
            orders,
        });
    } catch (error) {
        console.error(
            "ADMIN ORDERS ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not load orders.",
            },
            {
                status: 500,
            }
        );
    }
}