"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";

export default function Login() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
      event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login({
        email,
        password,
        remember,
      });

      router.push("/profile");
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
      <div>
        <div className="auth-wrap">

          <div className="auth-form order-2 order-lg-1">

            <div className="auth-form-inner">

            <span className="eyebrow">
              Welcome back
            </span>

              <h1 className="display-md mb-2">
                Sign in to Foodly
              </h1>

              <p className="muted mb-4">
                Track live orders, reorder in one tap
                and keep your addresses saved.
              </p>

              {error && (
                  <div className="alert alert-danger mb-3">
                    {error}
                  </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="mb-3">

                  <label
                      className="form-label"
                      htmlFor="email"
                  >
                    Email address
                  </label>

                  <input
                      id="email"
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) =>
                          setEmail(e.target.value)
                      }
                      required
                  />

                </div>

                <div className="mb-3">

                  <label
                      className="form-label"
                      htmlFor="password"
                  >
                    Password
                  </label>

                  <input
                      id="password"
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                          setPassword(e.target.value)
                      }
                      required
                  />

                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">

                  <div className="form-check">

                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="remember"
                        checked={remember}
                        onChange={(e) =>
                            setRemember(
                                e.target.checked
                            )
                        }
                    />

                    <label
                        className="form-check-label"
                        htmlFor="remember"
                    >
                      Keep me signed in
                    </label>

                  </div>

                  <Link
                      href="/forgot"
                      className="fw-bold"
                  >
                    Forgot password?
                  </Link>

                </div>

                <div className="d-grid gap-2">

                  <button
                      type="submit"
                      className="btn btn-brand btn-lg"
                      disabled={loading}
                  >
                    {loading
                        ? "Signing in..."
                        : "Sign in"}
                  </button>

                  <Link
                      className="btn btn-line"
                      href="/register"
                  >
                    Create an account instead
                  </Link>

                </div>

              </form>

              <div className="d-flex align-items-center gap-3 my-4">

              <span
                  style={{
                    flex: "1",
                    height: "1px",
                    background: "var(--line)",
                  }}
              />

                <span
                    className="muted"
                    style={{
                      fontSize: ".82rem",
                    }}
                >
                OR
              </span>

                <span
                    style={{
                      flex: "1",
                      height: "1px",
                      background: "var(--line)",
                    }}
                />

              </div>

              <div className="d-grid gap-2">

                <button
                    className="btn btn-line"
                    type="button"
                >
                  Continue with Google
                </button>

                <button
                    className="btn btn-line"
                    type="button"
                >
                  Continue with Apple
                </button>

              </div>

            </div>

          </div>

          <div className="auth-art order-1 order-lg-2">

            <img
                src="https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200&auto=format&fit=crop"
                alt="Freshly prepared dishes"
            />

            <div className="auth-art-inner text-center">

              <h2 className="display-md">
                1.2 million orders and counting
              </h2>

              <p className="mb-4">
                480+ kitchens, 28 minutes on
                average, and a courier map you can
                actually watch.
              </p>

              <div className="d-flex justify-content-center align-items-center gap-3">

                <div
                    style={{
                      color:
                          "rgba(255,255,255,.8)",
                      fontSize: ".9rem",
                    }}
                >
                  <b
                      style={{
                        color: "#fff",
                      }}
                  >
                    4.9 / 5
                  </b>{" "}
                  from 12,400+ reviews
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
  );
}