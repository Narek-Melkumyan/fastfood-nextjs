import {
    NextResponse,
} from "next/server";

import {
    prisma,
} from "@/lib/prisma";

import {
    getAdminFromRequest,
} from "@/lib/adminAuth";

const allowedStatuses = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
] as const;

type OrderStatus =
    (typeof allowedStatuses)[number];

type Body = {
    status?: string;
};

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,

    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        /*
         * =====================================
         * ADMIN
         * =====================================
         */

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

        /*
         * =====================================
         * PARAMS
         * =====================================
         */

        const {
            id,
        } =
            await context.params;

        const orderId =
            Number(id);

        if (
            !Number.isInteger(
                orderId
            ) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid order ID.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================
         * BODY
         * =====================================
         */

        const body =
            (await request.json()) as Body;

        const status =
            body.status;

        if (
            !status ||
            !allowedStatuses.includes(
                status as OrderStatus
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Invalid order status.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================
         * FIND ORDER
         * =====================================
         */

        const existingOrder =
            await prisma.order.findUnique({
                where: {
                    id:
                    orderId,
                },

                select: {
                    id: true,
                    status: true,
                },
            });

        if (!existingOrder) {
            return NextResponse.json(
                {
                    error:
                        "Order not found.",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * =====================================
         * UPDATE
         * =====================================
         */

        const now =
            new Date();

        const order =
            await prisma.order.update({
                where: {
                    id:
                    orderId,
                },

                data: {
                    status:
                        status as OrderStatus,

                    /*
                     * Save final timestamps.
                     */

                    deliveredAt:
                        status ===
                        "DELIVERED"
                            ? existingOrder
                                .status ===
                            "DELIVERED"
                                ? undefined
                                : now
                            : null,

                    cancelledAt:
                        status ===
                        "CANCELLED"
                            ? existingOrder
                                .status ===
                            "CANCELLED"
                                ? undefined
                                : now
                            : null,
                },

                select: {
                    id: true,

                    orderNumber: true,

                    status: true,

                    paymentStatus: true,

                    total: true,

                    currency: true,

                    deliveredAt: true,
                    cancelledAt: true,

                    updatedAt: true,
                },
            });

        return NextResponse.json({
            success: true,

            order,
        });
    } catch (error) {
        console.error(
            "ADMIN UPDATE ORDER ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not update order.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function GET(request: Request, { params }: Props) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const { id } = await params;
        const orderId = Number(id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return NextResponse.json(
                { error: "Invalid order ID." },
                { status: 400 }
            );
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                items: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            order,
        });
    } catch (error) {
        console.error("ADMIN ORDER GET ERROR:", error);

        return NextResponse.json(
            { error: "Could not load order." },
            { status: 500 }
        );
    }
}