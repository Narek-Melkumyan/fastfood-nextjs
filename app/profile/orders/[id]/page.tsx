"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    useParams,
    useRouter,
} from "next/navigation";

import {
    useAuth,
} from "@/app/providers/AuthProvider";

import ProfileNav from "@/components/profile/ProfileNav";

type OrderProductItem = {
    id: number;
    quantity: number;
    productName: string;
    restaurantName: string | null;
    unitPrice: number;
    lineTotal: number;
    note: string | null;
};

type Order = {
    id: number;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;

    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    customerNote: string | null;

    deliveryCity: string;
    deliveryDistrict: string | null;
    deliveryAddress: string;
    deliveryTime: string | null;
    scheduledFor: string | null;

    subtotal: number;
    deliveryFee: number;
    discount: number;
    walletCreditUsed: number;
    total: number;
    currency: string;

    createdAt: string;
    deliveredAt: string | null;
    cancelledAt: string | null;

    items?: OrderProductItem[];
};

function money(
    value: number
) {
    return value.toLocaleString(
        "en-US"
    );
}

function readableStatus(
    status: string
) {
    return status
        .split("_")
        .map(
            (part) =>
                part.charAt(0) +
                part
                    .slice(1)
                    .toLowerCase()
        )
        .join(" ");
}

function statusClass(
    status: string
) {
    switch (status) {
        case "DELIVERED":
            return "text-bg-success";

        case "PREPARING":
            return "text-bg-info";

        case "CONFIRMED":
        case "OUT_FOR_DELIVERY":
            return "text-bg-primary";

        case "PENDING":
            return "text-bg-warning";

        case "CANCELLED":
            return "text-bg-danger";

        case "REFUNDED":
            return "text-bg-secondary";

        default:
            return "text-bg-dark";
    }
}

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        order,
        setOrder,
    ] =
        useState<Order | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    const id =
        String(params.id);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace(
                "/login"
            );

            return;
        }

        let ignore = false;

        async function loadOrder() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiFetch(
                        "/api/profile/orders"
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        "Unable to load order."
                    );
                }

                const orders:
                    Order[] =
                    Array.isArray(
                        data.orders
                    )
                        ? data.orders
                        : [];

                const found =
                    orders.find(
                        (item) =>
                            String(
                                item.id
                            ) === id
                    );

                if (!found) {
                    throw new Error(
                        "Order not found."
                    );
                }

                if (!ignore) {
                    setOrder(found);
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load order."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadOrder();

        return () => {
            ignore = true;
        };
    }, [
        id,
        user,
        authLoading,
        apiFetch,
        router,
    ]);

    if (
        authLoading ||
        loading
    ) {
        return (
            <main className="container py-5">
                Loading order...
            </main>
        );
    }

    if (!user) {
        return null;
    }

    if (
        error ||
        !order
    ) {
        return (
            <main className="py-5">
                <div className="container">
                    <ProfileNav />

                    <div className="alert alert-danger">
                        {error ||
                            "Order not found."}
                    </div>

                    <Link
                        href="/profile/orders"
                        className="btn btn-line"
                    >
                        ← Back to orders
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="py-5">
            <div className="container">
        <span className="eyebrow">
          My account
        </span>

                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                    <div>
                        <Link
                            href="/profile/orders"
                            className="muted text-decoration-none"
                        >
                            ← Back to orders
                        </Link>

                        <h1 className="display-md mt-3 mb-1">
                            {order.orderNumber}
                        </h1>

                        <p className="muted mb-0">
                            Placed{" "}
                            {new Date(
                                order.createdAt
                            ).toLocaleString()}
                        </p>
                    </div>

                    <span
                        className={`badge ${statusClass(
                            order.status
                        )} px-3 py-2`}
                    >
            {readableStatus(
                order.status
            )}
          </span>
                </div>

                <ProfileNav />

                <div className="row g-4">
                    <div className="col-12 col-xl-8">
                        <div className="panel mb-4">
                            <div className="panel-head">
                                Order items
                            </div>

                            {order.items &&
                            order.items.length >
                            0 ? (
                                <div className="table-responsive">
                                    <table className="table align-middle mb-0">
                                        <thead>
                                        <tr>
                                            <th>
                                                Product
                                            </th>

                                            <th>
                                                Restaurant
                                            </th>

                                            <th>
                                                Price
                                            </th>

                                            <th>
                                                Qty
                                            </th>

                                            <th className="text-end">
                                                Total
                                            </th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {order.items.map(
                                            (item) => (
                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                >
                                                    <td>
                                                        <div className="fw-semibold">
                                                            {
                                                                item.productName
                                                            }
                                                        </div>

                                                        {item.note && (
                                                            <div className="muted small">
                                                                {
                                                                    item.note
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {item.restaurantName ||
                                                            "—"}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item.unitPrice
                                                        )}
                                                        ֏
                                                    </td>

                                                    <td>
                                                        {
                                                            item.quantity
                                                        }
                                                    </td>

                                                    <td className="text-end fw-bold">
                                                        {money(
                                                            item.lineTotal
                                                        )}
                                                        ֏
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="panel-body">
                                    <div className="muted">
                                        Order items are not available.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                Delivery details
                            </div>

                            <div className="panel-body">
                                <div className="row g-4">
                                    <div className="col-12 col-md-6">
                                        <div className="muted small mb-1">
                                            Delivery address
                                        </div>

                                        <div className="fw-semibold">
                                            {
                                                order.deliveryAddress
                                            }
                                        </div>

                                        <div className="muted mt-1">
                                            {
                                                order.deliveryCity
                                            }

                                            {order.deliveryDistrict
                                                ? ` · ${order.deliveryDistrict}`
                                                : ""}
                                        </div>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <div className="muted small mb-1">
                                            Delivery time
                                        </div>

                                        <div className="fw-semibold">
                                            {order.deliveryTime ||
                                                "As soon as possible"}
                                        </div>

                                        {order.scheduledFor && (
                                            <div className="muted mt-1">
                                                {new Date(
                                                    order.scheduledFor
                                                ).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    {order.customerNote && (
                                        <div className="col-12">
                                            <div className="muted small mb-1">
                                                Order note
                                            </div>

                                            <div>
                                                {
                                                    order.customerNote
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-4">
                        <div className="panel mb-4">
                            <div className="panel-head">
                                Contact
                            </div>

                            <div className="panel-body">
                                <div className="fw-bold">
                                    {
                                        order.customerName
                                    }
                                </div>

                                <div className="mt-2">
                                    {
                                        order.customerPhone
                                    }
                                </div>

                                {order.customerEmail && (
                                    <div className="mt-1">
                                        {
                                            order.customerEmail
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                Order summary
                            </div>

                            <div className="panel-body">
                                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">
                    Subtotal
                  </span>

                                    <span>
                    {money(
                        order.subtotal
                    )}
                                        ֏
                  </span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">
                    Delivery
                  </span>

                                    <span>
                    {money(
                        order.deliveryFee
                    )}
                                        ֏
                  </span>
                                </div>

                                {order.discount >
                                    0 && (
                                        <div className="d-flex justify-content-between mb-2">
                    <span className="muted">
                      Discount
                    </span>

                                            <span className="text-success">
                      -
                                                {money(
                                                    order.discount
                                                )}
                                                ֏
                    </span>
                                        </div>
                                    )}

                                {order.walletCreditUsed >
                                    0 && (
                                        <div className="d-flex justify-content-between mb-2">
                    <span className="muted">
                      Wallet credit
                    </span>

                                            <span>
                      -
                                                {money(
                                                    order.walletCreditUsed
                                                )}
                                                ֏
                    </span>
                                        </div>
                                    )}

                                <hr />

                                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    Total
                  </span>

                                    <span className="fs-5 fw-bold">
                    {money(
                        order.total
                    )}
                                        ֏
                  </span>
                                </div>

                                <hr />

                                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">
                    Payment
                  </span>

                                    <span className="fw-semibold">
                    {readableStatus(
                        order.paymentMethod
                    )}
                  </span>
                                </div>

                                <div className="d-flex justify-content-between">
                  <span className="muted">
                    Payment status
                  </span>

                                    <span className="fw-semibold">
                    {readableStatus(
                        order.paymentStatus
                    )}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}