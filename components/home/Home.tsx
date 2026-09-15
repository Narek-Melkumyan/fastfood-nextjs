"use client";

import { useState } from "react";
import Link from "next/link";

import { useCartStore } from "@/store/cartStore";

export type HomeProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  badge: string | null;
  ratingAverage: number;
  isAvailable: boolean;
  restaurant: {
    id: number;
    name: string;
    deliveryMinMinutes: number;
    deliveryMaxMinutes: number;
    isAcceptingOrders: boolean;
  };
};

type Props = {
  products: HomeProduct[];
};

function money(value: number) {
  return value.toLocaleString("en-US");
}

export default function Home({ products }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedId, setAddedId] = useState<number | null>(null);

  function addToBasket(product: HomeProduct) {
    if (
        !product.isAvailable ||
        !product.restaurant.isAcceptingOrders
    ) {
      return;
    }

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      restaurantId: product.restaurant.id,
      restaurantName: product.restaurant.name,
    });

    setAddedId(product.id);

    window.setTimeout(() => {
      setAddedId((current) =>
          current === product.id ? null : current
      );
    }, 1200);
  }

  return (
      <div>
        <section className="hero">
          <div className="container">
            <div className="row align-items-center g-4 g-lg-5">
              <div className="col-12 col-lg-6">
              <span className="eyebrow">
                <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
                </svg>

                28 min average delivery
              </span>

                <h1 className="display-xl hero-title">
                  Great food,
                  <span className="hl-mark">delivered</span>
                  while it&apos;s still hot.
                </h1>

                <p className="hero-lead">
                  Order from 480+ kitchens across the city. Live courier tracking,
                  contact-free drop-off, and your very first delivery is on us.
                </p>

                <form
                    className="search-field"
                    role="search"
                    onSubmit={(event) => event.preventDefault()}
                >
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                  >
                    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>

                  <input
                      type="text"
                      placeholder="Enter your delivery address"
                      aria-label="Delivery address"
                  />

                  <Link className="btn btn-brand" href="/products">
                    Find food
                  </Link>
                </form>

                <div className="trust-row">
                  <div className="avatars">
                    <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=160&auto=format&fit=crop"
                        alt=""
                    />

                    <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=160&auto=format&fit=crop"
                        alt=""
                    />

                    <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=160&auto=format&fit=crop"
                        alt=""
                    />

                    <img
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=160&auto=format&fit=crop"
                        alt=""
                    />
                  </div>

                  <div>
                  <span className="rating">
                    <svg viewBox="0 0 24 24">
                      <path
                          fill="currentColor"
                          d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                      />
                    </svg>

                    4.9 / 5
                  </span>

                    <div className="muted" style={{ fontSize: ".86rem" }}>
                      from 12,400+ verified reviews
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="hero-art mx-auto">
                  <div className="hero-art-main">
                    <img
                        src="https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1000&auto=format&fit=crop"
                        alt="A table full of freshly prepared dishes"
                    />
                  </div>

                  <div className="float-card top-left">
                  <span className="fc-icon">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </span>

                    <div>
                      <strong>28 min</strong>
                      <span>Average delivery</span>
                    </div>
                  </div>

                  <div className="float-card bottom-right">
                  <span className="fc-icon is-green">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="M3 7h11v9H3z" />
                      <path d="M14 10h3.5L21 13v3h-7z" />
                      <circle cx="7" cy="18" r="1.8" />
                      <circle cx="17.5" cy="18" r="1.8" />
                    </svg>
                  </span>

                    <div>
                      <strong>Free delivery</strong>
                      <span>On your first order</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="container">
            <div className="section-head reveal">
              <div>
                <h2 className="display-md">Browse by craving</h2>
                <p>
                  Eight kitchens&apos; worth of categories, updated every morning.
                </p>
              </div>

              <Link className="btn btn-line" href="/products">
                See full menu
              </Link>
            </div>

            <div className="cat-rail reveal">
              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🍕</span>
                <span className="cat-name">Pizza</span>
                <span className="cat-count">86 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🍔</span>
                <span className="cat-name">Burgers</span>
                <span className="cat-count">74 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🍣</span>
                <span className="cat-name">Sushi</span>
                <span className="cat-count">41 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🍝</span>
                <span className="cat-name">Pasta</span>
                <span className="cat-count">58 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🥗</span>
                <span className="cat-name">Salads</span>
                <span className="cat-count">63 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🌯</span>
                <span className="cat-name">Wraps</span>
                <span className="cat-count">37 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🍰</span>
                <span className="cat-name">Desserts</span>
                <span className="cat-count">52 places</span>
              </Link>

              <Link className="cat-card" href="/products">
                <span className="cat-emoji">🥤</span>
                <span className="cat-name">Drinks</span>
                <span className="cat-count">90 places</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section section-tint" id="how">
          <div className="container">
            <div className="text-center mb-5 reveal">
              <span className="eyebrow">How it works</span>

              <h2 className="display-lg mb-2">
                Three steps between you and dinner
              </h2>

              <p className="lead mx-auto">
                No calls, no waiting on hold. Everything happens in the app —
                from picking a kitchen to watching the courier turn onto your
                street.
              </p>
            </div>

            <div className="steps reveal">
              <article className="step">
                <div className="step-num">
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </div>

                <span className="step-index">STEP 01</span>
                <h3>Pick your spot</h3>

                <p>
                  Filter by cuisine, rating, price or delivery window and find
                  the kitchen you&apos;re actually in the mood for.
                </p>
              </article>

              <article className="step">
                <div className="step-num">
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>

                <span className="step-index">STEP 02</span>
                <h3>Build your basket</h3>

                <p>
                  Add dishes, apply a promo code, choose a delivery slot and pay
                  by card or cash — whatever suits you.
                </p>
              </article>

              <article className="step">
                <div className="step-num">
                  <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                    <path d="M3 7h11v9H3z" />
                    <path d="M14 10h3.5L21 13v3h-7z" />
                    <circle cx="7" cy="18" r="1.8" />
                    <circle cx="17.5" cy="18" r="1.8" />
                  </svg>
                </div>

                <span className="step-index">STEP 03</span>
                <h3>Track to your door</h3>

                <p>
                  Follow the courier live on the map and get a nudge the moment
                  your food is one minute away.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head reveal">
              <div>
                <span className="eyebrow">Popular right now</span>
                <h2 className="display-md">Featured dishes</h2>
                <p>Fresh picks from active Foodly restaurants.</p>
              </div>

              <Link className="btn btn-line" href="/products">
                Browse all dishes
              </Link>
            </div>

            {products.length === 0 ? (
                <div className="empty-state">
                  <div className="ico">🍽️</div>
                  <p className="mb-0">No dishes available right now.</p>
                </div>
            ) : (
                <div className="row g-4">
                  {products.map((product, index) => {
                    const canOrder =
                        product.isAvailable &&
                        product.restaurant.isAcceptingOrders;

                    return (
                        <div
                            className="col-6 col-lg-3 reveal"
                            key={product.id}
                        >
                          <article className="tile h-100">
                            <div
                                className="tile-media"
                                style={{ aspectRatio: "4/3" }}
                            >
                              <Link href={`/products/${product.slug}`}>
                                <img
                                    src={
                                        product.imageUrl ||
                                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
                                    }
                                    alt={product.name}
                                />
                              </Link>

                              {product.badge ? (
                                  <span className="media-tag is-green">
                            {product.badge}
                          </span>
                              ) : index === 0 ? (
                                  <span className="media-tag is-brand">
                            Featured
                          </span>
                              ) : null}
                            </div>

                            <div className="tile-body">
                              <h3 className="tile-title">
                                <Link
                                    href={`/products/${product.slug}`}
                                    className="text-decoration-none"
                                >
                                  {product.name}
                                </Link>
                              </h3>

                              <p className="tile-meta">
                                {product.restaurant.name} ·{" "}
                                {product.restaurant.deliveryMinMinutes}–
                                {product.restaurant.deliveryMaxMinutes} min
                              </p>

                              <div className="d-flex align-items-center justify-content-between mt-auto">
                          <span className="rating">
                            <svg viewBox="0 0 24 24">
                              <path
                                  fill="currentColor"
                                  d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                              />
                            </svg>

                            {product.ratingAverage.toFixed(1)}
                          </span>

                                <span className="price">
                            {money(product.price)}֏
                          </span>
                              </div>

                              <div className="d-grid gap-2 mt-3">
                                <Link
                                    className="btn btn-line"
                                    href={`/products/${product.slug}`}
                                >
                                  View details
                                </Link>

                                <button
                                    type="button"
                                    className="btn btn-soft"
                                    disabled={!canOrder}
                                    onClick={() => addToBasket(product)}
                                >
                                  {!canOrder
                                      ? "Restaurant closed"
                                      : addedId === product.id
                                          ? "Added ✓"
                                          : "Add to basket"}
                                </button>
                              </div>
                            </div>
                          </article>
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </section>

        <section className="section-sm">
          <div className="container">
            <div className="banner reveal">
              <div className="row g-0 align-items-stretch">
                <div className="col-12 col-lg-7">
                  <div className="banner-inner">
                    <span className="eyebrow is-green">Limited offer</span>

                    <h2 className="display-lg">
                      Get 20% off your next three orders
                    </h2>

                    <p className="mb-4">
                      Use code{" "}
                      <strong style={{ color: "#fff" }}>SAVE10</strong> at
                      checkout for 10% off, or{" "}
                      <strong style={{ color: "#fff" }}>FREEDEL</strong> to drop
                      the delivery fee entirely. Stackable with weekday lunch
                      deals.
                    </p>

                    <div className="d-flex flex-wrap gap-2">
                      <Link
                          className="btn btn-brand btn-lg"
                          href="/promotions"
                      >
                        See all offers
                      </Link>

                      <Link
                          className="btn btn-outline-light btn-lg"
                          href="/products"
                      >
                        Start an order
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-5">
                  <div className="banner-media h-100">
                    <img
                        src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop"
                        alt="Burger and fries"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head reveal">
              <div>
                <span className="eyebrow">Top rated near you</span>
                <h2 className="display-md">Kitchens worth the wait</h2>

                <p>
                  Hand-picked partners with a 4.5+ rating over the last 500
                  orders.
                </p>
              </div>

              <Link className="btn btn-line" href="/restaurants">
                All restaurants
              </Link>
            </div>

            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-4 reveal">
                <article className="tile">
                  <div
                      className="tile-media"
                      style={{ aspectRatio: "16/10" }}
                  >
                    <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop"
                        alt="La Pasta Yerevan dining room"
                    />

                    <span className="media-tag">Italian</span>
                  </div>

                  <div className="tile-body">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h3 className="tile-title">La Pasta Yerevan</h3>

                      <span className="rating">
                      <svg viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                        />
                      </svg>

                      4.8
                    </span>
                    </div>

                    <p className="tile-meta">
                      25–35 min · Delivery from 500֏
                    </p>

                    <div className="d-flex gap-2 flex-wrap mt-auto">
                      <span className="badge-soft is-green">Open now</span>
                      <span className="badge-soft">Free over 8,000֏</span>
                    </div>
                  </div>
                </article>
              </div>

              <div className="col-12 col-md-6 col-lg-4 reveal">
                <article className="tile">
                  <div
                      className="tile-media"
                      style={{ aspectRatio: "16/10" }}
                  >
                    <img
                        src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=900&auto=format&fit=crop"
                        alt="Green Bowl dining room"
                    />

                    <span className="media-tag">Healthy</span>
                  </div>

                  <div className="tile-body">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h3 className="tile-title">Green Bowl</h3>

                      <span className="rating">
                      <svg viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                        />
                      </svg>

                      4.6
                    </span>
                    </div>

                    <p className="tile-meta">
                      20–30 min · Delivery from 400֏
                    </p>

                    <div className="d-flex gap-2 flex-wrap mt-auto">
                      <span className="badge-soft is-green">Open now</span>
                      <span className="badge-soft">Vegan options</span>
                    </div>
                  </div>
                </article>
              </div>

              <div className="col-12 col-md-6 col-lg-4 reveal">
                <article className="tile">
                  <div
                      className="tile-media"
                      style={{ aspectRatio: "16/10" }}
                  >
                    <img
                        src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=900&auto=format&fit=crop"
                        alt="Tokyo Ramen House dining room"
                    />

                    <span className="media-tag is-brand">New</span>
                  </div>

                  <div className="tile-body">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h3 className="tile-title">Tokyo Ramen House</h3>

                      <span className="rating">
                      <svg viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.8 6.6 19.7l1.2-6.1L3.3 9.4l6.1-.8z"
                        />
                      </svg>

                      4.9
                    </span>
                    </div>

                    <p className="tile-meta">
                      30–40 min · Delivery from 600֏
                    </p>

                    <div className="d-flex gap-2 flex-wrap mt-auto">
                      <span className="badge-soft is-green">Open now</span>
                      <span className="badge-soft">Late night</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="container">
            <div className="stat-grid reveal">
              <div className="stat">
                <div className="stat-num">480+</div>
                <div className="stat-label">Partner kitchens</div>
              </div>

              <div className="stat">
                <div className="stat-num">28 min</div>
                <div className="stat-label">Average delivery</div>
              </div>

              <div className="stat">
                <div className="stat-num">1.2M</div>
                <div className="stat-label">Orders delivered</div>
              </div>

              <div className="stat">
                <div className="stat-num">4.9/5</div>
                <div className="stat-label">Customer rating</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-tint">
          <div className="container">
            <div className="text-center mb-5 reveal">
              <span className="eyebrow">Reviews</span>

              <h2 className="display-lg mb-2">
                People who eat here a lot
              </h2>

              <p className="lead mx-auto">
                Pulled from verified orders. No edits, no cherry-picking the
                five-star ones.
              </p>
            </div>

            <div className="row g-4">
              <div className="col-12 col-lg-4 reveal">
                <div className="quote">
                  <span className="stars">★★★★★</span>

                  <p>
                    “I order lunch for the whole studio twice a week. Six people,
                    six different diets, one basket — and it still shows up hot
                    and correctly labelled.”
                  </p>

                  <div className="quote-who">
                    <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                        alt=""
                    />

                    <div>
                      <strong>Arman K.</strong>
                      <span>412 orders</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4 reveal">
                <div className="quote">
                  <span className="stars">★★★★★</span>

                  <p>
                    “The live tracking is the part I actually use. I can see the
                    courier two streets away and start making tea instead of
                    guessing.”
                  </p>

                  <div className="quote-who">
                    <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
                        alt=""
                    />

                    <div>
                      <strong>Lilit M.</strong>
                      <span>96 orders</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4 reveal">
                <div className="quote">
                  <span className="stars">★★★★☆</span>

                  <p>
                    “Prices match the restaurant menu, which is rarer than it
                    should be. The promo codes are honest too — no hidden minimum
                    spend.”
                  </p>

                  <div className="quote-who">
                    <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                        alt=""
                    />

                    <div>
                      <strong>Davit S.</strong>
                      <span>203 orders</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="row align-items-center g-4 g-lg-5">
              <div className="col-12 col-lg-6 reveal">
                <span className="eyebrow">Foodly app</span>

                <h2 className="display-lg">
                  Reorder your usual in two taps
                </h2>

                <p className="lead mb-4">
                  Saved addresses, one-tap reorder, live courier map and push
                  alerts when the food leaves the kitchen. Free on iOS and
                  Android.
                </p>

                <ul className="list-unstyled mb-4">
                  <li className="d-flex align-items-center gap-2 mb-2">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>

                    <span>Reorder any past basket in one tap</span>
                  </li>

                  <li className="d-flex align-items-center gap-2 mb-2">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>

                    <span>Exclusive in-app promo codes every Friday</span>
                  </li>

                  <li className="d-flex align-items-center gap-2">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>

                    <span>Split the bill with friends after checkout</span>
                  </li>
                </ul>

                <div className="d-flex flex-wrap gap-2">
                  <a className="store-btn" href="#">
                    <svg viewBox="0 0 24 24">
                      <path
                          fill="currentColor"
                          d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.2 1.2-2.4 1.2-2.5 0 0-2.4-.9-2.4-3.6zM14.2 5.9c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 0 2.1-.5 2.7-1.3z"
                      />
                    </svg>

                    <span>
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </span>
                  </a>

                  <a className="store-btn" href="#">
                    <svg viewBox="0 0 24 24">
                      <path
                          fill="currentColor"
                          d="M4 3.2v17.6c0 .6.6 1 1.1.7l13.4-8.8c.5-.3.5-1 0-1.4L5.1 2.5c-.5-.3-1.1.1-1.1.7z"
                      />
                    </svg>

                    <span>
                    <small>Get it on</small>
                    <strong>Google Play</strong>
                  </span>
                  </a>
                </div>
              </div>

              <div className="col-12 col-lg-6 reveal">
                <div
                    className="hero-art mx-auto"
                    style={{ maxWidth: "460px" }}
                >
                  <div
                      className="hero-art-main"
                      style={{ aspectRatio: "4/3.6" }}
                  >
                    <img
                        src="https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=900&auto=format&fit=crop"
                        alt="Courier heading out with a delivery bag"
                    />
                  </div>

                  <div className="float-card bottom-right">
                  <span className="fc-icon">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>

                    <div>
                      <strong>2 streets away</strong>
                      <span>Arriving in 4 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-tint">
          <div className="container">
            <div className="row g-4 g-lg-5">
              <div className="col-12 col-lg-4 reveal">
                <span className="eyebrow">FAQ</span>

                <h2 className="display-md">
                  Questions we get a lot
                </h2>

                <p className="muted">
                  Still stuck? Our support team answers in under three minutes,
                  every day until midnight.
                </p>

                <Link className="btn btn-line mt-2" href="/profile">
                  Contact support
                </Link>
              </div>

              <div className="col-12 col-lg-8 reveal">
                <details className="faq-item" open>
                  <summary>How much does delivery cost?</summary>

                  <div className="faq-body">
                    Delivery starts at 400֏ and depends on how far the kitchen is
                    from you. Baskets over 8,000֏ ship free at most partners, and
                    your first order is always free with the code shown at
                    checkout.
                  </div>
                </details>

                <details className="faq-item">
                  <summary>Can I pay in cash?</summary>

                  <div className="faq-body">
                    Yes. Choose “Cash on delivery” at checkout and pay the courier
                    when the food arrives. Card payments are processed at the
                    moment the restaurant accepts your order, never before.
                  </div>
                </details>

                <details className="faq-item">
                  <summary>What if something is missing from my order?</summary>

                  <div className="faq-body">
                    Open the order in your account and tap “Report an issue”.
                    Missing items are refunded to your Foodly wallet immediately,
                    and to your card within three working days.
                  </div>
                </details>

                <details className="faq-item">
                  <summary>How late can I order?</summary>

                  <div className="faq-body">
                    Most kitchens close at 23:00, but our late-night partners take
                    orders until 03:00. Filter by “Late night” on the restaurants
                    page to see who is still cooking.
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="section-sm pb-5">
          <div className="container">
            <div className="newsletter reveal">
              <span className="eyebrow">Newsletter</span>

              <h2 className="display-md mb-2">
                Deals, straight to your inbox
              </h2>

              <p className="muted mb-0">
                One email a week with the best offers in your area. Unsubscribe
                in a click.
              </p>

              <form
                  className="search-field"
                  onSubmit={(event) => event.preventDefault()}
              >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <path d="M3 6h18v12H3z" />
                  <path d="m3 7 9 6 9-6" />
                </svg>

                <input
                    type="email"
                    placeholder="you@example.com"
                    aria-label="Email address"
                />

                <button className="btn btn-brand" type="submit">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
  );
}