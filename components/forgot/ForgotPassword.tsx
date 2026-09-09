"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readStorage, type User } from "../shared/storage";
import { createEffects, requireElement } from "../shared/dom";

export default function ForgotPassword() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    if (!mountedRoot)
      return;
    const root = mountedRoot;
    const effects = createEffects();
    const USERS_KEY = "food_users_v1";
    const RESET_KEY = "food_reset_v1"; // {email, token, expiresAt}
    const $msg1 = requireElement(root, "#msg1", HTMLElement);
    const $msg2 = requireElement(root, "#msg2", HTMLElement);
    function readUsers() { return readStorage(USERS_KEY, []); }
    function writeUsers(users: User[]) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    function show(el: HTMLElement, type: string, text: string) { el.innerHTML = `<div class="alert alert-${type}">${text}</div>`; }
    function randToken() { return Math.random().toString(36).slice(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase(); }
    effects.listen(requireElement(root, "#sendBtn", HTMLButtonElement), "click", () => {
      const email = (requireElement(root, "#email", HTMLInputElement).value || "").trim().toLowerCase();
      if (!email) {
        show($msg1, "danger", "Enter the email you signed up with.");
        return;
      }
      const users = readUsers();
      const u = users.find(x => x.email === email);
      if (!u) {
        show($msg1, "danger", "No account found with that email.");
        return;
      }
      const token = randToken();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      localStorage.setItem(RESET_KEY, JSON.stringify({ email, token, expiresAt }));
      show($msg1, "success", `Token created: <b>${token}</b> — valid for 15 minutes.`);
      requireElement(root, "#token", HTMLInputElement).value = token;
    });
    effects.listen(requireElement(root, "#resetBtn", HTMLButtonElement), "click", () => {
      const token = (requireElement(root, "#token", HTMLInputElement).value || "").trim();
      const p1 = requireElement(root, "#p1", HTMLInputElement).value || "";
      const p2 = requireElement(root, "#p2", HTMLInputElement).value || "";
      if (!token || !p1 || !p2) {
        show($msg2, "danger", "Fill in every field.");
        return;
      }
      if (p1.length < 6) {
        show($msg2, "danger", "Your password needs at least 6 characters.");
        return;
      }
      if (p1 !== p2) {
        show($msg2, "danger", "The two passwords don't match.");
        return;
      }
      const reset = readStorage(RESET_KEY, null);
      if (!reset) {
        show($msg2, "danger", "No reset request found — start with step 1.");
        return;
      }
      if (Date.now() > reset.expiresAt) {
        show($msg2, "danger", "That token has expired. Request a new one.");
        return;
      }
      if (reset.token !== token) {
        show($msg2, "danger", "That token isn't right.");
        return;
      }
      const users = readUsers();
      const idx = users.findIndex(u => u.email === reset.email);
      if (idx === -1) {
        show($msg2, "danger", "We couldn't find that account any more.");
        return;
      }
      users[idx].password = p1;
      writeUsers(users);
      localStorage.removeItem(RESET_KEY);
      show($msg2, "success", "Password updated. Taking you to the sign-in page…");
      effects.delay(() => router.push("/login"), 900);
    });
    return effects.cleanup;
  }, [router]);

  return (
    <div ref={rootRef}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9 col-xl-8">
            <div className="text-center mb-5">
              <span className="eyebrow">Account recovery</span>
              <h1 className="display-lg mb-2">Reset your password</h1>
              <p className="lead mx-auto">
                Two steps: request a one-time token, then choose a new password. Tokens expire after 15 minutes.
              </p>
            </div>
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="panel h-100">
                  <div className="panel-head">
                    <span>Step 1 — Request a token</span>
                    <span className="badge-soft is-brand">Start here</span>
                  </div>
                  <div className="panel-body">
                    <div id="msg1" className="mb-3"></div>
                    <label className="form-label" htmlFor="email">Email address</label>
                    <input id="email" type="email" className="form-control mb-3" placeholder="you@example.com" autoComplete="email" />
                    <div className="d-grid"><button id="sendBtn" className="btn btn-brand">Send reset token</button></div>
                    <p className="muted mt-3 mb-0" style={{ "fontSize": ".84rem" }}>
                      In a live build this arrives by email. In this demo the token is shown on screen and copied into step 2 for you.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="panel h-100">
                  <div className="panel-head">
                    <span>Step 2 — Set a new password</span>
                    <span className="badge-soft">15 min window</span>
                  </div>
                  <div className="panel-body">
                    <div id="msg2" className="mb-3"></div>
                    <label className="form-label" htmlFor="token">Reset token</label>
                    <input id="token" className="form-control mb-3" placeholder="Paste the token here" />
                    <label className="form-label" htmlFor="p1">New password</label>
                    <input id="p1" type="password" className="form-control mb-3" placeholder="At least 6 characters" autoComplete="new-password" />
                    <label className="form-label" htmlFor="p2">Repeat new password</label>
                    <input id="p2" type="password" className="form-control mb-3" placeholder="Type it again" autoComplete="new-password" />
                    <div className="d-grid"><button id="resetBtn" className="btn btn-brand">Update password</button></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-soft mt-4 text-center">
              <p className="muted mb-0">
                Remembered it after all?
                <Link className="fw-bold" href="/login">Go back to sign in</Link>
                — or
                <Link className="fw-bold" href="/register">create a new account</Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
