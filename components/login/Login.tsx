"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readStorage, type Session } from "../shared/storage";
import { createEffects, requireElement } from "../shared/dom";

export default function Login() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    if (!mountedRoot)
      return;
    const root = mountedRoot;
    const effects = createEffects();
    const USERS_KEY = "food_users_v1";
    const SESSION_KEY = "food_session_v1";
    const $msg = requireElement(root, "#msg", HTMLElement);
    const $email = requireElement(root, "#email", HTMLInputElement);
    const $pass = requireElement(root, "#password", HTMLInputElement);
    const $remember = requireElement(root, "#remember", HTMLInputElement);
    const $btn = requireElement(root, "#loginBtn", HTMLButtonElement);
    function readUsers() { return readStorage(USERS_KEY, []); }
    function writeSession(s: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
    function show(type: string, text: string) { $msg.innerHTML = `<div class="alert alert-${type}">${text}</div>`; }
    effects.listen($btn, "click", () => {
      const email = ($email.value || "").trim().toLowerCase();
      const password = $pass.value || "";
      if (!email || !password) {
        show("danger", "Enter your email and password.");
        return;
      }
      const users = readUsers();
      const u = users.find(x => x.email === email);
      if (!u) {
        show("danger", "No account found with that email.");
        return;
      }
      if (u.password !== password) {
        show("danger", "That password doesn't match.");
        return;
      }
      writeSession({ email, createdAt: Date.now(), remember: $remember.checked });
      show("success", "Signed in. Taking you to your account…");
      effects.delay(() => router.push("/profile"), 700);
    });
    effects.listen($pass, "keydown", (e) => {
      if (e.key === "Enter")
        $btn.click();
    });
    return effects.cleanup;
  }, [router]);

  return (
    <div ref={rootRef}>
      <div className="auth-wrap">
        <div className="auth-form order-2 order-lg-1">
          <div className="auth-form-inner">
            <span className="eyebrow">Welcome back</span>
            <h1 className="display-md mb-2">Sign in to Foodly</h1>
            <p className="muted mb-4">Track live orders, reorder in one tap and keep your addresses saved.</p>
            <div id="msg" className="mb-3"></div>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className="form-control" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="form-control" placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label" htmlFor="remember">Keep me signed in</label>
              </div>
              <Link href="/forgot" className="fw-bold">Forgot password?</Link>
            </div>
            <div className="d-grid gap-2">
              <button id="loginBtn" className="btn btn-brand btn-lg">Sign in</button>
              <Link className="btn btn-line" href="/register">Create an account instead</Link>
            </div>
            <div className="d-flex align-items-center gap-3 my-4">
              <span style={{ "flex": "1", "height": "1px", "background": "var(--line)" }}></span>
              <span className="muted" style={{ "fontSize": ".82rem" }}>OR</span>
              <span style={{ "flex": "1", "height": "1px", "background": "var(--line)" }}></span>
            </div>
            <div className="d-grid gap-2">
              <button className="btn btn-line" type="button">Continue with Google</button>
              <button className="btn btn-line" type="button">Continue with Apple</button>
            </div>
            <p className="muted mt-4 mb-0" style={{ "fontSize": ".84rem" }}>
              Demo build — accounts are stored in
              <code>localStorage</code>
              . Register first, then sign in.
            </p>
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
              480+ kitchens, 28 minutes on average, and a courier map you can actually
              watch.
            </p>

            <div className="d-flex justify-content-center align-items-center gap-3">
              <div
                style={{
                  color: "rgba(255,255,255,.8)",
                  fontSize: ".9rem",
                }}
              >
                <b style={{ color: "#fff" }}>4.9 / 5</b>{" "}
                from 12,400+ reviews
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

