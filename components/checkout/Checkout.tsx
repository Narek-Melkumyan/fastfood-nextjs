"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useCartStore,
} from "@/store/cartStore";

const pageStyles = `
  .summary-sticky{
    position:sticky;
    top:calc(var(--nav-h) + 16px);
  }

  .stepper{
    display:flex;
    align-items:center;
    gap:.75rem;
    flex-wrap:wrap;
  }

  .stepper .st{
    display:flex;
    align-items:center;
    gap:.55rem;
    font-size:.9rem;
    font-weight:600;
    color:var(--muted);
  }

  .stepper .st b{
    display:grid;
    place-items:center;
    width:26px;
    height:26px;
    border-radius:var(--pill);
    background:var(--surface-2);
    border:1px solid var(--line);
    font-size:.78rem;
  }

  .stepper .st.done{
    color:var(--accent);
  }

  .stepper .st.done b{
    background:var(--accent-tint);
    border-color:transparent;
    color:var(--accent);
  }

  .stepper .st.now{
    color:var(--ink);
  }

  .stepper .st.now b{
    background:var(--brand);
    border-color:transparent;
    color:#fff;
  }

  .stepper .sep{
    flex:1;
    min-width:20px;
    height:1px;
    background:var(--line);
  }

  .pay-option{
    display:flex;
    align-items:center;
    gap:.85rem;
    padding:1rem 1.15rem;
    border:1px solid var(--line);
    border-radius:var(--r-sm);
    cursor:pointer;
    transition:
      border-color .2s var(--ease),
      background .2s var(--ease);
  }

  .pay-option:hover{
    border-color:var(--line-strong);
  }

  .pay-option:has(input:checked){
    border-color:var(--brand);
    background:var(--brand-tint);
  }

  .pay-option.is-disabled{
    opacity:.55;
    cursor:not-allowed;
  }
`;

type Quote = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;

  promotionSavings: number;

  promotion: {
    id: number;
    code: string | null;
    title: string;
    type: string;
  } | null;
};

type SuccessOrder = {
  id: number;
  orderNumber: string;
  status: string;

  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

function money(
    value: number
) {
  return value.toLocaleString(
      "en-US"
  );
}

export default function Checkout() {
  const items =
      useCartStore(
          (state) =>
              state.items
      );

  const hasHydrated =
      useCartStore(
          (state) =>
              state.hasHydrated
      );

  const clearCart =
      useCartStore(
          (state) =>
              state.clearCart
      );

  const [fullName, setFullName] =
      useState("");

  const [phone, setPhone] =
      useState("");

  const [email, setEmail] =
      useState("");

  const [note, setNote] =
      useState("");

  const [city, setCity] =
      useState("Yerevan");

  const [district, setDistrict] =
      useState("");

  const [address, setAddress] =
      useState("");

  const [
    deliveryTime,
    setDeliveryTime,
  ] = useState(
      "As soon as possible"
  );

  const [promoInput, setPromoInput] =
      useState("");

  const [
    appliedPromo,
    setAppliedPromo,
  ] = useState("");

  const [quote, setQuote] =
      useState<Quote | null>(null);

  const [message, setMessage] =
      useState<{
        type:
            | "success"
            | "danger"
            | "secondary";

        text: string;
      } | null>(null);

  const [
    quoteLoading,
    setQuoteLoading,
  ] = useState(false);

  const [
    orderLoading,
    setOrderLoading,
  ] = useState(false);

  const [
    successOrder,
    setSuccessOrder,
  ] =
      useState<SuccessOrder | null>(
          null
      );

  /*
   * =====================================
   * SERVER QUOTE
   * =====================================
   */

  useEffect(() => {
    if (
        !hasHydrated ||
        items.length === 0
    ) {
      setQuote(null);

      return;
    }

    const controller =
        new AbortController();

    async function loadQuote() {
      try {
        setQuoteLoading(true);

        const response =
            await fetch(
                "/api/checkout/quote",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                        "application/json",
                  },

                  signal:
                  controller.signal,

                  body:
                      JSON.stringify({
                        items:
                            items.map(
                                (item) => ({
                                  id:
                                  item.id,

                                  quantity:
                                  item.quantity,
                                })
                            ),

                        promoCode:
                            appliedPromo ||
                            undefined,
                      }),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
          setQuote(null);

          setMessage({
            type: "danger",
            text:
                data.error ||
                "Unable to calculate order.",
          });

          return;
        }

        setQuote(data);
      } catch (error) {
        if (
            error instanceof
            DOMException &&
            error.name ===
            "AbortError"
        ) {
          return;
        }

        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }

    loadQuote();

    return () =>
        controller.abort();
  }, [
    hasHydrated,
    items,
    appliedPromo,
  ]);

  /*
   * =====================================
   * APPLY PROMO
   * =====================================
   */

  async function applyPromo() {
    const code =
        promoInput
            .trim()
            .toUpperCase();

    if (!code) {
      setAppliedPromo("");

      setMessage({
        type: "secondary",
        text:
            "Promo code removed.",
      });

      return;
    }

    try {
      setQuoteLoading(true);

      const response =
          await fetch(
              "/api/checkout/quote",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                      "application/json",
                },

                body:
                    JSON.stringify({
                      items:
                          items.map(
                              (item) => ({
                                id:
                                item.id,

                                quantity:
                                item.quantity,
                              })
                          ),

                      promoCode:
                      code,

                      customerPhone:
                      phone,

                      customerEmail:
                      email,
                    }),
              }
          );

      const data =
          await response.json();

      if (!response.ok) {
        setMessage({
          type: "danger",

          text:
              data.error ||
              "Invalid promo code.",
        });

        return;
      }

      setAppliedPromo(code);

      setQuote(data);

      setMessage({
        type: "success",

        text:
            data.promotion
                ? `${data.promotion.code} applied successfully.`
                : "Promotion applied.",
      });
    } catch {
      setMessage({
        type: "danger",

        text:
            "Unable to apply promo code.",
      });
    } finally {
      setQuoteLoading(false);
    }
  }

  /*
   * =====================================
   * PLACE ORDER
   * =====================================
   */

  async function placeOrder() {
    setMessage(null);

    if (
        items.length === 0
    ) {
      setMessage({
        type: "danger",
        text:
            "Your basket is empty.",
      });

      return;
    }

    if (
        !fullName.trim() ||
        !phone.trim() ||
        !address.trim()
    ) {
      setMessage({
        type: "danger",

        text:
            "Please fill in your name, phone and address.",
      });

      return;
    }

    try {
      setOrderLoading(true);

      const response =
          await fetch(
              "/api/orders",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                      "application/json",
                },

                body:
                    JSON.stringify({
                      customerName:
                      fullName,

                      customerPhone:
                      phone,

                      customerEmail:
                      email,

                      customerNote:
                      note,

                      deliveryCity:
                      city,

                      deliveryDistrict:
                      district,

                      deliveryAddress:
                      address,

                      deliveryTime,

                      paymentMethod:
                          "CASH",

                      promoCode:
                          appliedPromo ||
                          undefined,

                      items:
                          items.map(
                              (item) => ({
                                id:
                                item.id,

                                quantity:
                                item.quantity,
                              })
                          ),
                    }),
              }
          );

      const data =
          await response.json();

      if (!response.ok) {
        setMessage({
          type: "danger",

          text:
              data.error ||
              "Could not place your order.",
        });

        return;
      }

      setSuccessOrder(
          data.order
      );

      clearCart();

      setAppliedPromo("");

      setPromoInput("");
    } catch {
      setMessage({
        type: "danger",

        text:
            "Something went wrong while placing your order.",
      });
    } finally {
      setOrderLoading(false);
    }
  }

  /*
   * =====================================
   * SUCCESS
   * =====================================
   */

  if (successOrder) {
    return (
        <main>
          <style>
            {pageStyles}
          </style>

          <section className="section">
            <div className="container">
              <div
                  className="panel mx-auto"
                  style={{
                    maxWidth:
                        "700px",
                  }}
              >
                <div className="panel-body text-center py-5">
                  <div
                      style={{
                        fontSize:
                            "3rem",
                      }}
                  >
                    ✓
                  </div>

                  <span className="eyebrow is-green">
                  Order received
                </span>

                  <h1 className="display-md mt-2">
                    Thanks for your order
                  </h1>

                  <p className="muted">
                    Your order reference is
                  </p>

                  <h3>
                    {
                      successOrder.orderNumber
                    }
                  </h3>

                  <div className="summary-row total mt-4">
                  <span>
                    Total
                  </span>

                    <span className="money">
                    {money(
                        successOrder.total
                    )}
                      ֏
                  </span>
                  </div>

                  <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
                    <Link
                        href="/products"
                        className="btn btn-brand"
                    >
                      Continue browsing
                    </Link>

                    <Link
                        href="/profile"
                        className="btn btn-line"
                    >
                      My orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
    );
  }

  /*
   * =====================================
   * HYDRATION
   * =====================================
   */

  if (!hasHydrated) {
    return (
        <main>
          <section className="section">
            <div className="container">
              <div className="empty-state">
                Loading checkout...
              </div>
            </div>
          </section>
        </main>
    );
  }

  /*
   * =====================================
   * EMPTY CART
   * =====================================
   */

  if (items.length === 0) {
    return (
        <main>
          <section className="section">
            <div className="container">
              <div className="empty-state">
                <div className="ico">
                  🛍️
                </div>

                <h2>
                  Your basket is empty
                </h2>

                <p>
                  Add a dish before
                  checking out.
                </p>

                <Link
                    href="/products"
                    className="btn btn-brand"
                >
                  Browse menu
                </Link>
              </div>
            </div>
          </section>
        </main>
    );
  }

  return (
      <main>
        <style>
          {pageStyles}
        </style>

        {/* ===============================
          PAGE HEADER
      =============================== */}

        <section className="page-head">
          <div className="container">
            <nav
                className="breadcrumbs"
                aria-label="Breadcrumb"
            >
              <Link href="/">
                Home
              </Link>

              <span>/</span>

              <Link href="/products">
                Menu
              </Link>

              <span>/</span>

              <span>
              Checkout
            </span>
            </nav>

            <h1 className="display-lg">
              Checkout
            </h1>

            <p className="lead">
              Two minutes and
              you&apos;re done.
              Nothing is charged
              until the kitchen
              accepts your order.
            </p>

            <div className="stepper mt-4">
            <span className="st done">
              <b>✓</b>
              Basket
            </span>

              <span className="sep" />

              <span className="st now">
              <b>2</b>
              Delivery & payment
            </span>

              <span className="sep" />

              <span className="st">
              <b>3</b>
              Confirmation
            </span>
            </div>
          </div>
        </section>

        {/* ===============================
          CHECKOUT
      =============================== */}

        <section className="section">
          <div className="container">
            <div className="row g-4 g-xl-5">
              {/* LEFT */}

              <div className="col-12 col-lg-7">
                {/* CONTACT */}

                <div className="panel mb-4">
                  <div className="panel-head">
                    Contact details
                  </div>

                  <div className="panel-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          Full name *
                        </label>

                        <input
                            className="form-control"
                            placeholder="e.g. Daniel Hambardzumyan"
                            value={
                              fullName
                            }
                            onChange={(
                                event
                            ) =>
                                setFullName(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          Phone *
                        </label>

                        <input
                            className="form-control"
                            placeholder="+374 XX XX XX XX"
                            value={
                              phone
                            }
                            onChange={(
                                event
                            ) =>
                                setPhone(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Email{" "}
                          <span className="muted">
                          (optional)
                        </span>
                        </label>

                        <input
                            className="form-control"
                            type="email"
                            placeholder="you@example.com"
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
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Note for the
                          courier{" "}
                          <span className="muted">
                          (optional)
                        </span>
                        </label>

                        <textarea
                            className="form-control"
                            placeholder="Entrance code, floor, where to leave it…"
                            value={
                              note
                            }
                            onChange={(
                                event
                            ) =>
                                setNote(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DELIVERY */}

                <div className="panel mb-4">
                  <div className="panel-head">
                    Delivery details
                  </div>

                  <div className="panel-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          City
                        </label>

                        <select
                            className="form-select"
                            value={
                              city
                            }
                            onChange={(
                                event
                            ) =>
                                setCity(
                                    event
                                        .target
                                        .value
                                )
                            }
                        >
                          <option value="Yerevan">
                            Yerevan
                          </option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          District
                        </label>

                        <input
                            className="form-control"
                            placeholder="e.g. Kentron"
                            value={
                              district
                            }
                            onChange={(
                                event
                            ) =>
                                setDistrict(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">
                          Street, building,
                          apartment *
                        </label>

                        <input
                            className="form-control"
                            placeholder="e.g. Northern Ave 12, apt. 18"
                            value={
                              address
                            }
                            onChange={(
                                event
                            ) =>
                                setAddress(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          Delivery time
                        </label>

                        <select
                            className="form-select"
                            value={
                              deliveryTime
                            }
                            onChange={(
                                event
                            ) =>
                                setDeliveryTime(
                                    event
                                        .target
                                        .value
                                )
                            }
                        >
                          <option>
                            As soon as possible
                          </option>

                          <option>
                            Within 1 hour
                          </option>

                          <option>
                            This evening
                          </option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">
                          Delivery fee
                        </label>

                        <input
                            className="form-control"
                            disabled
                            value={
                              quote
                                  ? `${money(
                                      quote.deliveryFee
                                  )}֏`
                                  : "Calculating..."
                            }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT */}

                <div className="panel">
                  <div className="panel-head">
                    Payment method
                  </div>

                  <div className="panel-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="pay-option">
                          <input
                              className="form-check-input m-0"
                              type="radio"
                              checked
                              readOnly
                          />

                          <span>
                          <strong>
                            Cash
                          </strong>

                          <span className="d-block muted">
                            Pay the courier
                            on arrival
                          </span>
                        </span>
                        </label>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="pay-option is-disabled">
                          <input
                              className="form-check-input m-0"
                              type="radio"
                              disabled
                          />

                          <span>
                          <strong>
                            Card
                          </strong>

                          <span className="d-block muted">
                            Stripe will be
                            connected next
                          </span>
                        </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SUMMARY */}

              <div className="col-12 col-lg-5">
                <div className="summary-sticky">
                  <div className="panel">
                    <div className="panel-head">
                      Order summary
                    </div>

                    <div className="panel-body">
                      {message && (
                          <div
                              className={`alert alert-${message.type} mb-3`}
                          >
                            {
                              message.text
                            }
                          </div>
                      )}

                      <div className="d-grid gap-2 mb-4">
                        {items.map(
                            (item) => (
                                <div
                                    key={
                                      item.id
                                    }
                                    className="cart-row d-flex justify-content-between align-items-start gap-2"
                                >
                                  <div>
                                    <p className="t">
                                      {
                                        item.name
                                      }
                                    </p>

                                    <div className="muted">
                                <span className="qty-pill">
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </span>

                                      <span className="ms-2">
                                  {money(
                                      item.price
                                  )}
                                        ֏ each
                                </span>
                                    </div>
                                  </div>

                                  <div className="money">
                                    {money(
                                        item.price *
                                        item.quantity
                                    )}
                                    ֏
                                  </div>
                                </div>
                            )
                        )}
                      </div>

                      <div className="summary-row">
                      <span>
                        Subtotal
                      </span>

                        <span className="money">
                        {quoteLoading &&
                        !quote
                            ? "..."
                            : `${money(
                                quote
                                    ?.subtotal ||
                                0
                            )}֏`}
                      </span>
                      </div>

                      <div className="summary-row">
                      <span>
                        Delivery
                      </span>

                        <span className="money">
                        {quote
                            ? `${money(
                                quote.deliveryFee
                            )}֏`
                            : "..."}
                      </span>
                      </div>

                      <div className="summary-row">
                      <span>
                        Discount
                      </span>

                        <span className="money ok">
                        -
                          {money(
                              quote
                                  ?.discount ||
                              0
                          )}
                          ֏
                      </span>
                      </div>

                      <div className="summary-row total">
                      <span>
                        Total
                      </span>

                        <span className="money danger">
                        {quote
                            ? `${money(
                                quote.total
                            )}֏`
                            : "..."}
                      </span>
                      </div>

                      {/* PROMO */}

                      <div className="mt-4">
                        <label className="form-label">
                          Promo code
                        </label>

                        <div className="d-flex gap-2">
                          <input
                              className="form-control"
                              placeholder="e.g. SAVE10"
                              value={
                                promoInput
                              }
                              onChange={(
                                  event
                              ) =>
                                  setPromoInput(
                                      event
                                          .target
                                          .value
                                  )
                              }
                              onKeyDown={(
                                  event
                              ) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                  event.preventDefault();

                                  applyPromo();
                                }
                              }}
                          />

                          <button
                              className="btn btn-line"
                              type="button"
                              disabled={
                                quoteLoading
                              }
                              onClick={
                                applyPromo
                              }
                          >
                            Apply
                          </button>
                        </div>

                        <p className="muted mt-2 mb-0">
                          Try{" "}
                          <b>
                            SAVE10
                          </b>{" "}
                          or{" "}
                          <b>
                            FREEDEL
                          </b>
                          .
                        </p>
                      </div>

                      <button
                          type="button"
                          className="btn btn-brand w-100 mt-4"
                          disabled={
                              orderLoading ||
                              quoteLoading ||
                              !quote
                          }
                          onClick={
                            placeOrder
                          }
                      >
                        {orderLoading
                            ? "Placing order..."
                            : quote
                                ? `Place order · ${money(
                                    quote.total
                                )}֏`
                                : "Place order"}
                      </button>

                      <p className="muted text-center mt-3 mb-0">
                        Prices and product
                        availability are
                        checked again on the
                        server before the
                        order is created.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}