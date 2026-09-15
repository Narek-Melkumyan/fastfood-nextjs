"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";

type Order = {
    id: number;
    orderNumber: string;
    status: OrderStatus;

    paymentMethod: string;
    paymentStatus: string;

    customerName: string;
    customerPhone: string;
    customerEmail: string | null;

    deliveryCity: string;
    deliveryDistrict: string | null;
    deliveryAddress: string;

    subtotal: number;
    deliveryFee: number;
    discount: number;
    walletCreditUsed: number;
    total: number;
    currency: string;

    createdAt: string;
    deliveredAt: string | null;
    cancelledAt: string | null;

    user: {
        id: number;
        name: string;
        email: string;
    } | null;

    items: {
        id: number;
        quantity: number;
        productName: string;
        restaurantName: string | null;
        unitPrice: number;
        lineTotal: number;
    }[];
};

const statuses: OrderStatus[] = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
];

function money(value: number) {
    return value.toLocaleString("en-US");
}

function readableStatus(status: string) {
    return status
        .split("_")
        .map(
            (part) =>
                part.charAt(0) +
                part.slice(1).toLowerCase()
        )
        .join(" ");
}

function statusColor(status: OrderStatus) {
    switch (status) {
        case "PENDING":
            return "warning";

        case "CONFIRMED":
            return "primary";

        case "PREPARING":
            return "info";

        case "OUT_FOR_DELIVERY":
            return "primary";

        case "DELIVERED":
            return "success";

        case "CANCELLED":
            return "danger";

        case "REFUNDED":
            return "secondary";

        default:
            return "secondary";
    }
}

export default function AdminOrdersPage() {
    const { apiFetch } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<"ALL" | OrderStatus>("ALL");

    const [updatingId, setUpdatingId] =
        useState<number | null>(null);

    const [expandedOrderId, setExpandedOrderId] =
        useState<number | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadOrders() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch(
                    "/api/admin/orders"
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Could not load orders."
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
                            : "Could not load orders."
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
    }, [apiFetch]);

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();

        return orders.filter((order) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                order.status === statusFilter;

            const matchesSearch =
                !query ||
                order.orderNumber
                    .toLowerCase()
                    .includes(query) ||
                order.customerName
                    .toLowerCase()
                    .includes(query) ||
                order.customerPhone
                    .toLowerCase()
                    .includes(query) ||
                order.customerEmail
                    ?.toLowerCase()
                    .includes(query) ||
                order.deliveryAddress
                    .toLowerCase()
                    .includes(query);

            return (
                matchesStatus &&
                Boolean(matchesSearch)
            );
        });
    }, [orders, search, statusFilter]);

    const pendingCount = orders.filter(
        (order) => order.status === "PENDING"
    ).length;

    const inProgressCount = orders.filter(
        (order) =>
            order.status === "CONFIRMED" ||
            order.status === "PREPARING" ||
            order.status === "OUT_FOR_DELIVERY"
    ).length;

    const deliveredCount = orders.filter(
        (order) => order.status === "DELIVERED"
    ).length;

    async function updateStatus(
        orderId: number,
        status: OrderStatus
    ) {
        try {
            setUpdatingId(orderId);
            setError("");

            const response = await apiFetch(
                `/api/admin/orders/${orderId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not update order."
                );
            }

            setOrders((current) =>
                current.map((order) =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: data.order.status,
                            deliveredAt:
                            data.order.deliveredAt,
                            cancelledAt:
                            data.order.cancelledAt,
                        }
                        : order
                )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not update order."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading orders...
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
        <span className="eyebrow">
          Orders
        </span>

                <h1 className="display-md mb-1">
                    Manage orders
                </h1>

                <p className="muted mb-0">
                    Review incoming orders and update
                    their status.
                </p>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="row g-3 mb-4">
                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            All orders
                        </div>

                        <div className="value">
                            {orders.length}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            Pending
                        </div>

                        <div className="value">
                            {pendingCount}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            In progress
                        </div>

                        <div className="value">
                            {inProgressCount}
                        </div>
                    </div>
                </div>

                <div className="col-6 col-xl-3">
                    <div className="admin-stat">
                        <div className="label">
                            Delivered
                        </div>

                        <div className="value">
                            {deliveredCount}
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel mb-4">
                <div className="panel-body">
                    <div className="row g-3">
                        <div className="col-12 col-lg">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search order, customer, phone, email or address..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="col-12 col-lg-auto">
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                            | "ALL"
                                            | OrderStatus
                                    )
                                }
                            >
                                <option value="ALL">
                                    All statuses
                                </option>

                                {statuses.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {readableStatus(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel">
                <div className="panel-head d-flex justify-content-between align-items-center">
          <span>
            Orders
          </span>

                    <span className="muted">
            {filteredOrders.length} results
          </span>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="panel-body">
                        <div className="empty-state">
                            <div className="ico">
                                🧾
                            </div>

                            <p className="mb-0">
                                No orders found.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th />
                            </tr>
                            </thead>

                            <tbody>
                            {filteredOrders.map(
                                (order) => (
                                    <Fragment key={order.id}>
                                        <tr>
                                            <td>
                                                <strong>
                                                    {order.orderNumber}
                                                </strong>

                                                <div className="muted small">
                                                    {order.paymentMethod}
                                                    {" · "}
                                                    {order.paymentStatus}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="fw-semibold">
                                                    {order.customerName}
                                                </div>

                                                <div className="muted small">
                                                    {order.customerPhone}
                                                </div>

                                                {order.user && (
                                                    <div className="small">
                                                        Registered user
                                                    </div>
                                                )}
                                            </td>

                                            <td>
                                                {order.items.reduce(
                                                    (total, item) =>
                                                        total +
                                                        item.quantity,
                                                    0
                                                )}
                                            </td>

                                            <td className="fw-bold">
                                                {money(order.total)}֏
                                            </td>

                                            <td>
                          <span
                              className={`badge text-bg-${statusColor(
                                  order.status
                              )}`}
                          >
                            {readableStatus(
                                order.status
                            )}
                          </span>
                                            </td>

                                            <td className="muted small">
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleString()}
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-line btn-sm"
                                                    onClick={() =>
                                                        setExpandedOrderId(
                                                            (current) =>
                                                                current ===
                                                                order.id
                                                                    ? null
                                                                    : order.id
                                                        )
                                                    }
                                                >
                                                    {expandedOrderId ===
                                                    order.id
                                                        ? "Close"
                                                        : "Manage"}
                                                </button>
                                            </td>
                                        </tr>

                                        {expandedOrderId ===
                                            order.id && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="p-0"
                                                    >
                                                        <div className="p-4 bg-body-tertiary">
                                                            <div className="row g-4">
                                                                <div className="col-12 col-lg-7">
                                                                    <h3 className="h6 mb-3">
                                                                        Order items
                                                                    </h3>

                                                                    <div className="d-grid gap-2">
                                                                        {order.items.map(
                                                                            (item) => (
                                                                                <div
                                                                                    key={
                                                                                        item.id
                                                                                    }
                                                                                    className="d-flex justify-content-between gap-3"
                                                                                >
                                                                                    <div>
                                                                                        <strong>
                                                                                            {
                                                                                                item.productName
                                                                                            }
                                                                                        </strong>

                                                                                        <div className="muted small">
                                                                                            {item.restaurantName ||
                                                                                                "Restaurant"}
                                                                                            {" · "}
                                                                                            {
                                                                                                item.quantity
                                                                                            }
                                                                                            ×{" "}
                                                                                            {money(
                                                                                                item.unitPrice
                                                                                            )}
                                                                                            ֏
                                                                                        </div>
                                                                                    </div>

                                                                                    <strong>
                                                                                        {money(
                                                                                            item.lineTotal
                                                                                        )}
                                                                                        ֏
                                                                                    </strong>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>

                                                                    <hr />

                                                                    <div className="d-grid gap-1">
                                                                        <div className="d-flex justify-content-between">
                                      <span>
                                        Subtotal
                                      </span>

                                                                            <span>
                                        {money(
                                            order.subtotal
                                        )}
                                                                                ֏
                                      </span>
                                                                        </div>

                                                                        <div className="d-flex justify-content-between">
                                      <span>
                                        Delivery
                                      </span>

                                                                            <span>
                                        {money(
                                            order.deliveryFee
                                        )}
                                                                                ֏
                                      </span>
                                                                        </div>

                                                                        <div className="d-flex justify-content-between">
                                      <span>
                                        Discount
                                      </span>

                                                                            <span>
                                        -
                                                                                {money(
                                                                                    order.discount
                                                                                )}
                                                                                ֏
                                      </span>
                                                                        </div>

                                                                        {order.walletCreditUsed >
                                                                            0 && (
                                                                                <div className="d-flex justify-content-between">
                                        <span>
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

                                                                        <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                                      <span>
                                        Total
                                      </span>

                                                                            <span>
                                        {money(
                                            order.total
                                        )}
                                                                                ֏
                                      </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="col-12 col-lg-5">
                                                                    <h3 className="h6 mb-3">
                                                                        Delivery
                                                                    </h3>

                                                                    <p className="mb-1 fw-semibold">
                                                                        {order.customerName}
                                                                    </p>

                                                                    <p className="mb-1">
                                                                        {order.customerPhone}
                                                                    </p>

                                                                    {order.customerEmail && (
                                                                        <p className="mb-1">
                                                                            {
                                                                                order.customerEmail
                                                                            }
                                                                        </p>
                                                                    )}

                                                                    <p className="muted mt-2">
                                                                        {order.deliveryCity}
                                                                        {order.deliveryDistrict
                                                                            ? `, ${order.deliveryDistrict}`
                                                                            : ""}
                                                                        <br />
                                                                        {order.deliveryAddress}
                                                                    </p>

                                                                    <hr />

                                                                    <label className="form-label fw-semibold">
                                                                        Order status
                                                                    </label>

                                                                    <select
                                                                        className="form-select"
                                                                        value={order.status}
                                                                        disabled={
                                                                            updatingId ===
                                                                            order.id
                                                                        }
                                                                        onChange={(event) =>
                                                                            updateStatus(
                                                                                order.id,
                                                                                event.target
                                                                                    .value as OrderStatus
                                                                            )
                                                                        }
                                                                    >
                                                                        {statuses.map(
                                                                            (status) => (
                                                                                <option
                                                                                    key={
                                                                                        status
                                                                                    }
                                                                                    value={
                                                                                        status
                                                                                    }
                                                                                >
                                                                                    {readableStatus(
                                                                                        status
                                                                                    )}
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>

                                                                    {updatingId ===
                                                                        order.id && (
                                                                            <p className="muted small mt-2 mb-0">
                                                                                Updating order...
                                                                            </p>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                    </Fragment>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}