"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import ProfileNav from "@/components/profile/ProfileNav";

export default function EditProfilePage() {
    const router =
        useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        name,
        setName,
    ] =
        useState("");

    const [
        phone,
        setPhone,
    ] =
        useState("");

    const [
        email,
        setEmail,
    ] =
        useState("");

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        message,
        setMessage,
    ] =
        useState("");

    const [
        error,
        setError,
    ] =
        useState("");

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
                        "/api/auth/me"
                    );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load profile."
                    );
                }

                const data =
                    await response.json();

                setName(
                    data.user.name ?? ""
                );

                setEmail(
                    data.user.email ?? ""
                );

                setPhone(
                    data.user.phone ?? ""
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load profile."
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

    async function handleSubmit(
        event:
        FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response =
                await apiFetch(
                    "/api/profile",
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            name,
                            phone,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ??
                    "Unable to update profile."
                );
            }

            setName(
                data.user.name
            );

            setPhone(
                data.user.phone ?? ""
            );

            setMessage(
                "Profile updated successfully."
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to update profile."
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
                Loading profile...
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
                    Edit information
                </h1>

                <p className="muted mb-4">
                    Update your personal account
                    information.
                </p>

                <ProfileNav />

                <div className="row">

                    <div className="col-lg-7">

                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius:
                                    "24px",
                            }}
                        >
                            <div className="card-body p-4 p-md-5">

                                {error && (
                                    <div className="alert alert-danger">
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div className="alert alert-success">
                                        {message}
                                    </div>
                                )}

                                <form
                                    onSubmit={
                                        handleSubmit
                                    }
                                >

                                    <div className="mb-3">

                                        <label
                                            className="form-label"
                                            htmlFor="name"
                                        >
                                            Full name
                                        </label>

                                        <input
                                            id="name"
                                            className="form-control"
                                            value={name}
                                            onChange={(e) =>
                                                setName(
                                                    e.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label
                                            className="form-label"
                                            htmlFor="email"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="email"
                                            className="form-control"
                                            value={email}
                                            disabled
                                        />

                                        <div className="form-text">
                                            Email changes will
                                            require verification.
                                        </div>

                                    </div>

                                    <div className="mb-4">

                                        <label
                                            className="form-label"
                                            htmlFor="phone"
                                        >
                                            Phone number
                                        </label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            className="form-control"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-brand"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save changes"}
                                    </button>

                                </form>

                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </main>
    );
}