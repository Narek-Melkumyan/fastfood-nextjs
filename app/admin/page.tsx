"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    useAuth,
} from "@/app/providers/AuthProvider";

type DashboardData = {
    admin: {
        id: number;
        name: string;
        email: string;
        role: string;
    };

    stats: {
        totalUsers: number;
        totalOrders: number;
        pendingOrders: number;
        totalRestaurants: number;
        totalProducts: number;
        revenue: number;
    };

    recentOrders: {
        id: number;

        orderNumber: string;

        status: string;

        customerName: string;
        customerPhone: string;

        total: number;
        currency: string;

        createdAt: string;

        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    }[];
};

function money(
    value: number
) {
    return value.toLocaleString(
        "en-US"
    );
}

function statusClass(
    status: string
) {
    switch (status) {
        case "DELIVERED":
            return "success";

        case "CANCELLED":
            return "danger";

        case "PENDING":
            return "warning";

        case "PREPARING":
            return "info";

        case "OUT_FOR_DELIVERY":
            return "primary";

        default:
            return "secondary";
    }
}

export default function AdminDashboard() {
    const {
        apiFetch,
    } = useAuth();

    const [
        data,
        setData,
    ] =
        useState<DashboardData | null>(
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

    /*
     * =====================================
     * LOAD DASHBOARD
     * =====================================
     */

    useEffect(() => {
        let ignore =
            false;

        async function loadDashboard() {
            try {
                setLoading(
                    true
                );

                setError(
                    ""
                );

                const response =
                    await apiFetch(
                        "/api/admin/dashboard"
                    );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                        "Could not load dashboard."
                    );
                }

                if (!ignore) {
                    setData(
                        result
                    );
                }
            } catch (
                error
                ) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load dashboard."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(
                        false
                    );
                }
            }
        }

        loadDashboard();

        return () => {
            ignore = true;
        };
    }, [
        apiFetch,
    ]);

    if (loading) {
        return (
            <div className="panel">

                <div className="panel-body py-5 text-center">
                    Loading dashboard...
                </div>

            </div>
        );
    }

    if (
        error ||
        !data
    ) {
        return (
            <div className="alert alert-danger">
                {error ||
                    "Dashboard unavailable."}
            </div>
        );
    }

    return (
        <div>

            {/* HEADER */}

            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">

                <div>

          <span className="eyebrow">
            Administration
          </span>

                    <h1 className="display-md mb-1">
                        Dashboard
                    </h1>

                    <p className="muted mb-0">
                        Welcome back,{" "}
                        {
                            data.admin
                                .name
                        }
                        .
                    </p>

                </div>

                <Link
                    href="/admin/orders"
                    className="btn btn-brand"
                >
                    View orders
                </Link>

            </div>

            {/* STATS */}

            <div className="row g-3 mb-4">

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Orders
                        </div>

                        <div className="value">
                            {
                                data.stats
                                    .totalOrders
                            }
                        </div>

                    </div>

                </div>

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Pending orders
                        </div>

                        <div className="value">
                            {
                                data.stats
                                    .pendingOrders
                            }
                        </div>

                    </div>

                </div>

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Revenue
                        </div>

                        <div className="value">
                            {money(
                                data.stats
                                    .revenue
                            )}
                            ֏
                        </div>

                    </div>

                </div>

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Customers
                        </div>

                        <div className="value">
                            {
                                data.stats
                                    .totalUsers
                            }
                        </div>

                    </div>

                </div>

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Restaurants
                        </div>

                        <div className="value">
                            {
                                data.stats
                                    .totalRestaurants
                            }
                        </div>

                    </div>

                </div>

                <div className="col-6 col-xl-4">

                    <div className="admin-stat">

                        <div className="label">
                            Products
                        </div>

                        <div className="value">
                            {
                                data.stats
                                    .totalProducts
                            }
                        </div>

                    </div>

                </div>

            </div>

            {/* RECENT ORDERS */}

            <div className="panel">

                <div className="panel-head d-flex justify-content-between align-items-center">

          <span>
            Recent orders
          </span>

                    <Link
                        href="/admin/orders"
                        className="fw-bold"
                    >
                        See all
                    </Link>

                </div>

                <div className="panel-body p-0">

                    {data
                        .recentOrders
                        .length ===
                    0 ? (

                        <div className="empty-state m-4">

                            <div className="ico">
                                🧾
                            </div>

                            <p className="mb-0">
                                No orders yet.
                            </p>

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table align-middle mb-0">

                                <thead>

                                <tr>

                                    <th>
                                        Order
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                </tr>

                                </thead>

                                <tbody>

                                {data
                                    .recentOrders
                                    .map(
                                        (
                                            order
                                        ) => (

                                            <tr
                                                key={
                                                    order.id
                                                }
                                            >

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="fw-bold"
                                                    >
                                                        {
                                                            order.orderNumber
                                                        }
                                                    </Link>

                                                </td>

                                                <td>

                                                    <div className="fw-semibold">
                                                        {
                                                            order.customerName
                                                        }
                                                    </div>

                                                    <div className="muted small">
                                                        {
                                                            order.user
                                                                ?.email ||
                                                            order.customerPhone
                                                        }
                                                    </div>

                                                </td>

                                                <td>

                            <span
                                className={`badge text-bg-${statusClass(
                                    order.status
                                )}`}
                            >
                              {
                                  order.status
                              }
                            </span>

                                                </td>

                                                <td className="fw-bold">

                                                    {money(
                                                        order.total
                                                    )}
                                                    ֏

                                                </td>

                                                <td className="muted">

                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleString()}

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}