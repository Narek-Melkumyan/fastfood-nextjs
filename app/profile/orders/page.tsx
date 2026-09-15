"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    useAuth,
} from "@/app/providers/AuthProvider";

import ProfileNav from "@/components/profile/ProfileNav";

type OrderItem =
    Record<string, unknown>;

function getString(
    value: unknown,
    fallback = ""
) {
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    return fallback;
}

function getPrice(
    order: OrderItem
) {
    const value =
        order.total ??
        order.totalAmount ??
        order.grandTotal ??
        order.amount;

    if (
        typeof value === "number"
    ) {
        return `${value.toLocaleString("en-US")}֏`;
    }

    if (value) {
        const number = Number(value);

        if (!Number.isNaN(number)) {
            return `${number.toLocaleString("en-US")}֏`;
        }
    }

    return "—";
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
            return "text-bg-primary";

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

export default function OrdersPage() {
    const router = useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        orders,
        setOrders,
    ] = useState<OrderItem[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        let ignore = false;

        async function loadOrders() {
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
                        "Unable to load orders."
                    );
                }

                if (!ignore) {
                    setOrders(
                        Array.isArray(data.orders)
                            ? data.orders
                            : []
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load orders."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadOrders();

        return () => {
            ignore = true;
        };
    }, [
        authLoading,
        user,
        apiFetch,
        router,
    ]);

    if (
        authLoading ||
        loading
    ) {
        return (
            <main className="container py-5">
                Loading orders...
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="py-5">
            <div className="container">
        <span className="eyebrow">
          My account
        </span>

                <h1 className="display-md mb-2">
                    Orders
                </h1>

                <p className="muted mb-4">
                    View and track your Foodly orders.
                </p>

                <ProfileNav />

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {!error &&
                    orders.length === 0 && (
                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius: "24px",
                            }}
                        >
                            <div className="card-body p-5 text-center">
                                <h2 className="h4">
                                    No orders yet
                                </h2>

                                <p className="muted mb-0">
                                    Your orders will appear here.
                                </p>
                            </div>
                        </div>
                    )}

                <div className="row g-3">
                    {orders.map(
                        (
                            order,
                            index
                        ) => {
                            const id =
                                getString(
                                    order.id,
                                    String(index + 1)
                                );

                            const number =
                                getString(
                                    order.orderNumber ??
                                    order.number,
                                    `#${id}`
                                );

                            const status =
                                getString(
                                    order.status,
                                    "Order"
                                );

                            const createdAt =
                                getString(
                                    order.createdAt
                                );

                            return (
                                <div
                                    key={id}
                                    className="col-12"
                                >
                                    <div
                                        className="card border-0 shadow-sm"
                                        style={{
                                            borderRadius: "20px",
                                        }}
                                    >
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                                                <div>
                                                    <div className="muted small">
                                                        ORDER
                                                    </div>

                                                    <Link
                                                        href={`/profile/orders/${id}`}
                                                        className="text-decoration-none"
                                                    >
                                                        <h2
                                                            className="h5 mb-1"
                                                            style={{
                                                                color: "var(--brand)",
                                                            }}
                                                        >
                                                            {number}
                                                        </h2>
                                                    </Link>

                                                    {createdAt && (
                                                        <div className="muted">
                                                            {new Date(
                                                                createdAt
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="d-flex align-items-center gap-4">
                                                    <div className="text-end">
                            <span
                                className={`badge ${statusClass(
                                    status
                                )}`}
                            >
                              {readableStatus(
                                  status
                              )}
                            </span>

                                                        <div className="fw-bold mt-2">
                                                            {getPrice(
                                                                order
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/profile/orders/${id}`}
                                                        className="btn btn-line btn-sm"
                                                    >
                                                        View details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        </main>
    );
}