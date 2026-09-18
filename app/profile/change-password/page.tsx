"use client";

import {
    useEffect,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import ProfileNav from "@/components/profile/ProfileNav";

export default function ChangePasswordPage() {
    const router = useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        hasPassword,
        setHasPassword,
    ] = useState<boolean | null>(
        null
    );

    const [
        currentPassword,
        setCurrentPassword,
    ] = useState("");

    const [
        newPassword,
        setNewPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        async function loadPasswordStatus() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await apiFetch(
                        "/api/profile/password"
                    );

                if (
                    response.status === 401
                ) {
                    router.replace("/login");
                    return;
                }

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to load password settings."
                    );
                }

                setHasPassword(
                    data.hasPassword
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load password settings."
                );
            } finally {
                setLoading(false);
            }
        }

        loadPasswordStatus();
    }, [
        authLoading,
        user,
        apiFetch,
        router,
    ]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (
            newPassword.length < 8
        ) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        try {
            setSaving(true);

            const response =
                await apiFetch(
                    "/api/profile/password",
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            currentPassword:
                                hasPassword
                                    ? currentPassword
                                    : undefined,

                            newPassword,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to update password."
                );
            }

            setSuccess(
                data.message ||
                "Password updated successfully."
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            /*
             * Google-only account now has
             * a normal password too.
             */
            setHasPassword(true);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to update password."
            );
        } finally {
            setSaving(false);
        }
    }

    if (
        authLoading ||
        loading
    ) {
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
                            Loading security settings...
                        </p>

                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="py-5">
            <div className="container">

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">

                    <div>
            <span className="eyebrow">
              Security
            </span>

                        <h1 className="display-md mb-2">
                            {hasPassword
                                ? "Change password"
                                : "Create password"}
                        </h1>

                        <p className="muted mb-0">
                            {hasPassword
                                ? "Update the password you use to sign in to Foodly."
                                : "Create a password so you can also sign in with your email and password."}
                        </p>
                    </div>

                    <ProfileNav />

                </div>

                <div className="row justify-content-center">

                    <div className="col-lg-7">

                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius: "24px",
                            }}
                        >
                            <div className="card-body p-4 p-md-5">

                                {error && (
                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div
                                        className="alert alert-success"
                                        role="alert"
                                    >
                                        {success}
                                    </div>
                                )}

                                {!hasPassword && (
                                    <div className="alert alert-info mb-4">
                                        You signed in without a
                                        Foodly password. Create one
                                        here to enable email and
                                        password sign-in too.
                                    </div>
                                )}

                                <form
                                    onSubmit={
                                        handleSubmit
                                    }
                                >

                                    {hasPassword && (
                                        <div className="mb-3">

                                            <label
                                                className="form-label"
                                                htmlFor="currentPassword"
                                            >
                                                Current password
                                            </label>

                                            <input
                                                id="currentPassword"
                                                type="password"
                                                className="form-control"
                                                autoComplete="current-password"
                                                value={
                                                    currentPassword
                                                }
                                                onChange={(e) =>
                                                    setCurrentPassword(
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />

                                        </div>
                                    )}

                                    <div className="mb-3">

                                        <label
                                            className="form-label"
                                            htmlFor="newPassword"
                                        >
                                            New password
                                        </label>

                                        <input
                                            id="newPassword"
                                            type="password"
                                            className="form-control"
                                            placeholder="Minimum 8 characters"
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(
                                                    e.target.value
                                                )
                                            }
                                            minLength={8}
                                            required
                                        />

                                    </div>

                                    <div className="mb-4">

                                        <label
                                            className="form-label"
                                            htmlFor="confirmPassword"
                                        >
                                            Confirm new password
                                        </label>

                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            className="form-control"
                                            placeholder="Repeat your password"
                                            autoComplete="new-password"
                                            value={
                                                confirmPassword
                                            }
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            minLength={8}
                                            required
                                        />

                                    </div>

                                    <div className="d-flex flex-column flex-sm-row gap-2">

                                        <button
                                            type="submit"
                                            className="btn btn-brand"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : hasPassword
                                                    ? "Change password"
                                                    : "Create password"}
                                        </button>

                                        <Link
                                            href="/profile"
                                            className="btn btn-line"
                                        >
                                            Back to profile
                                        </Link>

                                    </div>

                                </form>

                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </main>
    );
}