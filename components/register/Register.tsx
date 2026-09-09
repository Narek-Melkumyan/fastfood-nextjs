"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readStorage, type User } from "../shared/storage";
import { createEffects, requireElement } from "../shared/dom";

export default function Register() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    if (!mountedRoot)
      return;
    const root = mountedRoot;
    const effects = createEffects();
    const USERS_KEY = "food_users_v1";
    const $msg = requireElement(root, "#msg", HTMLElement);
    function readUsers() { return readStorage(USERS_KEY, []); }
    function writeUsers(users: User[]) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    function show(type: string, text: string) { $msg.innerHTML = `<div class="alert alert-${type}">${text}</div>`; }
    effects.listen(requireElement(root, "#regBtn", HTMLButtonElement), "click", () => {
      const name = requireElement(root, "#name", HTMLInputElement).value.trim();
      const phone = requireElement(root, "#phone", HTMLInputElement).value.trim();
      const email = (requireElement(root, "#email", HTMLInputElement).value || "").trim().toLowerCase();
      const p1 = requireElement(root, "#password", HTMLInputElement).value || "";
      const p2 = requireElement(root, "#password2", HTMLInputElement).value || "";
      const agree = requireElement(root, "#agree", HTMLInputElement).checked;
      if (!name || !email || !p1 || !p2) {
        show("danger", "Please fill in every required field.");
        return;
      }
      if (p1.length < 6) {
        show("danger", "Your password needs at least 6 characters.");
        return;
      }
      if (p1 !== p2) {
        show("danger", "The two passwords don't match.");
        return;
      }
      if (!agree) {
        show("danger", "Please accept the terms to continue.");
        return;
      }
      const users = readUsers();
      if (users.some(u => u.email === email)) {
        show("danger", "An account with that email already exists.");
        return;
      }
      users.push({ id: Date.now(), name, phone, email, password: p1, createdAt: Date.now() });
      writeUsers(users);
      show("success", "Account created. Taking you to the sign-in page…");
      effects.delay(() => router.push("/login"), 800);
    });
    return effects.cleanup;
  }, [router]);

  return (
    <div ref={rootRef}>
      <div className="auth-wrap">
        <div className="auth-form order-2 order-lg-1">
          <div className="auth-form-inner">
            <span className="eyebrow">Get started</span>
            <h1 className="display-md mb-2">Create your account</h1>
            <p className="muted mb-4">It takes about thirty seconds, and your first delivery is free.</p>
            <div id="msg" className="mb-3"></div>
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="name">Full name *</label>
                <input id="name" className="form-control" placeholder="e.g. Daniel" autoComplete="name" />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="phone">
                  Phone
                  <span className="muted">(optional)</span>
                </label>
                <input id="phone" className="form-control" placeholder="+374 XX XX XX XX" autoComplete="tel" />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="email">Email address *</label>
                <input id="email" type="email" className="form-control" placeholder="you@example.com" autoComplete="email" />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="password">Password *</label>
                <input id="password" type="password" className="form-control" placeholder="At least 6 characters" autoComplete="new-password" />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="password2">Repeat password *</label>
                <input id="password2" type="password" className="form-control" placeholder="Type it again" autoComplete="new-password" />
              </div>
            </div>
            <div className="form-check my-4">
              <input className="form-check-input" type="checkbox" id="agree" />
              <label className="form-check-label" htmlFor="agree">
                I agree to the
                <a href="#">terms of service</a>
                and
                <a href="#">privacy policy</a>
                .
              </label>
            </div>
            <div className="d-grid gap-2">
              <button id="regBtn" className="btn btn-brand btn-lg">Create account</button>
              <Link className="btn btn-line" href="/login">I already have an account</Link>
            </div>
            <p className="muted mt-4 mb-0" style={{ "fontSize": ".84rem" }}>
              Demo build — accounts are stored in
              <code>localStorage</code>
              on this device only.
            </p>
          </div>
        </div>
        <div className="auth-art order-1 order-lg-2">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop" alt="Restaurant dining room" />
          <div className="auth-art-inner">
            <span className="eyebrow is-green">Members get more</span>
            <h2 className="display-md">Three reasons to sign up</h2>
            <ul className="list-unstyled mb-0" style={{ "color": "rgba(255,255,255,.82)" }}>
              <li className="d-flex align-items-center gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7"></path>
                </svg>
                First delivery free, no minimum
              </li>
              <li className="d-flex align-items-center gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7"></path>
                </svg>
                Saved addresses and one-tap reorder
              </li>
              <li className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L20 7"></path>
                </svg>
                Bonus points on every order
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
