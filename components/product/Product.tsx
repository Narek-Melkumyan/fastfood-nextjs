"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useCartStore,
} from "@/store/cartStore";

const pageStyles = `
  .buy-sticky{
    position:sticky;
    top:calc(var(--nav-h) + 16px);
  }

  .price-xl{
    font-family:var(--font-display);
    font-size:2.5rem;
    font-weight:800;
    letter-spacing:-.04em;
    color:var(--ink);
  }

  .product-main-image{
    width:100%;
    height:auto;
    aspect-ratio:4/3;
    object-fit:cover;
    border-radius:var(--r);
  }

  .product-description{
    white-space:pre-line;
  }
`;

export type ProductData = {
  id: number;

  name: string;
  slug: string;

  description:
      | string
      | null;

  price: number;
  currency: string;

  imageUrl:
      | string
      | null;

  ingredients: string[];
  allergens: string[];

  badge:
      | string
      | null;

  ratingAverage: number;
  reviewCount: number;

  isAvailable: boolean;

  category: {
    id: number;
    name: string;
    slug: string;
  };

  restaurant: {
    id: number;

    name: string;
    slug: string;

    address: string;
    city: string;

    logoUrl:
        | string
        | null;

    deliveryMinMinutes: number;
    deliveryMaxMinutes: number;

    deliveryFee: number;
    minimumOrder: number;

    isAcceptingOrders: boolean;
  };
};

type Props = {
  product: ProductData;

  relatedProducts?:
      ProductData[];
};

function money(
    value: number
) {
  return value.toLocaleString(
      "en-US"
  );
}

export default function Product({
                                  product,
                                  relatedProducts = [],
                                }: Props) {
  /*
   * =====================================
   * CART
   * =====================================
   */

  const items =
      useCartStore(
          (state) =>
              state.items
      );

  const addItem =
      useCartStore(
          (state) =>
              state.addItem
      );

  const clearCart =
      useCartStore(
          (state) =>
              state.clearCart
      );

  const hasHydrated =
      useCartStore(
          (state) =>
              state.hasHydrated
      );

  /*
   * =====================================
   * QUANTITY
   * =====================================
   */

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    added,
    setAdded,
  ] = useState(false);

  /*
   * =====================================
   * CART TOTAL
   * =====================================
   */

  const cartTotal =
      useMemo(
          () =>
              items.reduce(
                  (
                      total,
                      item
                  ) =>
                      total +
                      item.price *
                      item.quantity,
                  0
              ),
          [
            items,
          ]
      );

  const lineTotal =
      product.price *
      quantity;

  /*
   * =====================================
   * AVAILABILITY
   * =====================================
   */

  const canOrder =
      product.isAvailable &&
      product.restaurant
          .isAcceptingOrders;

  /*
   * =====================================
   * ADD PRODUCT
   * =====================================
   */

  function addToBasket() {
    if (!canOrder) {
      return;
    }

    /*
     * Your current addItem() API adds
     * one item at a time.
     *
     * Calling it quantity times means
     * selecting 3 adds quantity 3.
     */

    for (
        let index = 0;
        index < quantity;
        index++
    ) {
      addItem({
        id:
        product.id,

        slug:
        product.slug,

        name:
        product.name,

        price:
        product.price,

        imageUrl:
        product.imageUrl,

        restaurantId:
        product.restaurant.id,

        restaurantName:
        product.restaurant.name,
      });
    }

    setAdded(
        true
    );

    window.setTimeout(
        () => {
          setAdded(
              false
          );
        },
        1200
    );
  }

  /*
   * =====================================
   * IMAGE
   * =====================================
   */

  const productImage =
      product.imageUrl ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop";

  return (
      <main>

        <style>
          {pageStyles}
        </style>

        {/* =================================
          PRODUCT
      ================================= */}

        <section className="section">

          <div className="container">

            {/* BREADCRUMBS */}

            <nav
                className="breadcrumbs"
                aria-label="Breadcrumb"
            >

              <Link href="/">
                Home
              </Link>

              <span>
              /
            </span>

              <Link href="/products">
                Menu
              </Link>

              <span>
              /
            </span>

              <span>
              {
                product.name
              }
            </span>

            </nav>

            <div className="row g-4 g-xl-5">

              {/* ============================
                LEFT
            ============================ */}

              <div className="col-12 col-lg-7">

                {/* IMAGE */}

                <div className="gallery-main">

                  <img
                      className="product-main-image"
                      src={
                        productImage
                      }
                      alt={
                        product.name
                      }
                  />

                </div>

                {/* INFO */}

                <div className="row g-3 mt-1">

                  {/* KITCHEN */}

                  <div className="col-4">

                    <div className="stat-mini text-center">

                      <div className="k">
                        Kitchen
                      </div>

                      <div
                          className="v"
                          style={{
                            fontSize:
                                "1.05rem",
                          }}
                      >
                        {
                          product
                              .restaurant
                              .name
                        }
                      </div>

                    </div>

                  </div>

                  {/* DELIVERY */}

                  <div className="col-4">

                    <div className="stat-mini text-center">

                      <div className="k">
                        Delivery
                      </div>

                      <div
                          className="v"
                          style={{
                            fontSize:
                                "1.05rem",
                          }}
                      >
                        {
                          product
                              .restaurant
                              .deliveryMinMinutes
                        }
                        –
                        {
                          product
                              .restaurant
                              .deliveryMaxMinutes
                        }{" "}
                        min
                      </div>

                    </div>

                  </div>

                  {/* REVIEWS */}

                  <div className="col-4">

                    <div className="stat-mini text-center">

                      <div className="k">
                        Reviews
                      </div>

                      <div
                          className="v"
                          style={{
                            fontSize:
                                "1.05rem",
                          }}
                      >
                        {
                          product.reviewCount
                        }
                      </div>

                    </div>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="panel mt-4">

                  <div className="panel-head">
                    About this dish
                  </div>

                  <div className="panel-body">

                    <p className="product-description mb-4">

                      {
                          product.description ||
                          "No description available."
                      }

                    </p>

                    {/* INGREDIENTS */}

                    {product.ingredients
                            .length >
                        0 && (
                            <>

                              <h3 className="h6 mb-3">
                                Ingredients
                              </h3>

                              <div className="d-flex flex-wrap gap-2 mb-4">

                                {product.ingredients.map(
                                    (
                                        ingredient
                                    ) => (

                                        <span
                                            key={
                                              ingredient
                                            }
                                            className="badge-soft"
                                        >
                              {
                                ingredient
                              }
                            </span>

                                    )
                                )}

                              </div>

                            </>
                        )}

                    {/* ALLERGENS */}

                    {product.allergens
                            .length >
                        0 && (
                            <>

                              <h3 className="h6 mb-3">
                                Allergens
                              </h3>

                              <div className="d-flex flex-wrap gap-2">

                                {product.allergens.map(
                                    (
                                        allergen
                                    ) => (

                                        <span
                                            key={
                                              allergen
                                            }
                                            className="badge-soft"
                                        >
                              {
                                allergen
                              }
                            </span>

                                    )
                                )}

                              </div>

                            </>
                        )}

                  </div>

                </div>

                {/* RESTAURANT */}

                <div className="panel mt-4">

                  <div className="panel-head">
                    Restaurant
                  </div>

                  <div className="panel-body">

                    <div className="d-flex align-items-center gap-3">

                      {product.restaurant
                          .logoUrl && (

                          <img
                              src={
                                product
                                    .restaurant
                                    .logoUrl
                              }
                              alt={
                                product
                                    .restaurant
                                    .name
                              }
                              style={{
                                width:
                                    "60px",

                                height:
                                    "60px",

                                borderRadius:
                                    "15px",

                                objectFit:
                                    "cover",
                              }}
                          />

                      )}

                      <div>

                        <h3 className="h5 mb-1">
                          {
                            product
                                .restaurant
                                .name
                          }
                        </h3>

                        <p className="muted mb-2">
                          {
                            product
                                .restaurant
                                .address
                          }
                          ,{" "}
                          {
                            product
                                .restaurant
                                .city
                          }
                        </p>

                        <Link
                            href={`/restaurants/${product.restaurant.slug}`}
                            className="fw-bold"
                        >
                          View restaurant
                        </Link>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* ============================
                RIGHT
            ============================ */}

              <div className="col-12 col-lg-5">

                <div className="buy-sticky">

                  {/* ========================
                    BUY
                ======================== */}

                  <div className="panel">

                    <div className="panel-body">

                      {/* BADGES */}

                      <div className="d-flex flex-wrap gap-2 mb-3">

                      <span className="badge-soft is-brand">
                        {
                          product
                              .category
                              .name
                        }
                      </span>

                        <span className="badge-soft">
                        {
                          product
                              .restaurant
                              .deliveryMinMinutes
                        }
                          –
                          {
                            product
                                .restaurant
                                .deliveryMaxMinutes
                          }{" "}
                          min
                      </span>

                        {product.badge && (

                            <span className="badge-soft is-green">
                          {
                            product.badge
                          }
                        </span>

                        )}

                      </div>

                      {/* TITLE */}

                      <h1 className="display-md mb-2">
                        {
                          product.name
                        }
                      </h1>

                      {/* RATING */}

                      <div className="d-flex align-items-center gap-2 mb-4">

                      <span className="stars">
                        ⭐
                      </span>

                        <span className="fw-bold">
                        {product
                            .ratingAverage
                            .toFixed(
                                1
                            )}
                      </span>

                        <span
                            className="muted"
                            style={{
                              fontSize:
                                  ".88rem",
                            }}
                        >
                        {
                          product.reviewCount
                        }{" "}
                          reviews
                      </span>

                      </div>

                      {/* PRICE */}

                      <div className="price-xl mb-1">

                        {money(
                            product.price
                        )}
                        ֏

                      </div>

                      <p
                          className="muted"
                          style={{
                            fontSize:
                                ".88rem",
                          }}
                      >
                        Price includes VAT.
                        Delivery is calculated
                        at checkout.
                      </p>

                      <hr />

                      {/* QUANTITY */}

                      <div className="d-flex align-items-center justify-content-between gap-3 mb-4">

                        <div className="qty">

                          <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                  setQuantity(
                                      (
                                          current
                                      ) =>
                                          Math.max(
                                              1,
                                              current -
                                              1
                                          )
                                  )
                              }
                          >
                            −
                          </button>

                          <span>
                          {
                            quantity
                          }
                        </span>

                          <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                  setQuantity(
                                      (
                                          current
                                      ) =>
                                          current +
                                          1
                                  )
                              }
                          >
                            +
                          </button>

                        </div>

                        <div className="text-end">

                          <div
                              className="muted"
                              style={{
                                fontSize:
                                    ".82rem",
                              }}
                          >
                            Line total
                          </div>

                          <div
                              className="money"
                              style={{
                                fontSize:
                                    "1.35rem",
                              }}
                          >
                            {money(
                                lineTotal
                            )}
                            ֏
                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="d-grid gap-2">

                        <button
                            className="btn btn-brand btn-lg"
                            type="button"
                            disabled={
                              !canOrder
                            }
                            onClick={
                              addToBasket
                            }
                        >

                          {!product
                              .isAvailable
                              ? "Unavailable"
                              : !product
                                  .restaurant
                                  .isAcceptingOrders
                                  ? "Restaurant closed"
                                  : added
                                      ? "Added to basket ✓"
                                      : `Add ${quantity} to basket`}

                        </button>

                        <Link
                            className="btn btn-line"
                            href="/checkout"
                        >
                          Go to checkout
                        </Link>

                      </div>

                    </div>

                    {/* DELIVERY INFO */}

                    <div className="panel-foot">

                      <div className="d-flex align-items-center gap-3">

                      <span
                          style={{
                            width:
                                "40px",

                            height:
                                "40px",

                            borderRadius:
                                "12px",

                            background:
                                "var(--accent-tint)",

                            color:
                                "var(--accent)",

                            display:
                                "grid",

                            placeItems:
                                "center",

                            flex:
                                "0 0 auto",
                          }}
                      >
                        <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                          <path d="M3 7h11v9H3z" />

                          <path d="M14 10h3.5L21 13v3h-7z" />

                          <circle
                              cx="7"
                              cy="18"
                              r="1.8"
                          />

                          <circle
                              cx="17.5"
                              cy="18"
                              r="1.8"
                          />
                        </svg>
                      </span>

                        <div
                            className="muted"
                            style={{
                              fontSize:
                                  ".88rem",
                            }}
                        >

                          Delivery fee:{" "}

                          <b>
                            {product
                                .restaurant
                                .deliveryFee ===
                            0
                                ? "Free"
                                : `${money(
                                    product
                                        .restaurant
                                        .deliveryFee
                                )}֏`}
                          </b>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* ========================
                    BASKET
                ======================== */}

                  <div className="panel mt-4">

                    <div className="panel-head d-flex justify-content-between align-items-center">

                    <span>
                      Your basket
                    </span>

                      {items.length >
                          0 && (

                              <button
                                  className="btn btn-ghost btn-sm"
                                  type="button"
                                  onClick={
                                    clearCart
                                  }
                              >
                                Clear
                              </button>

                          )}

                    </div>

                    <div className="panel-body">

                      {!hasHydrated ? (

                          <div className="muted">
                            Loading basket...
                          </div>

                      ) : items.length ===
                      0 ? (

                          <div className="empty-state">

                            <div className="ico">
                              🛍️
                            </div>

                            <p className="mb-0">
                              Your basket is empty.
                            </p>

                          </div>

                      ) : (

                          <div className="d-grid gap-3">

                            {items.map(
                                (
                                    item
                                ) => (

                                    <div
                                        key={
                                          item.id
                                        }
                                        className="cart-row d-flex justify-content-between gap-3"
                                    >

                                      <div>

                                        <p className="t mb-1">
                                          {
                                            item.name
                                          }
                                        </p>

                                        <span className="muted">
                                  {money(
                                      item.price
                                  )}
                                          ֏ ×{" "}
                                          {
                                            item.quantity
                                          }
                                </span>

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

                      )}

                    </div>

                    <div className="panel-foot">

                      <div className="summary-row total">

                      <span>
                        Total
                      </span>

                        <span className="money">
                        {money(
                            cartTotal
                        )}
                          ֏
                      </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================
          RELATED PRODUCTS
      ================================= */}

        {relatedProducts.length >
            0 && (

                <section className="section section-tint">

                  <div className="container">

                    <div className="section-head">

                      <div>

                <span className="eyebrow">
                  Goes well with
                </span>

                        <h2 className="display-md">
                          People also ordered
                        </h2>

                        <p>
                          More dishes you may
                          like.
                        </p>

                      </div>

                      <Link
                          className="btn btn-line"
                          href="/products"
                      >
                        Browse the menu
                      </Link>

                    </div>

                    <div className="row g-4">

                      {relatedProducts
                          .slice(
                              0,
                              3
                          )
                          .map(
                              (
                                  related
                              ) => (

                                  <div
                                      key={
                                        related.id
                                      }
                                      className="col-12 col-md-6 col-xl-4"
                                  >

                                    <Link
                                        href={`/products/${related.slug}`}
                                        className="tile h-100"
                                        style={{
                                          textDecoration:
                                              "none",
                                        }}
                                    >

                                      <div
                                          className="tile-media"
                                          style={{
                                            aspectRatio:
                                                "16/10",
                                          }}
                                      >

                                        <img
                                            alt={
                                              related.name
                                            }
                                            src={
                                                related.imageUrl ||
                                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
                                            }
                                        />

                                      </div>

                                      <div className="tile-body">

                                        <h3 className="tile-title">
                                          {
                                            related.name
                                          }
                                        </h3>

                                        <p className="tile-meta">

                                          {
                                            related
                                                .restaurant
                                                .name
                                          }

                                          {" · "}

                                          {
                                            related
                                                .restaurant
                                                .deliveryMinMinutes
                                          }
                                          –
                                          {
                                            related
                                                .restaurant
                                                .deliveryMaxMinutes
                                          }{" "}
                                          min

                                        </p>

                                        <div className="d-flex justify-content-between align-items-center mt-auto">

                            <span className="rating">
                              ⭐{" "}
                              {related
                                  .ratingAverage
                                  .toFixed(
                                      1
                                  )}
                            </span>

                                          <span className="price">
                              {money(
                                  related.price
                              )}
                                            ֏
                            </span>

                                        </div>

                                      </div>

                                    </Link>

                                  </div>

                              )
                          )}

                    </div>

                  </div>

                </section>

            )}

      </main>
  );
}
