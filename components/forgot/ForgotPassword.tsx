"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

export default function ForgotPassword() {
  const router =
      useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    sendLoading,
    setSendLoading,
  ] = useState(false);

  const [
    sendMessage,
    setSendMessage,
  ] =
      useState<{
        type:
            | "success"
            | "danger";

        text: string;
      } | null>(null);

  /*
   * =====================================
   * STEP 2
   * =====================================
   */

  const [
    token,
    setToken,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    resetLoading,
    setResetLoading,
  ] = useState(false);

  const [
    resetMessage,
    setResetMessage,
  ] =
      useState<{
        type:
            | "success"
            | "danger";

        text: string;
      } | null>(null);



  async function sendToken(
      event: FormEvent
  ) {
    event.preventDefault();

    setSendMessage(
        null
    );

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();

    if (
        !normalizedEmail
    ) {
      setSendMessage({
        type: "danger",

        text:
            "Enter the email you signed up with.",
      });

      return;
    }

    try {
      setSendLoading(
          true
      );

      const response =
          await fetch(
              "/api/auth/forgot-password",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                      "application/json",
                },

                body:
                    JSON.stringify({
                      email:
                      normalizedEmail,
                    }),
              }
          );

      const data =
          await response.json();

      if (!response.ok) {
        setSendMessage({
          type: "danger",

          text:
              data.error ||
              "Could not send reset token.",
        });

        return;
      }

      setSendMessage({
        type: "success",

        text:
            data.message ||
            "Check your email for your reset token.",
      });
    } catch {
      setSendMessage({
        type: "danger",

        text:
            "Could not send reset token.",
      });
    } finally {
      setSendLoading(
          false
      );
    }
  }



  async function resetPassword(
      event: FormEvent
  ) {
    event.preventDefault();

    setResetMessage(
        null
    );

    const cleanToken =
        token.trim();

    if (
        !cleanToken ||
        !password ||
        !confirmPassword
    ) {
      setResetMessage({
        type: "danger",

        text:
            "Fill in every field.",
      });

      return;
    }



    if (
        password.length < 8
    ) {
      setResetMessage({
        type: "danger",

        text:
            "Your password needs at least 8 characters.",
      });

      return;
    }

    if (
        password !==
        confirmPassword
    ) {
      setResetMessage({
        type: "danger",

        text:
            "The two passwords don't match.",
      });

      return;
    }

    try {
      setResetLoading(
          true
      );

      const response =
          await fetch(
              "/api/auth/reset-password",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                      "application/json",
                },

                body:
                    JSON.stringify({
                      token:
                      cleanToken,

                      password,
                    }),
              }
          );

      const data =
          await response.json();

      if (!response.ok) {
        setResetMessage({
          type: "danger",

          text:
              data.error ||
              "Could not reset password.",
        });

        return;
      }

      setResetMessage({
        type: "success",

        text:
            "Password updated. Taking you to sign in…",
      });


      window.setTimeout(
          () => {
            router.push(
                "/login"
            );
          },
          1000
      );
    } catch {
      setResetMessage({
        type: "danger",

        text:
            "Could not reset password.",
      });
    } finally {
      setResetLoading(
          false
      );
    }
  }

  return (
      <main>

        <section className="section">

          <div className="container">

            <div className="row justify-content-center">

              <div className="col-12 col-lg-9 col-xl-8">



                <div className="text-center mb-5">

                <span className="eyebrow">
                  Account recovery
                </span>

                  <h1 className="display-lg mb-2">
                    Reset your password
                  </h1>

                  <p className="lead mx-auto">
                    Request a secure
                    one-time token by
                    email, then choose
                    your new password.
                    Tokens expire after
                    15 minutes.
                  </p>

                </div>

                <div className="row g-4">



                  <div className="col-12 col-lg-6">

                    <div className="panel h-100">

                      <div className="panel-head">

                      <span>
                        Step 1 — Request
                        a token
                      </span>

                        <span className="badge-soft is-brand">
                        Start here
                      </span>

                      </div>

                      <div className="panel-body">

                        {sendMessage && (

                            <div
                                className={`alert alert-${sendMessage.type} mb-3`}
                            >
                              {
                                sendMessage.text
                              }
                            </div>

                        )}

                        <form
                            onSubmit={
                              sendToken
                            }
                        >

                          <label
                              className="form-label"
                              htmlFor="email"
                          >
                            Email address
                          </label>

                          <input
                              id="email"
                              type="email"
                              className="form-control mb-3"
                              placeholder="you@example.com"
                              autoComplete="email"
                              value={
                                email
                              }
                              onChange={(
                                  event
                              ) =>
                                  setEmail(
                                      event
                                          .target
                                          .value
                                  )
                              }
                          />

                          <div className="d-grid">

                            <button
                                type="submit"
                                className="btn btn-brand"
                                disabled={
                                  sendLoading
                                }
                            >

                              {sendLoading
                                  ? "Sending..."
                                  : "Send reset token"}

                            </button>

                          </div>

                        </form>

                        <p
                            className="muted mt-3 mb-0"
                            style={{
                              fontSize:
                                  ".84rem",
                            }}
                        >
                          If an account
                          exists with that
                          email, we&apos;ll
                          send a one-time
                          reset token.
                        </p>

                      </div>

                    </div>

                  </div>



                  <div className="col-12 col-lg-6">

                    <div className="panel h-100">

                      <div className="panel-head">

                      <span>
                        Step 2 — Set a
                        new password
                      </span>

                        <span className="badge-soft">
                        15 min window
                      </span>

                      </div>

                      <div className="panel-body">

                        {resetMessage && (

                            <div
                                className={`alert alert-${resetMessage.type} mb-3`}
                            >
                              {
                                resetMessage.text
                              }
                            </div>

                        )}

                        <form
                            onSubmit={
                              resetPassword
                            }
                        >



                          <label
                              className="form-label"
                              htmlFor="token"
                          >
                            Reset token
                          </label>

                          <input
                              id="token"
                              className="form-control mb-3"
                              placeholder="Paste your email token here"
                              autoComplete="off"
                              value={
                                token
                              }
                              onChange={(
                                  event
                              ) =>
                                  setToken(
                                      event
                                          .target
                                          .value
                                  )
                              }
                          />


                          <label
                              className="form-label"
                              htmlFor="password"
                          >
                            New password
                          </label>

                          <input
                              id="password"
                              type="password"
                              className="form-control mb-3"
                              placeholder="At least 8 characters"
                              autoComplete="new-password"
                              value={
                                password
                              }
                              onChange={(
                                  event
                              ) =>
                                  setPassword(
                                      event
                                          .target
                                          .value
                                  )
                              }
                          />



                          <label
                              className="form-label"
                              htmlFor="confirmPassword"
                          >
                            Repeat new
                            password
                          </label>

                          <input
                              id="confirmPassword"
                              type="password"
                              className="form-control mb-3"
                              placeholder="Type it again"
                              autoComplete="new-password"
                              value={
                                confirmPassword
                              }
                              onChange={(
                                  event
                              ) =>
                                  setConfirmPassword(
                                      event
                                          .target
                                          .value
                                  )
                              }
                          />

                          <div className="d-grid">

                            <button
                                type="submit"
                                className="btn btn-brand"
                                disabled={
                                  resetLoading
                                }
                            >

                              {resetLoading
                                  ? "Updating..."
                                  : "Update password"}

                            </button>

                          </div>

                        </form>

                      </div>

                    </div>

                  </div>

                </div>



                <div className="card-soft mt-4 text-center">

                  <p className="muted mb-0">

                    Remembered it after
                    all?{" "}

                    <Link
                        className="fw-bold"
                        href="/login"
                    >
                      Go back to sign in
                    </Link>

                    {" — or "}

                    <Link
                        className="fw-bold"
                        href="/register"
                    >
                      create a new account
                    </Link>

                    .

                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>
  );
}