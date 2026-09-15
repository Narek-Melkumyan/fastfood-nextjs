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

        const [
            totalUsers,
            totalOrders,
            pendingOrders,
            totalRestaurants,
            totalProducts,
            deliveredRevenue,
            recentOrders,
        ] =
            await Promise.all([
                /*
                 * USERS
                 */
                prisma.user.count(),

                /*
                 * ALL ORDERS
                 */
                prisma.order.count(),

                /*
                 * ORDERS WAITING
                 */
                prisma.order.count({
                    where: {
                        status: "PENDING",
                    },
                }),

                /*
                 * RESTAURANTS
                 */
                prisma.restaurant.count({
                    where: {
                        isActive: true,
                    },
                }),

                /*
                 * PRODUCTS
                 */
                prisma.product.count({
                    where: {
                        isActive: true,
                    },
                }),

                /*
                 * REVENUE
                 */
                prisma.order.aggregate({
                    where: {
                        status: "DELIVERED",
                    },

                    _sum: {
                        total: true,
                    },
                }),

                /*
                 * RECENT ORDERS
                 */
                prisma.order.findMany({
                    orderBy: {
                        createdAt: "desc",
                    },

                    take: 8,

                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,

                        customerName: true,
                        customerPhone: true,

                        total: true,
                        currency: true,

                        createdAt: true,

                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                }),
            ]);

        return NextResponse.json({
            admin,

            stats: {
                totalUsers,

                totalOrders,

                pendingOrders,

                totalRestaurants,

                totalProducts,

                revenue:
                    deliveredRevenue
                        ._sum
                        .total ?? 0,
            },

            recentOrders,
        });
    } catch (error) {
        console.error(
            "ADMIN DASHBOARD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not load admin dashboard.",
            },
            {
                status: 500,
            }
        );
    }
}