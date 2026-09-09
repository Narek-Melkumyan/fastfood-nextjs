"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Cuisine = {
  id: number;
  name: string;
  slug: string;
};

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
  deliveryFee: number;
  minimumOrder: number;
  freeDeliveryFrom: number | null;
  ratingAverage: number;
  reviewCount: number;
  isAcceptingOrders: boolean;
  cuisines: Cuisine[];
};

type Props = {
  restaurants: Restaurant[];
};

export default function Restaurants({
                                      restaurants,
                                    }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");

  const filteredRestaurants = useMemo(() => {
    let result = restaurants.filter((restaurant) => {
      const text = search.toLowerCase();

      return (
          restaurant.name.toLowerCase().includes(text) ||
          restaurant.cuisines.some((cuisine) =>
              cuisine.name.toLowerCase().includes(text)
          )
      );
    });

    if (sort === "rating") {
      result = [...result].sort(
          (a, b) => b.ratingAverage - a.ratingAverage
      );
    }

    if (sort === "fastest") {
      result = [...result].sort(
          (a, b) =>
              a.deliveryMinMinutes - b.deliveryMinMinutes
      );
    }

    if (sort === "delivery") {
      result = [...result].sort(
          (a, b) => a.deliveryFee - b.deliveryFee
      );
    }

    return result;
  }, [restaurants, search, sort]);

  return (
      <main>
        <section className="section-sm">
          <div className="container">
            <div className="text-center mb-5">
            <span className="eyebrow">
              Restaurants
            </span>

              <h1 className="display-lg">
                Find your next meal
              </h1>
            </div>

            <div
                className="search-field mx-auto"
                style={{ maxWidth: "650px" }}
            >
              <input
                  type="search"
                  placeholder="Search restaurants or cuisines..."
                  value={search}
                  onChange={(e) =>
                      setSearch(e.target.value)
                  }
              />
            </div>
          </div>
        </section>

        <section className="section pt-0">
          <div className="container">
            <div className="toolbar mb-4">
              <div className="count">
                <b>{filteredRestaurants.length}</b>{" "}
                restaurants found
              </div>

              <select
                  className="form-select"
                  style={{ width: "auto" }}
                  value={sort}
                  onChange={(e) =>
                      setSort(e.target.value)
                  }
              >
                <option value="recommended">
                  Recommended
                </option>

                <option value="fastest">
                  Fastest delivery
                </option>

                <option value="rating">
                  Highest rated
                </option>

                <option value="delivery">
                  Delivery fee
                </option>
              </select>
            </div>

            <div className="row g-4">
              {filteredRestaurants.map(
                  (restaurant) => (
                      <div
                          key={restaurant.id}
                          className="col-12 col-md-6 col-xl-4"
                      >
                        <article className="tile h-100">
                          <div
                              className="tile-media"
                              style={{
                                aspectRatio: "16/10",
                              }}
                          >
                            <img
                                src={
                                    restaurant.coverImageUrl ||
                                    ""
                                }
                                alt={restaurant.name}
                            />

                            {restaurant.cuisines[0] && (
                                <span className="media-tag">
                          {
                            restaurant
                                .cuisines[0].name
                          }
                        </span>
                            )}
                          </div>

                          <div className="tile-body">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <h3 className="tile-title">
                                {restaurant.name}
                              </h3>

                              <span className="rating">
                          ⭐{" "}
                                {restaurant.ratingAverage.toFixed(
                                    1
                                )}
                        </span>
                            </div>

                            <p className="tile-meta">
                              {
                                restaurant.deliveryMinMinutes
                              }
                              –
                              {
                                restaurant.deliveryMaxMinutes
                              }{" "}
                              min ·{" "}
                              {restaurant.deliveryFee === 0
                                  ? "Free delivery"
                                  : `Delivery from ${restaurant.deliveryFee.toLocaleString()}֏`}
                            </p>

                            <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge-soft is-green">
                          {restaurant.isAcceptingOrders
                              ? "Open now"
                              : "Closed"}
                        </span>

                              {restaurant.freeDeliveryFrom && (
                                  <span className="badge-soft">
                            Free over{" "}
                                    {restaurant.freeDeliveryFrom.toLocaleString()}
                                    ֏
                          </span>
                              )}
                            </div>

                            <Link
                                className="btn btn-line w-100 mt-auto"
                                href={`/restaurants/${restaurant.slug}`}
                            >
                              View menu
                            </Link>
                          </div>
                        </article>
                      </div>
                  )
              )}
            </div>
          </div>
        </section>
      </main>
  );
}