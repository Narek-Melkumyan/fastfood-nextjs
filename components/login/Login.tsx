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

type OAuthProvider =
    | "google"
    | "facebook"
    | null;

export default function Login() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] =
      useState("");

  const [password, setPassword] =
      useState("");

  const [remember, setRemember] =
      useState(false);

  const [error, setError] =
      useState("");

  const [loading, setLoading] =
      useState(false);

  const [
    oauthLoading,
    setOauthLoading,
  ] = useState<OAuthProvider>(null);

  useEffect(() => {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const oauthError =
        params.get("oauth");

    if (!oauthError) {
      return;
    }

    const messages:
        Record<string, string> = {
      cancelled:
          "Google sign-in was cancelled.",

      google_error:
          "Google could not complete sign-in.",

      invalid_request:
          "The Google sign-in request was invalid. Please try again.",

      invalid_state:
          "The Google sign-in session expired or was invalid. Please try again.",

      token_exchange_failed:
          "Google sign-in could not be completed. Please try again.",

      profile_failed:
          "We could not load your Google profile.",

      email_not_verified:
          "Your Google email must be verified before signing in.",

      configuration_error:
          "Google sign-in is not configured correctly.",

      facebook_cancelled:
          "Facebook sign-in was cancelled.",

      facebook_error:
          "Facebook could not complete sign-in.",

      facebook_invalid_request:
          "The Facebook sign-in request was invalid. Please try again.",

      facebook_invalid_state:
          "The Facebook sign-in session expired or was invalid. Please try again.",

      facebook_token_exchange_failed:
          "Facebook sign-in could not be completed. Please try again.",

      facebook_profile_failed:
          "We could not load your Facebook profile.",

      facebook_email_missing:
          "Facebook did not provide an email address for this account.",

      facebook_email_exists:
          "An account with this email already exists. Sign in with your existing method first.",

      facebook_configuration_error:
          "Facebook sign-in is not configured correctly.",

      account_disabled:
          "This account is disabled.",

      failed:
          "Google sign-in failed. Please try again.",

      facebook_failed:
          "Facebook sign-in failed. Please try again.",
    };

    setError(
        messages[oauthError] ||
        "Social sign-in failed. Please try again."
    );
  }, []);

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

  function handleGoogleLogin() {
    setError("");
    setOauthLoading("google");

    window.location.assign(
        "/api/auth/google"
    );
  }

  function handleFacebookLogin() {
    setError("");
    setOauthLoading("facebook");

    window.location.assign(
        "/api/auth/facebook"
    );
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
                  <div
                      className="alert alert-danger mb-3"
                      role="alert"
                  >
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
                          setEmail(
                              e.target.value
                          )
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
                          setPassword(
                              e.target.value
                          )
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
                      disabled={
                          loading ||
                          oauthLoading !== null
                      }
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
                    className="btn btn-line"
                    type="button"
                    onClick={
                      handleGoogleLogin
                    }
                    disabled={
                        loading ||
                        oauthLoading !== null
                    }
                >
                  {oauthLoading === "google"
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                </button>

                <button
                    className="btn btn-line"
                    type="button"
                    onClick={
                      handleFacebookLogin
                    }
                    disabled={
                        loading ||
                        oauthLoading !== null
                    }
                >
                  {oauthLoading === "facebook"
                      ? "Connecting to Facebook..."
                      : "Continue with Facebook"}
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
                Your orders,
                all in one place
              </h2>

              <p className="mb-4">
                Sign in to track deliveries,
                manage saved addresses and quickly
                reorder your favorite meals.
              </p>

              <div className="d-flex justify-content-center align-items-center gap-3">

                <div
                    style={{
                      color:
                          "rgba(255,255,255,.8)",
                      fontSize: ".9rem",
                    }}
                >
                  Secure account access
                  {" · "}
                  Saved addresses
                  {" · "}
                  Order history
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
  );
}