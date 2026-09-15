"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
    token: string;
};

export default function VerifyEmailClient({ token }: Props) {
    const [status, setStatus] = useState<
        "loading" | "success" | "error"
    >("loading");

    const [message, setMessage] = useState(
        "Verifying your email..."
    );

    useEffect(() => {
        let ignore = false;

        async function verifyEmail() {
            if (!token) {
                setStatus("error");
                setMessage("Verification token is missing.");
                return;
            }

            try {
                const response = await fetch(
                    "/api/auth/email-verification/verify",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            token,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Could not verify email."
                    );
                }

                if (!ignore) {
                    setStatus("success");
                    setMessage(
                        data.message || "Your email has been verified."
                    );
                }
            } catch (error) {
                if (!ignore) {
                    setStatus("error");

                    setMessage(
                        error instanceof Error
                            ? error.message
                            : "Could not verify email."
                    );
                }
            }
        }

        verifyEmail();

        return () => {
            ignore = true;
        };
    }, [token]);

    return (
        <main className="py-5">
            <div className="container">
                <div
                    className="card border-0 shadow-sm mx-auto"
                    style={{
                        maxWidth: "560px",
                        borderRadius: "24px",
                    }}
                >
                    <div className="card-body p-4 p-md-5 text-center">
                        {status === "loading" && (
                            <>
                                <div
                                    className="spinner-border mb-4"
                                    role="status"
                                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                                </div>

                                <h1 className="h3 mb-2">
                                    Verifying email
                                </h1>
                            </>
                        )}

                        {status === "success" && (
                            <>
                                <div
                                    className="mb-3"
                                    style={{
                                        fontSize: "3rem",
                                    }}
                                >
                                    ✅
                                </div>

                                <h1 className="h3 mb-2">
                                    Email verified
                                </h1>
                            </>
                        )}

                        {status === "error" && (
                            <>
                                <div
                                    className="mb-3"
                                    style={{
                                        fontSize: "3rem",
                                    }}
                                >
                                    ❌
                                </div>

                                <h1 className="h3 mb-2">
                                    Verification failed
                                </h1>
                            </>
                        )}

                        <p className="muted mb-4">
                            {message}
                        </p>

                        {status !== "loading" && (
                            <Link
                                href="/profile"
                                className="btn btn-brand"
                            >
                                Go to my profile
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}