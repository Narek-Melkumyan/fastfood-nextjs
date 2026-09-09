"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { createEffects } from "../shared/dom";

const pageStyles = `

        .code-pill{
            display:inline-flex;
            align-items:center;
            gap:.6rem;
            padding:.5rem .5rem .5rem 1rem;
            border-radius:var(--pill);
            border:1px dashed var(--line-strong);
            background:var(--surface-2);
            font-family:var(--font-display);
            font-weight:800;
            letter-spacing:.06em;
            font-size:.9rem;
        }
        .code-pill button{
            border:0;
            border-radius:var(--pill);
            background:var(--ink);
            color:var(--bg);
            font-size:.76rem;
            font-weight:700;
            padding:.35rem .8rem;
            cursor:pointer;
            transition:background .2s var(--ease);
        }
        .code-pill button:hover{ background:var(--brand); color:#fff; }
        .offer-strip{
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:1rem;
        }
        @media (max-width:767.98px){ .offer-strip{ grid-template-columns:1fr; } }
    
`;

export default function Promotions() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    if (!mountedRoot)
      return;
    const root = mountedRoot;
    const effects = createEffects();
    // Copy promo codes to the clipboard
    effects.listen(root, "click", async (e) => {
      const btn = (e.target instanceof Element ? e.target.closest<HTMLElement>("[data-copy]") : null);
      if (!btn)
        return;
      const code = btn.dataset.copy;
      if (!code)
        return;
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = "Copied";
      }
      catch {
        btn.textContent = "Copy failed";
      }
      effects.delay(() => { btn.textContent = original; }, 1600);
    });
    return effects.cleanup;
  }, []);

  return (
    <div ref={rootRef}>
      <style>{pageStyles}</style>
      <section className="page-head">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Offers</span>
          </nav>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3">
            <div>
              <h1 className="display-lg">Live offers</h1>
              <p className="lead mb-0">
                12 deals running right now. Codes are copy-and-paste ready — no minimum spend unless it says so.
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="chip active" type="button">All</button>
              <button className="chip" type="button">Discount</button>
              <button className="chip" type="button">Combo</button>
              <button className="chip" type="button">Free delivery</button>
            </div>
          </div>
        </div>
      </section>
      <section className="section-sm">
        <div className="container">
          <div className="banner reveal">
            <div className="row g-0 align-items-stretch">
              <div className="col-12 col-lg-7">
                <div className="banner-inner">
                  <span className="eyebrow is-green">Offer of the week</span>
                  <h2 className="display-lg">Two large pizzas, one price</h2>
                  <p className="mb-4">
                    Any two large pizzas from Nolita or La Pasta for 4,600֏ — that&apos;s a 1,200֏ saving. Runs every day until 23:00, no code needed.
                  </p>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <Link className="btn btn-brand btn-lg" href="/products">Order now</Link>
                    <span className="badge-soft" style={{ "background": "rgba(255,255,255,.12)", "borderColor": "rgba(255,255,255,.25)", "color": "rgba(255,255,255,.82)" }}>Ends Sunday</span>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <div className="banner-media h-100">
                  <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop" alt="Two pizzas" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section-sm pt-0">
        <div className="container">
          <div className="offer-strip">
            <div className="card-soft d-flex align-items-center justify-content-between gap-3 reveal">
              <div>
                <strong style={{ "fontFamily": "var(--font-display)", "letterSpacing": "-.02em" }}>10% off everything</strong>
                <p className="muted mb-0" style={{ "fontSize": ".86rem" }}>Min. basket 3,000֏</p>
              </div>
              <span className="code-pill">
                SAVE10
                <button type="button" data-copy="SAVE10">Copy</button>
              </span>
            </div>
            <div className="card-soft d-flex align-items-center justify-content-between gap-3 reveal">
              <div>
                <strong style={{ "fontFamily": "var(--font-display)", "letterSpacing": "-.02em" }}>Free delivery</strong>
                <p className="muted mb-0" style={{ "fontSize": ".86rem" }}>Any basket, any kitchen</p>
              </div>
              <span className="code-pill">
                FREEDEL
                <button type="button" data-copy="FREEDEL">Copy</button>
              </span>
            </div>
            <div className="card-soft d-flex align-items-center justify-content-between gap-3 reveal">
              <div>
                <strong style={{ "fontFamily": "var(--font-display)", "letterSpacing": "-.02em" }}>First order on us</strong>
                <p className="muted mb-0" style={{ "fontSize": ".86rem" }}>New accounts only</p>
              </div>
              <span className="code-pill">
                HELLO
                <button type="button" data-copy="HELLO">Copy</button>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section pt-0">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">All deals</span>
              <h2 className="display-md">Everything that&apos;s running</h2>
            </div>
            <select className="form-select" style={{ "width": "auto" }}>
              <option>Newest first</option>
              <option>Biggest discount</option>
              <option>Ending soon</option>
            </select>
          </div>
          <div className="row g-4">
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop" alt="Pizza offer" />
                  <span className="media-tag is-brand">−20%</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Pizza night, 20% off</h3>
                  <p className="tile-meta">Every large pizza at Nolita and La Pasta, Monday to Thursday after 18:00.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 31 Dec</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" alt="Burger combo" />
                  <span className="media-tag is-ink">Combo</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Burger + drink for 2,200֏</h3>
                  <p className="tile-meta">Any signature burger at Smash & Co. with a soft drink of your choice.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 31 Dec</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800&auto=format&fit=crop" alt="Pasta offer" />
                  <span className="media-tag is-green">Free delivery</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Pasta week, zero delivery fee</h3>
                  <p className="tile-meta">Order any two pasta dishes from La Pasta Yerevan and we cover the courier.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 07 Jan</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" alt="Salad offer" />
                  <span className="media-tag is-brand">−15%</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Lunch salads, 15% off</h3>
                  <p className="tile-meta">Weekdays between 12:00 and 15:00 at Green Bowl. Bowls and wraps included.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 31 Dec</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop" alt="Sushi offer" />
                  <span className="media-tag is-ink">Combo</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Sushi set + miso soup</h3>
                  <p className="tile-meta">The 24-piece chef&apos;s selection with two miso soups for 4,200֏ instead of 5,100֏.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 31 Jan</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4 reveal">
              <article className="tile">
                <div className="tile-media" style={{ "aspectRatio": "16/10" }}>
                  <img src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop" alt="Wrap offer" />
                  <span className="media-tag is-green">2 for 1</span>
                </div>
                <div className="tile-body">
                  <h3 className="tile-title">Two wraps, pay for one</h3>
                  <p className="tile-meta">Buy any chicken or beef wrap and the second one is on the house. Late nights only.</p>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="badge-soft">Until 05 Feb</span>
                    <Link className="btn btn-brand btn-sm" href="/products">Order</Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
          <nav className="mt-5" aria-label="Pagination">
            <ul className="pagination justify-content-center">
              <li className="page-item disabled">
                <a className="page-link" href="#">‹</a>
              </li>
              <li className="page-item active">
                <a className="page-link" href="#">1</a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">2</a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">›</a>
              </li>
            </ul>
          </nav>
        </div>
      </section>
      <section className="section section-tint">
        <div className="container">
          <div className="row g-4 g-lg-5 align-items-center">
            <div className="col-12 col-lg-5 reveal">
              <span className="eyebrow">Small print, plainly</span>
              <h2 className="display-md">How our promo codes work</h2>
              <p className="muted">
                No hidden thresholds, no expiry games. If a code cannot be applied, checkout tells you exactly why.
              </p>
              <Link className="btn btn-brand mt-2" href="/checkout">Go to checkout</Link>
            </div>
            <div className="col-12 col-lg-7 reveal">
              <details className="faq-item" open>
                <summary>Can I stack two codes?</summary>
                <div className="faq-body">
                  One code per order. Restaurant-level deals (like the two-pizza offer) apply automatically and do stack with a delivery code.
                </div>
              </details>
              <details className="faq-item">
                <summary>Where do I enter the code?</summary>
                <div className="faq-body">
                  On the checkout page, in the “Promo code” field of the order summary. The discount appears in the totals immediately.
                </div>
              </details>
              <details className="faq-item">
                <summary>Why was my code rejected?</summary>
                <div className="faq-body">
                  Usually the basket is below the minimum, the offer has ended, or the code is limited to first orders. Checkout shows the exact reason under the field.
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
