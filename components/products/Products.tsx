"use client";

import {
    useMemo,
    useState,
} from "react";

import Link from "next/link";

import {
    useCartStore,
} from "@/store/cartStore";

type Product = {
    id: number;

    name: string;
    slug: string;

    description:
        | string
        | null;

    price: number;

    imageUrl:
        | string
        | null;

    badge:
        | string
        | null;

    ratingAverage: number;
    reviewCount: number;

    category: {
        id: number;
        name: string;
        slug: string;
    };

    restaurant: {
        id: number;
        name: string;
        slug: string;

        deliveryMinMinutes: number;
        deliveryMaxMinutes: number;

        isAcceptingOrders: boolean;
    };
};

type Props = {
    products: Product[];
};

function money(
    value: number
) {
    return value.toLocaleString(
        "en-US"
    );
}

export default function Products({
                                     products,
                                 }: Props) {
    /*
     * =====================================
     * CART
     * =====================================
     */

    const addItem =
        useCartStore(
            (state) =>
                state.addItem
        );

    /*
     * =====================================
     * UI STATE
     * =====================================
     */

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState("all");

    const [
        addedProductId,
        setAddedProductId,
    ] =
        useState<number | null>(
            null
        );

    /*
     * =====================================
     * CATEGORIES
     * =====================================
     */

    const categories =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    string
                >();

            products.forEach(
                (product) => {
                    map.set(
                        product.category.slug,
                        product.category.name
                    );
                }
            );

            return Array.from(
                map.entries()
            ).map(
                ([slug, name]) => ({
                    slug,
                    name,
                })
            );
        }, [
            products,
        ]);

    /*
     * =====================================
     * FILTER PRODUCTS
     * =====================================
     */

    const filteredProducts =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return products.filter(
                (product) => {
                    const matchesSearch =
                        !query ||
                        product.name
                            .toLowerCase()
                            .includes(query) ||
                        product.restaurant.name
                            .toLowerCase()
                            .includes(query) ||
                        product.category.name
                            .toLowerCase()
                            .includes(query);

                    const matchesCategory =
                        selectedCategory ===
                        "all" ||
                        product.category.slug ===
                        selectedCategory;

                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );
        }, [
            products,
            search,
            selectedCategory,
        ]);

    /*
     * =====================================
     * ADD TO CART
     * =====================================
     */

    function handleAddToCart(
        product: Product
    ) {
        if (
            !product.restaurant
                .isAcceptingOrders
        ) {
            return;
        }

        addItem({
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
            product.restaurant.id,

            restaurantName:
            product.restaurant.name,
        });

        setAddedProductId(
            product.id
        );

        window.setTimeout(
            () => {
                setAddedProductId(
                    (current) =>
                        current ===
                        product.id
                            ? null
                            : current
                );
            },
            1000
        );
    }

    return (
        <main>

            {/* =================================
          HEADER
      ================================= */}

            <section className="section-sm">

                <div className="container">

                    <div className="text-center mb-5">

            <span className="eyebrow">
              Foodly menu
            </span>

                        <h1 className="display-lg">
                            Find your next dish
                        </h1>

                        <p>
                            Browse dishes from
                            restaurants across
                            Yerevan.
                        </p>

                    </div>

                    {/* SEARCH + CATEGORY */}

                    <div className="row g-3 justify-content-center">

                        <div className="col-12 col-md-6">

                            <input
                                className="form-control"
                                type="search"
                                placeholder="Search dishes or restaurants..."
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="col-12 col-md-auto">

                            <select
                                className="form-select"
                                value={
                                    selectedCategory
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSelectedCategory(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All categories
                                </option>

                                {categories.map(
                                    (
                                        category
                                    ) => (
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

                    </div>

                </div>

            </section>

            {/* =================================
          PRODUCTS
      ================================= */}

            <section className="section pt-0">

                <div className="container">

                    <div className="section-head">

                        <div>

              <span className="eyebrow">
                Menu
              </span>

                            <h2 className="display-md">
                                All dishes
                            </h2>

                        </div>

                        <span className="muted">
              {
                  filteredProducts
                      .length
              }{" "}
                            dishes
            </span>

                    </div>

                    {filteredProducts.length ===
                    0 ? (

                        <div className="empty-state">

                            <div className="ico">
                                🍽️
                            </div>

                            <p className="mb-0">
                                No products found.
                            </p>

                        </div>

                    ) : (

                        <div className="row g-4">

                            {filteredProducts.map(
                                (
                                    product
                                ) => (

                                    <div
                                        key={
                                            product.id
                                        }
                                        className="col-12 col-sm-6 col-lg-4 col-xl-3"
                                    >

                                        <article className="tile h-100">

                                            {/* IMAGE */}

                                            <Link
                                                href={`/products/${product.slug}`}
                                                className="tile-media"
                                                style={{
                                                    aspectRatio:
                                                        "4/3",
                                                }}
                                            >

                                                <img
                                                    src={
                                                        product.imageUrl ||
                                                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
                                                    }
                                                    alt={
                                                        product.name
                                                    }
                                                />

                                                {product.badge ? (

                                                    <span className="media-tag is-green">
                            {
                                product.badge
                            }
                          </span>

                                                ) : (

                                                    <span className="media-tag">
                            {
                                product
                                    .category
                                    .name
                            }
                          </span>

                                                )}

                                            </Link>

                                            {/* BODY */}

                                            <div className="tile-body">

                                                <h3 className="tile-title">

                                                    <Link
                                                        href={`/products/${product.slug}`}
                                                    >
                                                        {
                                                            product.name
                                                        }
                                                    </Link>

                                                </h3>

                                                {/* RESTAURANT */}

                                                <p className="tile-meta">

                                                    <Link
                                                        href={`/restaurants/${product.restaurant.slug}`}
                                                    >
                                                        {
                                                            product
                                                                .restaurant
                                                                .name
                                                        }
                                                    </Link>

                                                    {" · "}

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

                                                </p>

                                                {/* DESCRIPTION */}

                                                {product.description && (

                                                    <p className="tile-meta">
                                                        {
                                                            product.description
                                                        }
                                                    </p>

                                                )}

                                                {/* RATING + PRICE */}

                                                <div className="d-flex justify-content-between align-items-center mt-auto">

                          <span className="rating">
                            ⭐{" "}
                              {product
                                  .ratingAverage
                                  .toFixed(1)}
                          </span>

                                                    <span className="price">
                            {money(
                                product.price
                            )}
                                                        ֏
                          </span>

                                                </div>

                                                {/* ACTIONS */}

                                                <div className="d-grid gap-2 mt-3">

                                                    <Link
                                                        className="btn btn-line"
                                                        href={`/products/${product.slug}`}
                                                    >
                                                        View details
                                                    </Link>

                                                    <button
                                                        className="btn btn-brand"
                                                        type="button"
                                                        disabled={
                                                            !product
                                                                .restaurant
                                                                .isAcceptingOrders
                                                        }
                                                        onClick={() =>
                                                            handleAddToCart(
                                                                product
                                                            )
                                                        }
                                                    >

                                                        {!product
                                                            .restaurant
                                                            .isAcceptingOrders
                                                            ? "Restaurant closed"
                                                            : addedProductId ===
                                                            product.id
                                                                ? "Added ✓"
                                                                : "Add to basket"}

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

            </section>

        </main>
    );
}