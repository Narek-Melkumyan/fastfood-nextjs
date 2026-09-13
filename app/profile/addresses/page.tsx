"use client";

import {
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import ProfileNav from "@/components/profile/ProfileNav";

type AddressItem =
    Record<string, unknown>;

function text(
    value: unknown
) {
    return typeof value === "string" ||
    typeof value === "number"
        ? String(value)
        : "";
}

export default function AddressesPage() {
    const router =
        useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        addresses,
        setAddresses,
    ] =
        useState<AddressItem[]>([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        async function load() {
            try {
                const response =
                    await apiFetch(
                        "/api/profile/addresses"
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                setAddresses(
                    Array.isArray(
                        data.addresses
                    )
                        ? data.addresses
                        : []
                );
            } finally {
                setLoading(false);
            }
        }

        load();
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
                Loading addresses...
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
                    Addresses
                </h1>

                <p className="muted mb-4">
                    Manage your delivery addresses.
                </p>

                <ProfileNav />

                {addresses.length ===
                0 ? (
                    <div
                        className="card border-0 shadow-sm"
                        style={{
                            borderRadius:
                                "24px",
                        }}
                    >
                        <div className="card-body p-5 text-center">

                            <h2 className="h4">
                                No saved addresses
                            </h2>

                            <p className="muted mb-0">
                                Your saved delivery
                                locations will appear
                                here.
                            </p>

                        </div>
                    </div>
                ) : (
                    <div className="row g-3">

                        {addresses.map(
                            (
                                address,
                                index
                            ) => {
                                const id =
                                    text(
                                        address.id
                                    ) ||
                                    String(index);

                                const label =
                                    text(
                                        address.label ??
                                        address.name
                                    ) ||
                                    `Address ${index + 1}`;

                                const line1 =
                                    text(
                                        address.line1 ??
                                        address.addressLine1 ??
                                        address.street ??
                                        address.address
                                    );

                                const city =
                                    text(
                                        address.city
                                    );

                                const state =
                                    text(
                                        address.state
                                    );

                                const postalCode =
                                    text(
                                        address.postalCode ??
                                        address.zipCode
                                    );

                                return (
                                    <div
                                        className="col-md-6"
                                        key={id}
                                    >
                                        <div
                                            className="card border-0 shadow-sm h-100"
                                            style={{
                                                borderRadius:
                                                    "20px",
                                            }}
                                        >
                                            <div className="card-body p-4">

                                                <div className="d-flex justify-content-between">

                                                    <h2 className="h5">
                                                        {label}
                                                    </h2>

                                                    {address.isDefault ===
                                                        true && (
                                                            <span className="badge text-bg-dark">
                              Default
                            </span>
                                                        )}

                                                </div>

                                                <p className="muted mb-0">
                                                    {line1}

                                                    {line1 &&
                                                        city &&
                                                        ", "}

                                                    {city}

                                                    {state &&
                                                        `, ${state}`}

                                                    {postalCode &&
                                                        ` ${postalCode}`}
                                                </p>

                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>
        </main>
    );
}