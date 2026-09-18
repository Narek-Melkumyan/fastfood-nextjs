"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import ProfileNav from "@/components/profile/ProfileNav";

type ProfileUser = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    emailVerifiedAt: string | null;
    createdAt: string;
};

export default function ProfilePage() {
    const router = useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
        logout,
    } = useAuth();

    const [profile, setProfile] =
        useState<ProfileUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [loggingOut, setLoggingOut] =
        useState(false);


    const [sendingVerification, setSendingVerification] =
        useState(false);

    const [verificationMessage, setVerificationMessage] =
        useState("");

    const [verificationError, setVerificationError] =
        useState("");

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        async function loadProfile() {
            try {
                setLoading(true);
                setError("");

                const response = await apiFetch(
                    "/api/auth/me"
                );

                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to load profile."
                    );
                }

                const data = await response.json();

                setProfile(data.user);
            } catch (error) {
                console.error(
                    "PROFILE ERROR:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [
        authLoading,
        user,
        apiFetch,
        router,
    ]);

    async function handleLogout() {
        try {
            setLoggingOut(true);

            await logout();

            router.replace("/login");
        } finally {
            setLoggingOut(false);
        }
    }

    async function handleSendVerification() {
        try {
            setSendingVerification(true);
            setVerificationMessage("");
            setVerificationError("");

            const response = await apiFetch(
                "/api/auth/email-verification/send",
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not send verification email."
                );
            }

            setVerificationMessage(
                data.message || "Verification email sent."
            );
        } catch (error) {
            setVerificationError(
                error instanceof Error
                    ? error.message
                    : "Could not send verification email."
            );
        } finally {
            setSendingVerification(false);
        }
    }

    if (authLoading || loading) {
        return (
            <main className="container py-5">
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{
                        minHeight: "60vh",
                    }}
                >
                    <div className="text-center">
                        <div
                            className="spinner-border mb-3"
                            role="status"
                        >
              <span className="visually-hidden">
                Loading...
              </span>
                        </div>

                        <p className="muted mb-0">
                            Loading your account...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    if (error) {
        return (
            <main className="container py-5">
                <div
                    className="alert alert-danger"
                    role="alert"
                >
                    {error}
                </div>
            </main>
        );
    }

    if (!profile) {
        return null;
    }

    const firstLetter =
        profile.name
            ?.trim()
            .charAt(0)
            .toUpperCase() || "U";

    const memberSince =
        new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long",
                year: "numeric",
            }
        ).format(
            new Date(profile.createdAt)
        );

    return (
        <main className="py-5">
            <div className="container">



                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">

                    <div>
            <span className="eyebrow">
              My account
            </span>

                        <h1 className="display-md mb-2">
                            Welcome back,{" "}
                            {profile.name}
                        </h1>

                        <p className="muted mb-0">
                            Manage your Foodly account,
                            addresses and orders.
                        </p>
                    </div>

                    <ProfileNav />

                    <button
                        type="button"
                        className="btn btn-line"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut
                            ? "Signing out..."
                            : "Sign out"}
                    </button>

                </div>

                <div className="row g-4">



                    <div className="col-lg-4">

                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius: "24px",
                            }}
                        >
                            <div className="card-body p-4">

                                <div className="text-center mb-4">

                                    {profile.avatarUrl ? (
                                        <img
                                            src={profile.avatarUrl}
                                            alt={profile.name}
                                            width={110}
                                            height={110}
                                            style={{
                                                width: "110px",
                                                height: "110px",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="d-inline-flex align-items-center justify-content-center fw-bold"
                                            style={{
                                                width: "110px",
                                                height: "110px",
                                                borderRadius: "50%",
                                                background:
                                                    "var(--brand, #111)",
                                                color: "#fff",
                                                fontSize: "2.3rem",
                                            }}
                                        >
                                            {firstLetter}
                                        </div>
                                    )}

                                    <h2 className="h4 mt-3 mb-1">
                                        {profile.name}
                                    </h2>

                                    <p className="muted mb-2">
                                        {profile.email}
                                    </p>

                                    <span className="badge text-bg-dark">
                    {profile.role}
                  </span>

                                </div>

                                <hr />

                                <div className="d-grid gap-3">

                                    <div>
                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            EMAIL
                                        </div>

                                        <div className="fw-semibold">
                                            {profile.email}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            PHONE
                                        </div>

                                        <div className="fw-semibold">
                                            {profile.phone ||
                                                "Not added yet"}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            MEMBER SINCE
                                        </div>

                                        <div className="fw-semibold">
                                            {memberSince}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            EMAIL STATUS
                                        </div>

                                        {profile.emailVerifiedAt ? (
                                            <span className="badge text-bg-success">
    Verified
  </span>
                                        ) : (
                                            <div>
                                                <div className="d-flex align-items-center gap-2 flex-wrap">
      <span className="badge text-bg-warning">
        Not verified
      </span>

                                                    <button
                                                        type="button"
                                                        className="btn btn-line btn-sm"
                                                        disabled={sendingVerification}
                                                        onClick={handleSendVerification}
                                                    >
                                                        {sendingVerification
                                                            ? "Sending..."
                                                            : "Verify email"}
                                                    </button>
                                                </div>

                                                {verificationMessage && (
                                                    <div
                                                        className="text-success mt-2"
                                                        style={{ fontSize: ".85rem" }}
                                                    >
                                                        {verificationMessage}
                                                    </div>
                                                )}

                                                {verificationError && (
                                                    <div
                                                        className="text-danger mt-2"
                                                        style={{ fontSize: ".85rem" }}
                                                    >
                                                        {verificationError}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="d-grid mt-4">

                                    <Link
                                        href="/profile/edit"
                                        className="btn btn-brand"
                                    >
                                        Edit profile
                                    </Link>

                                </div>

                            </div>
                        </div>

                    </div>



                    <div className="col-lg-8">



                        <div className="row g-3 mb-4">

                            <div className="col-md-4">
                                <Link
                                    href="/profile/orders"
                                    className="text-decoration-none"
                                >
                                    <div
                                        className="card border-0 shadow-sm h-100"
                                        style={{
                                            borderRadius:
                                                "20px",
                                        }}
                                    >
                                        <div className="card-body p-4">

                                            <div
                                                className="mb-3"
                                                style={{
                                                    fontSize:
                                                        "1.8rem",
                                                }}
                                            >
                                                🍔
                                            </div>

                                            <h3 className="h5">
                                                Orders
                                            </h3>

                                            <p className="muted mb-0">
                                                Track and view
                                                your previous
                                                orders.
                                            </p>

                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="col-md-4">
                                <Link
                                    href="/profile/addresses"
                                    className="text-decoration-none"
                                >
                                    <div
                                        className="card border-0 shadow-sm h-100"
                                        style={{
                                            borderRadius:
                                                "20px",
                                        }}
                                    >
                                        <div className="card-body p-4">

                                            <div
                                                className="mb-3"
                                                style={{
                                                    fontSize:
                                                        "1.8rem",
                                                }}
                                            >
                                                📍
                                            </div>

                                            <h3 className="h5">
                                                Addresses
                                            </h3>

                                            <p className="muted mb-0">
                                                Manage delivery
                                                locations.
                                            </p>

                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="col-md-4">
                                <Link
                                    href="/profile/favorites"
                                    className="text-decoration-none"
                                >
                                    <div
                                        className="card border-0 shadow-sm h-100"
                                        style={{
                                            borderRadius:
                                                "20px",
                                        }}
                                    >
                                        <div className="card-body p-4">

                                            <div
                                                className="mb-3"
                                                style={{
                                                    fontSize:
                                                        "1.8rem",
                                                }}
                                            >
                                                ❤️
                                            </div>

                                            <h3 className="h5">
                                                Favorites
                                            </h3>

                                            <p className="muted mb-0">
                                                Your favorite
                                                restaurants and
                                                dishes.
                                            </p>

                                        </div>
                                    </div>
                                </Link>
                            </div>

                        </div>



                        <div
                            className="card border-0 shadow-sm mb-4"
                            style={{
                                borderRadius: "24px",
                            }}
                        >
                            <div className="card-body p-4 p-md-5">

                                <div className="d-flex justify-content-between align-items-center mb-4">

                                    <div>
                    <span className="eyebrow">
                      Account
                    </span>

                                        <h2 className="h3 mb-0">
                                            Personal information
                                        </h2>
                                    </div>

                                    <Link
                                        href="/profile/edit"
                                        className="btn btn-line btn-sm"
                                    >
                                        Edit
                                    </Link>

                                </div>

                                <div className="row g-4">

                                    <div className="col-md-6">

                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".82rem",
                                            }}
                                        >
                                            FULL NAME
                                        </div>

                                        <div className="fw-semibold">
                                            {profile.name}
                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".82rem",
                                            }}
                                        >
                                            EMAIL ADDRESS
                                        </div>

                                        <div className="fw-semibold">
                                            {profile.email}
                                        </div>

                                    </div>

                                    <div className="col-md-6">

                                        <div
                                            className="muted mb-1"
                                            style={{
                                                fontSize: ".82rem",
                                            }}
                                        >
                                            PHONE NUMBER
                                        </div>

                                        <div className="fw-semibold">
                                            {profile.phone ||
                                                "Not provided"}
                                        </div>

                                    </div>



                                </div>

                            </div>
                        </div>


                        {/* SECURITY */}

                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius: "24px",
                            }}
                        >
                            <div className="card-body p-4 p-md-5">

    <span className="eyebrow">
      Security
    </span>

                                <h2 className="h3 mb-4">
                                    Login & security
                                </h2>

                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                                    <div>
                                        <h3 className="h6 mb-1">
                                            Password
                                        </h3>

                                        <p className="muted mb-0">
                                            Create a password for email
                                            sign-in or update your existing
                                            password.
                                        </p>
                                    </div>

                                    <Link
                                        href="/profile/change-password"
                                        className="btn btn-line"
                                    >
                                        Password settings
                                    </Link>

                                </div>

                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </main>
    );
}
