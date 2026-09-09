"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";

import { useCartStore } from "@/store/cartStore";

const pageStyles = `
  .resto-cover{
      position:relative;
      border-radius:var(--r-xl);
      overflow:hidden;
      min-height:360px;
      display:flex;
      align-items:flex-end;
      background:var(--ink-surface);
  }

  .resto-cover img{
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      object-fit:cover;
      opacity:.55;
  }

  .resto-cover-inner{
      position:relative;
      width:100%;
      padding:40px;
      background:linear-gradient(
        0deg,
        rgba(8,8,12,.92),
        rgba(8,8,12,.15)
      );
      color:#fff;
  }

  .resto-cover-inner h1{
      color:#fff;
  }

  .cover-chip{
      display:inline-flex;
      align-items:center;
      gap:.4rem;
      padding:.4rem .85rem;
      border-radius:var(--pill);
      border:1px solid rgba(255,255,255,.24);
      background:rgba(255,255,255,.13);
      backdrop-filter:blur(8px);
      color:#fff;
      font-size:.84rem;
      font-weight:600;
  }

  .rating-row{
      display:flex;
      align-items:center;
      gap:.75rem;
      margin-bottom:.5rem;
  }

  .rating-row .lbl{
      width:34px;
      font-size:.85rem;
      color:var(--muted);
      font-weight:700;
  }

  .rating-row .val{
      width:42px;
      text-align:right;
      font-size:.85rem;
      color:var(--muted);
  }

  .map-box{
      border-radius:var(--r);
      overflow:hidden;
      border:1px solid var(--line);
  }

  .map-box iframe{
      width:100%;
      height:320px;
      border:0;
      display:block;
  }

  .basket-sticky{
      position:sticky;
      top:calc(var(--nav-h) + 16px);
  }

  @media (max-width:575.98px){
      .resto-cover-inner{
          padding:24px;
      }
  }
`;

type RestaurantWithDetails =
    Prisma.RestaurantGetPayload<{
      include: {
        cuisines: true;

        hours: true;

        products: {
          include: {
            category: true;
          };
        };
      };
    }>;

type Props = {
  restaurant: RestaurantWithDetails;
};

function money(
    value: number
) {
  return value.toLocaleString(
      "en-US"
  );
}

export default function Restaurant({
                                     restaurant,
                                   }: Props) {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");

  /*
   * =========================================
   * ZUSTAND CART
   * =========================================
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

  const increaseQuantity =
      useCartStore(
          (state) =>
              state.increaseQuantity
      );

  const decreaseQuantity =
      useCartStore(
          (state) =>
              state.decreaseQuantity
      );

  const removeItem =
      useCartStore(
          (state) =>
              state.removeItem
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
   * =========================================
   * PRODUCT CATEGORIES
   * =========================================
   */

  const categories =
      useMemo(() => {
        const categoryMap =
            new Map<
                string,
                string
            >();

        restaurant.products.forEach(
            (product) => {
              categoryMap.set(
                  product.category
                      .slug,
                  product.category
                      .name
              );
            }
        );

        return Array.from(
            categoryMap.entries()
        ).map(
            ([slug, name]) => ({
              slug,
              name,
            })
        );
      }, [
        restaurant.products,
      ]);

  /*
   * =========================================
   * FILTER PRODUCTS
   * =========================================
   */

  const filteredProducts =
      useMemo(() => {
        if (
            selectedCategory ===
            "all"
        ) {
          return restaurant.products;
        }

        return restaurant.products.filter(
            (product) =>
                product.category
                    .slug ===
                selectedCategory
        );
      }, [
        restaurant.products,
        selectedCategory,
      ]);

  /*
   * =========================================
   * CART TOTAL
   * =========================================
   */

  const cartTotal =
      items.reduce(
          (
              total,
              item
          ) =>
              total +
              item.price *
              item.quantity,
          0
      );

  /*
   * Current restaurant subtotal.
   *
   * Important because cart can contain
   * products from multiple restaurants.
   */

  const restaurantSubtotal =
      items
          .filter(
              (item) =>
                  item.restaurantId ===
                  restaurant.id
          )
          .reduce(
              (
                  total,
                  item
              ) =>
                  total +
                  item.price *
                  item.quantity,
              0
          );

  /*
   * =========================================
   * RESTAURANT INFO
   * =========================================
   */

  const cuisines =
      restaurant.cuisines
          .map(
              (cuisine) =>
                  cuisine.name
          )
          .join(" · ");

  const addressText = [
    restaurant.address,
    restaurant.city,
  ]
      .filter(Boolean)
      .join(", ");

  const mapQuery =
      encodeURIComponent(
          addressText
      );

  const closingTime =
      restaurant.hours.find(
          (hour) =>
              !hour.isClosed &&
              hour.closesAt
      )?.closesAt;

  return (
      <div>
        <style>
          {pageStyles}
        </style>

        {/* =====================================
          HERO
      ===================================== */}

        <section className="section-sm pb-0">
          <div className="container">
            <nav
                className="breadcrumbs"
                aria-label="Breadcrumb"
            >
              <Link href="/">
                Home
              </Link>

              <span>/</span>

              <Link href="/restaurants">
                Restaurants
              </Link>

              <span>/</span>

              <span>
              {restaurant.name}
            </span>
            </nav>

            <div className="resto-cover">
              <img
                  src={
                      restaurant.coverImageUrl ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop"
                  }
                  alt={`${restaurant.name} dining room`}
              />

              <div className="resto-cover-inner">
                <div className="row align-items-end g-3">
                  <div className="col-12 col-lg-8">
                    <h1 className="display-lg mb-2">
                      {
                        restaurant.name
                      }
                    </h1>

                    <p
                        className="mb-3"
                        style={{
                          color:
                              "rgba(255,255,255,.8)",
                        }}
                    >
                      {cuisines}

                      {cuisines &&
                          addressText &&
                          " · "}

                      {addressText}
                    </p>

                    <div className="d-flex flex-wrap gap-2">
                    <span className="cover-chip">
                      <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                      >
                        <path
                            fill="#f5a524"
                            d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                        />
                      </svg>

                      {restaurant.ratingAverage.toFixed(
                          1
                      )}{" "}
                      ·{" "}
                      {
                        restaurant.reviewCount
                      }{" "}
                      reviews
                    </span>

                      <span className="cover-chip">
                      {restaurant.isAcceptingOrders
                          ? closingTime
                              ? `Open until ${closingTime}`
                              : "Open now"
                          : "Closed"}
                    </span>

                      <span className="cover-chip">
                      {
                        restaurant.deliveryMinMinutes
                      }
                        –
                        {
                          restaurant.deliveryMaxMinutes
                        }{" "}
                        min
                    </span>

                      <span className="cover-chip">
                      {restaurant.deliveryFee ===
                      0
                          ? "Free delivery"
                          : `Delivery from ${money(
                              restaurant.deliveryFee
                          )}֏`}
                    </span>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4 d-flex gap-2 justify-content-lg-end">
                    <a
                        className="btn btn-brand"
                        href="#menu"
                    >
                      See the menu
                    </a>

                    <a
                        className="btn btn-outline-light"
                        href="#reviews"
                    >
                      Reviews
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
          ABOUT + RATINGS
      ===================================== */}

        <section className="section-sm">
          <div className="container">
            <div className="row g-4">
              {/* ABOUT */}

              <div className="col-12 col-lg-7">
                <div className="panel h-100">
                  <div className="panel-head">
                    About the restaurant
                  </div>

                  <div className="panel-body">
                    <p>
                      {restaurant.description ||
                          `${restaurant.name} is available for delivery on Foodly.`}
                    </p>

                    <p className="muted mb-4">
                      Delivery runs{" "}
                      {
                        restaurant.deliveryMinMinutes
                      }
                      –
                      {
                        restaurant.deliveryMaxMinutes
                      }{" "}
                      minutes.

                      {restaurant.freeDeliveryFrom
                          ? ` Baskets over ${money(
                              restaurant.freeDeliveryFrom
                          )}֏ ship free; below that the fee is ${money(
                              restaurant.deliveryFee
                          )}֏.`
                          : restaurant.deliveryFee ===
                          0
                              ? " Delivery is free."
                              : ` Delivery fee is ${money(
                                  restaurant.deliveryFee
                              )}֏.`}
                    </p>

                    <div className="row g-3">
                      <div className="col-6 col-md-3">
                        <div className="stat-mini">
                          <div className="k">
                            Delivery
                          </div>

                          <div className="v">
                            {
                              restaurant.deliveryMinMinutes
                            }
                            –
                            {
                              restaurant.deliveryMaxMinutes
                            }
                            ′
                          </div>
                        </div>
                      </div>

                      <div className="col-6 col-md-3">
                        <div className="stat-mini">
                          <div className="k">
                            Min order
                          </div>

                          <div className="v">
                            {money(
                                restaurant.minimumOrder
                            )}
                            ֏
                          </div>
                        </div>
                      </div>

                      <div className="col-6 col-md-3">
                        <div className="stat-mini">
                          <div className="k">
                            Fee
                          </div>

                          <div className="v">
                            {restaurant.deliveryFee ===
                            0
                                ? "Free"
                                : `${money(
                                    restaurant.deliveryFee
                                )}֏`}
                          </div>
                        </div>
                      </div>

                      <div className="col-6 col-md-3">
                        <div className="stat-mini">
                          <div className="k">
                            Since
                          </div>

                          <div className="v">
                            {restaurant.foundedYear ||
                                "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RATINGS */}

              <div
                  className="col-12 col-lg-5"
                  id="reviews"
              >
                <div className="panel h-100">
                  <div className="panel-head">
                    Ratings
                  </div>

                  <div className="panel-body">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div>
                        <div
                            className="muted"
                            style={{
                              fontSize:
                                  ".85rem",
                            }}
                        >
                          Overall score
                        </div>

                        <div className="d-flex align-items-baseline gap-2">
                        <span
                            style={{
                              fontFamily:
                                  "var(--font-display)",
                              fontSize:
                                  "2.6rem",
                              fontWeight:
                                  "800",
                              letterSpacing:
                                  "-.04em",
                            }}
                        >
                          {restaurant.ratingAverage.toFixed(
                              1
                          )}
                        </span>

                          <span className="stars">
                          ★★★★★
                        </span>
                        </div>

                        <div
                            className="muted"
                            style={{
                              fontSize:
                                  ".85rem",
                            }}
                        >
                          {
                            restaurant.reviewCount
                          }{" "}
                          verified reviews
                        </div>
                      </div>

                      <button
                          className="btn btn-line btn-sm"
                          type="button"
                      >
                        Write a review
                      </button>
                    </div>

                    <div className="rating-row">
                    <span className="lbl">
                      5 ★
                    </span>

                      <div
                          className="progress flex-grow-1"
                          style={{
                            height: "8px",
                          }}
                      >
                        <div
                            className="progress-bar"
                            style={{
                              width: "78%",
                            }}
                        />
                      </div>

                      <span className="val">
                      78%
                    </span>
                    </div>

                    <div className="rating-row">
                    <span className="lbl">
                      4 ★
                    </span>

                      <div
                          className="progress flex-grow-1"
                          style={{
                            height: "8px",
                          }}
                      >
                        <div
                            className="progress-bar"
                            style={{
                              width: "14%",
                            }}
                        />
                      </div>

                      <span className="val">
                      14%
                    </span>
                    </div>

                    <div className="rating-row">
                    <span className="lbl">
                      3 ★
                    </span>

                      <div
                          className="progress flex-grow-1"
                          style={{
                            height: "8px",
                          }}
                      >
                        <div
                            className="progress-bar"
                            style={{
                              width: "5%",
                            }}
                        />
                      </div>

                      <span className="val">
                      5%
                    </span>
                    </div>

                    <div className="rating-row">
                    <span className="lbl">
                      2 ★
                    </span>

                      <div
                          className="progress flex-grow-1"
                          style={{
                            height: "8px",
                          }}
                      >
                        <div
                            className="progress-bar"
                            style={{
                              width: "2%",
                            }}
                        />
                      </div>

                      <span className="val">
                      2%
                    </span>
                    </div>

                    <div className="rating-row">
                    <span className="lbl">
                      1 ★
                    </span>

                      <div
                          className="progress flex-grow-1"
                          style={{
                            height: "8px",
                          }}
                      >
                        <div
                            className="progress-bar"
                            style={{
                              width: "1%",
                            }}
                        />
                      </div>

                      <span className="val">
                      1%
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
          MENU
      ===================================== */}

        <section
            className="section pt-0"
            id="menu"
        >
          <div className="container">
            <div className="section-head">
              <div>
              <span className="eyebrow">
                Menu
              </span>

                <h2 className="display-md">
                  Everything they cook
                </h2>

                <p>
                  {
                    restaurant.products
                        .length
                  }{" "}
                  dishes, made to order.
                  Prices match the
                  in-restaurant menu.
                </p>
              </div>

              <select
                  className="form-select"
                  style={{
                    width: "auto",
                    minWidth:
                        "190px",
                  }}
                  value={
                    selectedCategory
                  }
                  onChange={(event) =>
                      setSelectedCategory(
                          event.target
                              .value
                      )
                  }
              >
                <option value="all">
                  All categories
                </option>

                {categories.map(
                    (category) => (
                        <option
                            key={
                              category.slug
                            }
                            value={
                              category.slug
                            }
                        >
                          {
                            category.name
                          }
                        </option>
                    )
                )}
              </select>
            </div>

            <div className="row g-4 g-xl-5">
              {/* PRODUCTS */}

              <div className="col-12 col-lg-8">
                {filteredProducts.length ===
                0 ? (
                    <div className="empty-state">
                      <div className="ico">
                        🍽️
                      </div>

                      <p className="mb-0">
                        No dishes found in
                        this category.
                      </p>
                    </div>
                ) : (
                    <div className="row g-4">
                      {filteredProducts.map(
                          (product) => (
                              <div
                                  key={
                                    product.id
                                  }
                                  className="col-12 col-sm-6 col-xl-4"
                              >
                                <article className="tile h-100">
                                  <div
                                      className="tile-media"
                                      style={{
                                        aspectRatio:
                                            "4/3",
                                      }}
                                  >
                                    <img
                                        alt={
                                          product.name
                                        }
                                        src={
                                            product.imageUrl ||
                                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
                                        }
                                    />

                                    {product.badge && (
                                        <span className="media-tag is-green">
                                {
                                  product.badge
                                }
                              </span>
                                    )}
                                  </div>

                                  <div className="tile-body">
                                    <h3 className="tile-title">
                                      {
                                        product.name
                                      }
                                    </h3>

                                    <p className="tile-meta">
                                      {product.description ||
                                          "Freshly prepared dish."}
                                    </p>

                                    <div className="d-flex justify-content-between align-items-center mt-auto">
                              <span className="price">
                                {money(
                                    product.price
                                )}
                                ֏
                              </span>

                                      <button
                                          className="btn btn-brand btn-sm"
                                          type="button"
                                          disabled={
                                            !restaurant.isAcceptingOrders
                                          }
                                          onClick={() =>
                                              addItem(
                                                  {
                                                    id: product.id,

                                                    slug:
                                                    product.slug,

                                                    name:
                                                    product.name,

                                                    price:
                                                    product.price,

                                                    imageUrl:
                                                    product.imageUrl,

                                                    restaurantId:
                                                    restaurant.id,

                                                    restaurantName:
                                                    restaurant.name,
                                                  }
                                              )
                                          }
                                      >
                                        {restaurant.isAcceptingOrders
                                            ? "Add"
                                            : "Closed"}
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              </div>
                          )
                      )}
                    </div>
                )}
              </div>

              {/* =================================
                BASKET
            ================================= */}

              <div className="col-12 col-lg-4">
                <div className="basket-sticky">
                  <div className="panel">
                    <div className="panel-head">
                      Your basket

                      <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={
                            clearCart
                          }
                          disabled={
                              !hasHydrated ||
                              items.length ===
                              0
                          }
                      >
                        Clear
                      </button>
                    </div>

                    <div className="panel-body">
                      <div className="d-grid gap-2">
                        {!hasHydrated ? (
                            <div className="empty-state">
                              <p className="mb-0">
                                Loading basket...
                              </p>
                            </div>
                        ) : items.length ===
                        0 ? (
                            <div className="empty-state">
                              <div className="ico">
                                🛍️
                              </div>

                              <p className="mb-0">
                                Your basket is
                                empty.
                                <br />
                                Add a dish to get
                                started.
                              </p>
                            </div>
                        ) : (
                            items.map(
                                (item) => (
                                    <div
                                        className="cart-item"
                                        key={
                                          item.id
                                        }
                                    >
                                      <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                          <p className="t">
                                            {
                                              item.name
                                            }
                                          </p>

                                          <div
                                              className="muted"
                                              style={{
                                                fontSize:
                                                    ".85rem",
                                              }}
                                          >
                                            {money(
                                                item.price
                                            )}
                                            ֏ ×{" "}
                                            {
                                              item.quantity
                                            }{" "}
                                            ={" "}
                                            <b>
                                              {money(
                                                  item.price *
                                                  item.quantity
                                              )}
                                              ֏
                                            </b>
                                          </div>

                                          <div
                                              className="muted"
                                              style={{
                                                fontSize:
                                                    ".75rem",
                                              }}
                                          >
                                            {
                                              item.restaurantName
                                            }
                                          </div>
                                        </div>

                                        <div className="qty">
                                          <button
                                              type="button"
                                              aria-label="Remove one"
                                              onClick={() =>
                                                  decreaseQuantity(
                                                      item.id
                                                  )
                                              }
                                          >
                                            −
                                          </button>

                                          <span>
                                    {
                                      item.quantity
                                    }
                                  </span>

                                          <button
                                              type="button"
                                              aria-label="Add one"
                                              onClick={() =>
                                                  increaseQuantity(
                                                      item.id
                                                  )
                                              }
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                          type="button"
                                          className="btn btn-ghost btn-sm mt-2"
                                          onClick={() =>
                                              removeItem(
                                                  item.id
                                              )
                                          }
                                      >
                                        Remove
                                      </button>
                                    </div>
                                )
                            )
                        )}
                      </div>
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

                      <Link
                          className={`btn btn-brand w-100 mt-3 ${
                              items.length ===
                              0
                                  ? "disabled"
                                  : ""
                          }`}
                          href={
                            items.length >
                            0
                                ? "/checkout"
                                : "#"
                          }
                      >
                        Go to checkout
                      </Link>
                    </div>
                  </div>

                  {/* FREE DELIVERY */}

                  {restaurant.freeDeliveryFrom && (
                      <div className="card-soft mt-4">
                        <div className="d-flex align-items-start gap-3">
                      <span
                          className="fc-icon"
                          style={{
                            background:
                                "var(--accent-tint)",
                            color:
                                "var(--accent)",
                            width:
                                "42px",
                            height:
                                "42px",
                            borderRadius:
                                "13px",
                            display:
                                "grid",
                            placeItems:
                                "center",
                            flex:
                                "0 0 auto",
                          }}
                      >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
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

                          <div>
                            <strong
                                style={{
                                  fontFamily:
                                      "var(--font-display)",
                                  letterSpacing:
                                      "-.02em",
                                }}
                            >
                              Free delivery
                              over{" "}
                              {money(
                                  restaurant.freeDeliveryFrom
                              )}
                              ֏
                            </strong>

                            <p
                                className="muted mb-0"
                                style={{
                                  fontSize:
                                      ".88rem",
                                }}
                            >
                              {restaurantSubtotal >=
                              restaurant.freeDeliveryFrom
                                  ? "You qualify for free delivery from this restaurant."
                                  : `Add ${money(
                                      Math.max(
                                          0,
                                          restaurant.freeDeliveryFrom -
                                          restaurantSubtotal
                                      )
                                  )}֏ more from ${restaurant.name} and we'll drop the ${money(
                                      restaurant.deliveryFee
                                  )}֏ delivery fee.`}
                            </p>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
          LOCATION
      ===================================== */}

        <section className="section section-tint">
          <div className="container">
            <div className="section-head">
              <div>
              <span className="eyebrow">
                Location
              </span>

                <h2 className="display-md">
                  Where they cook
                </h2>

                <p>
                  {addressText}
                </p>
              </div>

              <a
                  className="btn btn-line"
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
              >
                Get directions
              </a>
            </div>

            <div className="map-box">
              <iframe
                  title={`Map of ${restaurant.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              />
            </div>
          </div>
        </section>
      </div>
  );
}