import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const token = getBearerToken(request);

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const auth = await verifyAccessToken(token);

        const orders = await prisma.order.findMany({
            where: {
                userId: auth.userId,
            },

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

                deliveryCity: true,
                deliveryDistrict: true,
                deliveryAddress: true,
                deliveryTime: true,
                scheduledFor: true,

                subtotal: true,
                deliveryFee: true,
                discount: true,
                walletCreditUsed: true,
                total: true,
                currency: true,

                createdAt: true,
                deliveredAt: true,
                cancelledAt: true,

                items: {
                    select: {
                        id: true,
                        quantity: true,
                        productName: true,
                        restaurantName: true,
                        unitPrice: true,
                        lineTotal: true,
                        note: true,

                        product: {
                            select: {
                                slug: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            orders,
        });
    } catch (error) {
        console.error("GET ORDERS ERROR:", error);

        return NextResponse.json(
            { message: "Unauthorized." },
            { status: 401 }
        );
    }
}