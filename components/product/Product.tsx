"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { readStorage, writeStorage, type CartItem } from "../shared/storage";
import { createEffects, requireElement } from "../shared/dom";

const pageStyles = `

        .buy-sticky{ position:sticky; top:calc(var(--nav-h) + 16px); }
        .price-xl{ font-family:var(--font-display); font-size:2.5rem; font-weight:800; letter-spacing:-.04em; color:var(--ink); }
    
`;

export default function Product() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    if (!mountedRoot)
      return;
    const root = mountedRoot;
    const effects = createEffects();
    // ===== Demo dishes =====
    const PRODUCTS = [
      {
        id: "p1", title: "Margherita", category: "Pizza", time: "25–35 min", rating: 4.7, votes: 98, price: 2400,
        desc: "The classic: fior di latte, San Marzano tomato and basil picked the same morning. Light, fast, and the single most ordered dish on Foodly.",
        img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "p2", title: "Pepperoni", category: "Pizza", time: "25–35 min", rating: 4.5, votes: 76, price: 2900,
        desc: "Spicy pepperoni, mozzarella and a slow-cooked tomato base. A louder, richer take on the classic.",
        img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "p3", title: "Carbonara", category: "Pasta", time: "30–40 min", rating: 4.6, votes: 64, price: 2600,
        desc: "Guanciale, egg yolk, pecorino romano and cracked black pepper. No cream — the sauce is emulsified to order.",
        img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: "p4", title: "Caesar salad", category: "Salads", time: "20–30 min", rating: 4.3, votes: 52, price: 1900,
        desc: "Grilled chicken, romaine, sourdough croutons and a proper anchovy caesar dressing. The light option that still fills you up.",
        img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop"
      },
    ];
    // ===== Basket (localStorage) =====
    const LS_KEY = "food_cart_v1";
    const $cartList = requireElement(root, "#cartList", HTMLElement);
    const $cartTotal = requireElement(root, "#cartTotal", HTMLElement);
    const $clearCartBtn = requireElement(root, "#clearCartBtn", HTMLButtonElement);
    function readCart() { return readStorage(LS_KEY, []); }
    function writeCart(items: CartItem[]) { writeStorage(LS_KEY, items); }
    function money(n: number) { return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function starsFromRating(r: number) {
      const full = (r >= 4.5) ? 5 : (r >= 4.0 ? 4 : 3);
      return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
    }
    function renderCart() {
      const cart = readCart();
      const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
      $cartTotal.textContent = money(total) + "֏";
      if (cart.length === 0) {
        $cartList.innerHTML = `
              <div class="empty-state">
                <div class="ico">🛍️</div>
                <p class="mb-0">Your basket is empty.</p>
              </div>`;
        return;
      }
      $cartList.innerHTML = cart.map(i => `
            <div class="cart-item">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <p class="t">${i.title}</p>
                  <div class="muted" style="font-size:.85rem">${money(i.price)}֏ × ${i.qty} = <b>${money(i.price * i.qty)}֏</b></div>
                </div>
                <div class="qty">
                  <button type="button" data-dec="${i.id}" aria-label="Remove one">−</button>
                  <span>${i.qty}</span>
                  <button type="button" data-inc="${i.id}" aria-label="Add one">+</button>
                </div>
              </div>
            </div>
          `).join("");
    }
    function changeQty(productId: string, delta: number) {
      const cart = readCart();
      const item = cart.find(i => i.id === productId);
      if (!item)
        return;
      item.qty += delta;
      writeCart(cart.filter(i => i.qty > 0));
      renderCart();
    }
    function clearCart() { writeCart([]); renderCart(); }
    effects.listen(root, "click", (e) => {
      const incId = (e.target instanceof Element ? e.target.closest<HTMLElement>("[data-add], [data-inc], [data-dec]") : null)?.dataset?.inc;
      const decId = (e.target instanceof Element ? e.target.closest<HTMLElement>("[data-add], [data-inc], [data-dec]") : null)?.dataset?.dec;
      if (incId)
        changeQty(incId, +1);
      if (decId)
        changeQty(decId, -1);
    });
    effects.listen($clearCartBtn, "click", clearCart);
    // ===== Dish details =====
    const $img = requireElement(root, "#prodImg", HTMLImageElement);
    const $title = requireElement(root, "#prodTitle", HTMLElement);
    const $crumb = requireElement(root, "#prodCrumb", HTMLElement);
    const $cat = requireElement(root, "#prodCategory", HTMLElement);
    const $time = requireElement(root, "#prodTime", HTMLElement);
    const $stars = requireElement(root, "#prodStars", HTMLElement);
    const $ratingText = requireElement(root, "#prodRatingText", HTMLElement);
    const $price = requireElement(root, "#prodPrice", HTMLElement);
    const $desc = requireElement(root, "#prodDesc", HTMLElement);
    const $qtyVal = requireElement(root, "#qtyVal", HTMLElement);
    const $lineTotal = requireElement(root, "#lineTotal", HTMLElement);
    const $incBtn = requireElement(root, "#incBtn", HTMLButtonElement);
    const $decBtn = requireElement(root, "#decBtn", HTMLButtonElement);
    const $addBtn = requireElement(root, "#addBtn", HTMLButtonElement);
    function getProductIdFromUrl() {
      const params = new URLSearchParams(location.search);
      return params.get("id") || "p1";
    }
    let selected = PRODUCTS[0];
    let qty = 1;
    function renderProduct() {
      const id = getProductIdFromUrl();
      selected = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
      document.title = selected.title + " — Foodly";
      $img.src = selected.img;
      $img.alt = selected.title;
      $title.textContent = selected.title;
      $crumb.textContent = selected.title;
      $cat.textContent = selected.category;
      $time.textContent = selected.time;
      $stars.textContent = starsFromRating(selected.rating);
      $ratingText.textContent = `${selected.rating.toFixed(1)} · ${selected.votes} reviews`;
      $price.textContent = money(selected.price) + "֏";
      $desc.textContent = selected.desc;
      qty = 1;
      $qtyVal.textContent = String(qty);
      $lineTotal.textContent = money(selected.price * qty) + "֏";
      renderRelated();
    }
    function setQty(next: number) {
      qty = Math.max(1, next);
      $qtyVal.textContent = String(qty);
      $lineTotal.textContent = money(selected.price * qty) + "֏";
    }
    effects.listen($incBtn, "click", () => setQty(qty + 1));
    effects.listen($decBtn, "click", () => setQty(qty - 1));
    function addToCart(product: (typeof PRODUCTS)[number], qtyToAdd: number) {
      const cart = readCart();
      const found = cart.find(i => i.id === product.id);
      if (found)
        found.qty += qtyToAdd;
      else
        cart.push({ id: product.id, title: product.title, price: product.price, qty: qtyToAdd });
      writeCart(cart);
      renderCart();
    }
    effects.listen($addBtn, "click", () => {
      if (!selected)
        return;
      addToCart(selected, qty);
    });
    // ===== Related =====
    const $related = requireElement(root, "#relatedGrid", HTMLElement);
    function renderRelated() {
      const list = PRODUCTS.filter(p => p.id !== selected.id).slice(0, 3);
      $related.innerHTML = list.map(p => `
            <div class="col-12 col-md-6 col-xl-4">
              <a class="tile h-100" href="?id=${encodeURIComponent(p.id)}" style="text-decoration:none">
                <div class="tile-media" style="aspect-ratio:16/10">
                  <img alt="${p.title}" src="${p.img}">
                </div>
                <div class="tile-body">
                  <h3 class="tile-title">${p.title}</h3>
                  <p class="tile-meta">${p.category} · ${p.time}</p>
                  <div class="d-flex justify-content-between align-items-center mt-auto">
                    <span class="stars">${starsFromRating(p.rating)}</span>
                    <span class="price">${money(p.price)}֏</span>
                  </div>
                </div>
              </a>
            </div>
          `).join("");
    }
    // init
    renderProduct();
    renderCart();
    return effects.cleanup;
  }, []);

  return (
    <div ref={rootRef}>
      <style>{pageStyles}</style>
      <section className="section">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/products">Menu</Link>
            <span>/</span>
            <span id="prodCrumb">Dish</span>
          </nav>
          <div className="row g-4 g-xl-5">
            <div className="col-12 col-lg-7">
              <div className="gallery-main"><img id="prodImg" alt="Dish" /></div>
              <div className="row g-3 mt-1">
                <div className="col-4">
                  <div className="stat-mini text-center">
                    <div className="k">Kitchen</div>
                    <div className="v" style={{ "fontSize": "1.05rem" }}>La Pasta</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-mini text-center">
                    <div className="k">Portion</div>
                    <div className="v" style={{ "fontSize": "1.05rem" }}>450 g</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-mini text-center">
                    <div className="k">Energy</div>
                    <div className="v" style={{ "fontSize": "1.05rem" }}>680 kcal</div>
                  </div>
                </div>
              </div>
              <div className="panel mt-4">
                <div className="panel-head">What&apos;s in it</div>
                <div className="panel-body">
                  <p id="prodDesc" className="mb-3"></p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge-soft">Freshly made</span>
                    <span className="badge-soft">Contains gluten</span>
                    <span className="badge-soft">Contains dairy</span>
                    <span className="badge-soft is-green">Halal kitchen</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="buy-sticky">
                <div className="panel">
                  <div className="panel-body">
                    <div className="d-flex gap-2 mb-3">
                      <span className="badge-soft is-brand" id="prodCategory">Category</span>
                      <span className="badge-soft" id="prodTime">25–35 min</span>
                    </div>
                    <h1 className="display-md mb-2" id="prodTitle">Dish</h1>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <span className="stars" id="prodStars">★★★★★</span>
                      <span className="muted" style={{ "fontSize": ".88rem" }} id="prodRatingText">—</span>
                    </div>
                    <div className="price-xl mb-1" id="prodPrice">0֏</div>
                    <p className="muted" style={{ "fontSize": ".88rem" }}>Price includes VAT. Delivery calculated at checkout.</p>
                    <hr />
                    <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                      <div className="qty">
                        <button type="button" id="decBtn" aria-label="Decrease quantity">−</button>
                        <span id="qtyVal">1</span>
                        <button type="button" id="incBtn" aria-label="Increase quantity">+</button>
                      </div>
                      <div className="text-end">
                        <div className="muted" style={{ "fontSize": ".82rem" }}>Line total</div>
                        <div className="money" style={{ "fontSize": "1.35rem" }} id="lineTotal">0֏</div>
                      </div>
                    </div>
                    <div className="d-grid gap-2">
                      <button className="btn btn-brand btn-lg" id="addBtn">Add to basket</button>
                      <Link className="btn btn-line" href="/checkout">Go to checkout</Link>
                    </div>
                  </div>
                  <div className="panel-foot">
                    <div className="d-flex align-items-center gap-3">
                      <span style={{ "width": "40px", "height": "40px", "borderRadius": "12px", "background": "var(--accent-tint)", "color": "var(--accent)", "display": "grid", "placeItems": "center", "flex": "0 0 auto" }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7h11v9H3z"></path>
                          <path d="M14 10h3.5L21 13v3h-7z"></path>
                          <circle cx="7" cy="18" r="1.8"></circle>
                          <circle cx="17.5" cy="18" r="1.8"></circle>
                        </svg>
                      </span>
                      <div className="muted" style={{ "fontSize": ".88rem" }}>
                        Free delivery on baskets over
                        <b>8,000֏</b>
                        . Otherwise a flat 500֏.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="panel mt-4">
                  <div className="panel-head">
                    Your basket
                    <button className="btn btn-ghost btn-sm" type="button" id="clearCartBtn">Clear</button>
                  </div>
                  <div className="panel-body"><div className="d-grid gap-2" id="cartList"></div></div>
                  <div className="panel-foot">
                    <div className="summary-row total">
                      <span>Total</span>
                      <span className="money" id="cartTotal">0֏</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Goes well with</span>
              <h2 className="display-md">People also ordered</h2>
              <p>Based on what other customers added alongside this dish.</p>
            </div>
            <Link className="btn btn-line" href="/products">Browse the menu</Link>
          </div>
          <div className="row g-4" id="relatedGrid"></div>
        </div>
      </section>
    </div>
  );
}
