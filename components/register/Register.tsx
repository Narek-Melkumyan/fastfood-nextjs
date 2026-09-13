"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";

export default function Register() {
  const router = useRouter();

  const { register } = useAuth();

  const [name, setName] =
      useState("");

  const [email, setEmail] =
      useState("");

  const [phone, setPhone] =
      useState("");

  const [password, setPassword] =
      useState("");

  const [confirmPassword, setConfirmPassword] =
      useState("");

  const [remember, setRemember] =
      useState(true);

  const [error, setError] =
      useState("");

  const [loading, setLoading] =
      useState(false);

  async function handleSubmit(
      event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError(
          "Passwords do not match."
      );

      return;
    }

    if (password.length < 8) {
      setError(
          "Password must be at least 8 characters."
      );

      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        phone,
        password,
        remember,
      });

      router.push("/profile");
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Unable to create account."
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
              Join Foodly
            </span>

              <h1 className="display-md mb-2">
                Create your account
              </h1>

              <p className="muted mb-4">
                Save your addresses, track orders
                and reorder your favorites anytime.
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
                      htmlFor="name"
                  >
                    Full name
                  </label>

                  <input
                      id="name"
                      type="text"
                      className="form-control"
                      placeholder="John Smith"
                      autoComplete="name"
                      value={name}
                      onChange={(e) =>
                          setName(e.target.value)
                      }
                      required
                  />

                </div>

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
                      htmlFor="phone"
                  >
                    Phone number
                    <span className="muted">
                    {" "}
                      (optional)
                  </span>
                  </label>

                  <input
                      id="phone"
                      type="tel"
                      className="form-control"
                      placeholder="+1 818 555 1234"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) =>
                          setPhone(e.target.value)
                      }
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
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) =>
                          setPassword(e.target.value)
                      }
                      minLength={8}
                      required
                  />

                </div>

                <div className="mb-3">

                  <label
                      className="form-label"
                      htmlFor="confirmPassword"
                  >
                    Confirm password
                  </label>

                  <input
                      id="confirmPassword"
                      type="password"
                      className="form-control"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) =>
                          setConfirmPassword(
                              e.target.value
                          )
                      }
                      minLength={8}
                      required
                  />

                </div>

                <div className="form-check mb-4">

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

                <div className="d-grid gap-2">

                  <button
                      type="submit"
                      className="btn btn-brand btn-lg"
                      disabled={loading}
                  >
                    {loading
                        ? "Creating account..."
                        : "Create account"}
                  </button>

                  <Link
                      href="/login"
                      className="btn btn-line"
                  >
                    I already have an account
                  </Link>

                </div>

              </form>

              <div className="d-flex align-items-center gap-3 my-4">

              <span
                  style={{
                    flex: "1",
                    height: "1px",
                    background:
                        "var(--line)",
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
                      background:
                          "var(--line)",
                    }}
                />

              </div>

              <div className="d-grid gap-2">

                <button
                    type="button"
                    className="btn btn-line"
                >
                  Continue with Google
                </button>

                <button
                    type="button"
                    className="btn btn-line"
                >
                  Continue with Apple
                </button>

              </div>

              <p
                  className="muted mt-4 mb-0"
                  style={{
                    fontSize: ".84rem",
                  }}
              >
                By creating an account, you agree
                to Foodly&apos;s Terms and Privacy
                Policy.
              </p>

            </div>
          </div>

          <div className="auth-art order-1 order-lg-2">

            <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop"
                alt="Foodly restaurant dishes"
            />

            <div className="auth-art-inner text-center">

              <h2 className="display-md">
                Your favorite food,
                one account away
              </h2>

              <p className="mb-4">
                Save restaurants, track deliveries
                and order again in just a few taps.
              </p>

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
                  Fast checkout
                </b>
                {" · "}
                Saved addresses
                {" · "}
                Order history
              </div>

            </div>

          </div>

        </div>
      </div>
  );
}