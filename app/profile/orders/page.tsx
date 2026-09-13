"use client";

import {
    useEffect,
    useState,
} from "react";

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
        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD",
            }
        ).format(value);
    }

    return value
        ? `$${String(value)}`
        : "—";
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

        async function loadOrders() {
            try {
                setLoading(true);

                const response =
                    await apiFetch(
                        "/api/profile/orders"
                    );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load orders."
                    );
                }

                const data =
                    await response.json();

                setOrders(
                    Array.isArray(data.orders)
                        ? data.orders
                        : []
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load orders."
                );
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
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
                                            borderRadius:
                                                "20px",
                                        }}
                                    >
                                        <div className="card-body p-4">

                                            <div className="d-flex justify-content-between gap-3">

                                                <div>
                                                    <div className="muted small">
                                                        ORDER
                                                    </div>

                                                    <h2 className="h5 mb-1">
                                                        {number}
                                                    </h2>

                                                    {createdAt && (
                                                        <div className="muted">
                                                            {new Date(
                                                                createdAt
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-end">

                          <span className="badge text-bg-dark">
                            {status}
                          </span>

                                                    <div className="fw-bold mt-2">
                                                        {getPrice(
                                                            order
                                                        )}
                                                    </div>

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
