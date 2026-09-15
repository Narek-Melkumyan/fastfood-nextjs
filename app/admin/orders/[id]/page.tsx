"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/providers/AuthProvider";

type OrderItem = {
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

    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    } | null;

    items: OrderItem[];
};

function money(value: number) {
    return value.toLocaleString("en-US");
}

function formatStatus(status: string) {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminOrderDetailsPage() {
    const params = useParams();
    const { apiFetch } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const id = String(params.id);

    useEffect(() => {
        let ignore = false;

        async function loadOrder() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch(
                    `/api/admin/orders/${id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Could not load order."
                    );
                }

                if (!ignore) {
                    setOrder(data.order);
                }
            } catch (error) {
                if (!ignore) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Could not load order."
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
    }, [apiFetch, id]);

    if (loading) {
        return (
            <div className="panel">
                <div className="panel-body text-center py-5">
                    Loading order...
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div>
                <Link
                    href="/admin/orders"
                    className="btn btn-line mb-3"
                >
                    ← Back to orders
                </Link>

                <div className="alert alert-danger">
                    {error || "Order not found."}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
                <div>
                    <Link
                        href="/admin/orders"
                        className="text-decoration-none muted"
                    >
                        ← Back to orders
                    </Link>

                    <span className="eyebrow d-block mt-3">
            Order
          </span>

                    <h1 className="display-md mb-1">
                        {order.orderNumber}
                    </h1>

                    <p className="muted mb-0">
                        {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>

                <span className="badge text-bg-success px-3 py-2">
          {formatStatus(order.status)}
        </span>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-8">
                    <div className="panel mb-4">
                        <div className="panel-head">
                            Order items
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Restaurant</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th className="text-end">Total</th>
                                </tr>
                                </thead>

                                <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="fw-semibold">
                                                {item.productName}
                                            </div>

                                            {item.note && (
                                                <div className="muted small">
                                                    {item.note}
                                                </div>
                                            )}
                                        </td>

                                        <td>
                                            {item.restaurantName || "—"}
                                        </td>

                                        <td>
                                            {money(item.unitPrice)}֏
                                        </td>

                                        <td>
                                            {item.quantity}
                                        </td>

                                        <td className="text-end fw-bold">
                                            {money(item.lineTotal)}֏
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-head">
                            Delivery
                        </div>

                        <div className="panel-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="muted small">
                                        Address
                                    </div>

                                    <div className="fw-semibold mt-1">
                                        {order.deliveryAddress}
                                    </div>

                                    <div>
                                        {order.deliveryCity}

                                        {order.deliveryDistrict
                                            ? ` · ${order.deliveryDistrict}`
                                            : ""}
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="muted small">
                                        Delivery time
                                    </div>

                                    <div className="fw-semibold mt-1">
                                        {order.deliveryTime || "As soon as possible"}
                                    </div>

                                    {order.scheduledFor && (
                                        <div>
                                            {new Date(
                                                order.scheduledFor
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {order.customerNote && (
                                    <div className="col-12">
                                        <div className="muted small">
                                            Customer note
                                        </div>

                                        <div className="mt-1">
                                            {order.customerNote}
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
                            Customer
                        </div>

                        <div className="panel-body">
                            <div className="fw-bold">
                                {order.customerName}
                            </div>

                            <div className="mt-2">
                                {order.customerPhone}
                            </div>

                            {order.customerEmail && (
                                <div className="mt-1">
                                    {order.customerEmail}
                                </div>
                            )}

                            {order.user && (
                                <div className="muted small mt-3">
                                    Registered customer
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-head">
                            Payment summary
                        </div>

                        <div className="panel-body">
                            <div className="d-flex justify-content-between mb-2">
                <span className="muted">
                  Subtotal
                </span>

                                <span>
                  {money(order.subtotal)}֏
                </span>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                <span className="muted">
                  Delivery
                </span>

                                <span>
                  {money(order.deliveryFee)}֏
                </span>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                <span className="muted">
                  Discount
                </span>

                                <span>
                  -{money(order.discount)}֏
                </span>
                            </div>

                            {order.walletCreditUsed > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">
                    Wallet credit
                  </span>

                                    <span>
                    -{money(order.walletCreditUsed)}֏
                  </span>
                                </div>
                            )}

                            <hr />

                            <div className="d-flex justify-content-between fs-5 fw-bold">
                                <span>Total</span>

                                <span>
                  {money(order.total)}֏
                </span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between">
                <span className="muted">
                  Payment
                </span>

                                <span>
                  {formatStatus(order.paymentMethod)}
                </span>
                            </div>

                            <div className="d-flex justify-content-between mt-2">
                <span className="muted">
                  Payment status
                </span>

                                <span>
                  {formatStatus(order.paymentStatus)}
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}