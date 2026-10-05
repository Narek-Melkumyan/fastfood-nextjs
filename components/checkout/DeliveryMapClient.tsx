"use client";

import {
    useEffect,
    useRef,
} from "react";

import {
    LngLatBounds,
    Map,
    Marker,
    NavigationControl,
    Popup,
    setWorkerUrl,
} from "maplibre-gl";

import type {
    DeliveryPreview,
} from "@/lib/maps";

setWorkerUrl(
    "/maplibre/maplibre-gl-worker.mjs"
);

type Props = {
    preview: DeliveryPreview;
};

const mapStyles = `
  .delivery-map-shell {
    position: relative;
    overflow: hidden;

    width: 100%;

    border: 1px solid var(--line);
    border-radius: 22px;

    background: #f7f7f5;

    box-shadow:
      0 14px 40px rgba(17, 17, 17, .08);
  }

  .delivery-map-container {
    width: 100%;
    height: 440px;
  }

  .delivery-map-overlay {
    position: absolute;
    z-index: 5;

    top: 14px;
    left: 14px;

    display: flex;
    align-items: center;

    gap: 10px;

    max-width:
      calc(100% - 28px);

    padding:
      10px 13px;

    border:
      1px solid
      rgba(255,255,255,.75);

    border-radius:
      16px;

    background:
      rgba(255,255,255,.92);

    box-shadow:
      0 10px 30px
      rgba(17,17,17,.12);

    backdrop-filter:
      blur(14px);

    -webkit-backdrop-filter:
      blur(14px);

    pointer-events:
      none;
  }

  .delivery-map-overlay-icon {
    display: grid;
    place-items: center;

    width: 36px;
    height: 36px;

    flex: 0 0 36px;

    border-radius:
      12px;

    background:
      var(--brand, #ff5a22);

    color:
      #fff;

    font-weight:
      900;

    box-shadow:
      0 6px 16px
      rgba(255,90,34,.25);
  }

  .delivery-map-overlay-title {
    color:
      var(--ink, #161616);

    font-size:
      13px;

    font-weight:
      800;

    line-height:
      1.25;
  }

  .delivery-map-overlay-meta {
    margin-top:
      2px;

    color:
      var(--muted, #777);

    font-size:
      12px;

    line-height:
      1.25;
  }

  .foodly-map-marker {
    position:
      relative;

    display:
      grid;

    place-items:
      center;

    width:
      44px;

    height:
      44px;

    border:
      3px solid #fff;

    border-radius:
      999px;

    color:
      #fff;

    box-shadow:
      0 8px 22px
      rgba(17,17,17,.24),
      0 0 0 1px
      rgba(17,17,17,.06);

    cursor:
      pointer;

    transition:
      transform .18s ease;
  }

  .foodly-map-marker:hover {
    transform:
      translateY(-2px)
      scale(1.04);
  }

  .foodly-map-marker::after {
    content:
      "";

    position:
      absolute;

    left:
      50%;

    bottom:
      -6px;

    width:
      10px;

    height:
      10px;

    transform:
      translateX(-50%)
      rotate(45deg);

    background:
      inherit;

    border-right:
      2px solid #fff;

    border-bottom:
      2px solid #fff;
  }

  .foodly-map-marker.customer {
    background:
      #171717;
  }

  .foodly-map-marker.restaurant {
    background:
      var(--brand, #ff5a22);
  }

  .foodly-map-marker svg {
    position:
      relative;

    z-index:
      1;

    width:
      20px;

    height:
      20px;

    fill:
      none;

    stroke:
      currentColor;

    stroke-width:
      2.1;

    stroke-linecap:
      round;

    stroke-linejoin:
      round;
  }

  .maplibregl-ctrl-group {
    overflow:
      hidden !important;

    border:
      1px solid
      rgba(17,17,17,.08) !important;

    border-radius:
      13px !important;

    box-shadow:
      0 8px 25px
      rgba(17,17,17,.12) !important;
  }

  .maplibregl-ctrl-group button {
    width:
      36px !important;

    height:
      36px !important;

    background-color:
      rgba(255,255,255,.96) !important;
  }

  .maplibregl-popup-content {
    min-width:
      165px;

    padding:
      14px 16px !important;

    border-radius:
      16px !important;

    box-shadow:
      0 12px 34px
      rgba(17,17,17,.15) !important;

    font-family:
      inherit;
  }

  .maplibregl-popup-close-button {
    top:
      4px;

    right:
      6px;

    width:
      24px;

    height:
      24px;

    border-radius:
      8px;

    font-size:
      17px;
  }

  .foodly-map-popup-title {
    margin-bottom:
      4px;

    color:
      var(--ink, #171717);

    font-size:
      14px;

    font-weight:
      800;
  }

  .foodly-map-popup-meta {
    color:
      var(--muted, #717171);

    font-size:
      12px;

    line-height:
      1.55;
  }

  @media (
    max-width: 767.98px
  ) {
    .delivery-map-container {
      height:
        330px;
    }

    .delivery-map-shell {
      border-radius:
        18px;
    }

    .delivery-map-overlay {
      top:
        10px;

      left:
        10px;

      max-width:
        calc(100% - 20px);

      padding:
        8px 10px;

      border-radius:
        14px;
    }

    .delivery-map-overlay-icon {
      width:
        32px;

      height:
        32px;

      flex-basis:
        32px;

      border-radius:
        10px;
    }

    .delivery-map-overlay-title {
      font-size:
        12px;
    }

    .delivery-map-overlay-meta {
      font-size:
        11px;
    }

    .foodly-map-marker {
      width:
        40px;

      height:
        40px;
    }

    .foodly-map-marker svg {
      width:
        18px;

      height:
        18px;
    }
  }
`;

function createCustomerMarker() {
    const element =
        document.createElement(
            "div"
        );

    element.className =
        "foodly-map-marker customer";

    element.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    `;

    return element;
}

function createRestaurantMarker() {
    const element =
        document.createElement(
            "div"
        );

    element.className =
        "foodly-map-marker restaurant";

    element.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M7 3v7" />
        <path d="M4.5 3v4.5A2.5 2.5 0 0 0 7 10" />
        <path d="M9.5 3v4.5A2.5 2.5 0 0 1 7 10v11" />
        <path d="M15 3v18" />
        <path d="M15 3c3 1.2 4.5 3.7 4.5 6.5V12H15" />
      </svg>
    `;

    return element;
}

function createPopupContent(
    title: string,
    lines: string[]
) {
    const root =
        document.createElement(
            "div"
        );

    const titleElement =
        document.createElement(
            "div"
        );

    titleElement.className =
        "foodly-map-popup-title";

    titleElement.textContent =
        title;

    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "foodly-map-popup-meta";

    lines.forEach(
        (
            line,
            index
        ) => {
            if (
                index > 0
            ) {
                meta.appendChild(
                    document.createElement(
                        "br"
                    )
                );
            }

            meta.appendChild(
                document.createTextNode(
                    line
                )
            );
        }
    );

    root.appendChild(
        titleElement
    );

    root.appendChild(
        meta
    );

    return root;
}

export default function DeliveryMapClient({
                                              preview,
                                          }: Props) {
    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    useEffect(() => {
        if (
            !containerRef.current
        ) {
            return;
        }

        const map =
            new Map({
                container:
                containerRef.current,

                style:
                    "https://tiles.openfreemap.org/styles/positron",

                center: [
                    preview.delivery.longitude,
                    preview.delivery.latitude,
                ],

                zoom:
                    11,

                minZoom:
                    8,

                maxZoom:
                    18,

                scrollZoom:
                    false,

                dragRotate:
                    false,

                pitchWithRotate:
                    false,

                attributionControl: {},
            });

        map.addControl(
            new NavigationControl({
                showCompass:
                    false,

                showZoom:
                    true,
            }),
            "bottom-right"
        );

        const markers:
            Marker[] = [];

        /*
         * =====================================
         * CUSTOMER MARKER
         * =====================================
         */

        const customerPopup =
            new Popup({
                offset:
                    28,
            })
                .setDOMContent(
                    createPopupContent(
                        "Your address",
                        [
                            preview.delivery
                                .address,
                        ]
                    )
                );

        const customerMarker =
            new Marker({
                element:
                    createCustomerMarker(),

                anchor:
                    "bottom",
            })
                .setLngLat([
                    preview.delivery.longitude,
                    preview.delivery.latitude,
                ])
                .setPopup(
                    customerPopup
                )
                .addTo(
                    map
                );

        markers.push(
            customerMarker
        );

        /*
         * =====================================
         * RESTAURANT MARKERS
         * =====================================
         */

        preview.restaurants.forEach(
            (
                restaurant
            ) => {
                const popup =
                    new Popup({
                        offset:
                            28,
                    })
                        .setDOMContent(
                            createPopupContent(
                                restaurant
                                    .restaurantName,
                                [
                                    `${restaurant.distanceMiles} mi away`,
                                    `${restaurant.driveMinutes} min drive`,
                                    `${restaurant.estimatedDeliveryMinutes} min estimated delivery`,
                                ]
                            )
                        );

                const marker =
                    new Marker({
                        element:
                            createRestaurantMarker(),

                        anchor:
                            "bottom",
                    })
                        .setLngLat([
                            restaurant.longitude,
                            restaurant.latitude,
                        ])
                        .setPopup(
                            popup
                        )
                        .addTo(
                            map
                        );

                markers.push(
                    marker
                );
            }
        );

        /*
         * =====================================
         * ROUTE GEOJSON
         * =====================================
         */

        const routeData = {
            type:
                "FeatureCollection" as const,

            features:
                preview.restaurants.map(
                    (
                        restaurant
                    ) => ({
                        type:
                            "Feature" as const,

                        properties: {
                            restaurantId:
                            restaurant
                                .restaurantId,
                        },

                        geometry: {
                            type:
                                "LineString" as const,

                            coordinates:
                                restaurant.geometry.map(
                                    (
                                        [
                                            latitude,
                                            longitude,
                                        ]
                                    ) => [
                                        longitude,
                                        latitude,
                                    ]
                                ),
                        },
                    })
                ),
        };

        /*
         * =====================================
         * FIT BOUNDS
         * =====================================
         */

        const bounds =
            new LngLatBounds();

        bounds.extend([
            preview.delivery.longitude,
            preview.delivery.latitude,
        ]);

        preview.restaurants.forEach(
            (
                restaurant
            ) => {
                bounds.extend([
                    restaurant.longitude,
                    restaurant.latitude,
                ]);

                restaurant.geometry.forEach(
                    (
                        [
                            latitude,
                            longitude,
                        ]
                    ) => {
                        bounds.extend([
                            longitude,
                            latitude,
                        ]);
                    }
                );
            }
        );

        map.on(
            "load",
            () => {
                /*
                 * Route source.
                 */

                map.addSource(
                    "foodly-delivery-routes",
                    {
                        type:
                            "geojson",

                        data:
                        routeData,
                    }
                );

                /*
                 * White casing.
                 */

                map.addLayer({
                    id:
                        "foodly-route-casing",

                    type:
                        "line",

                    source:
                        "foodly-delivery-routes",

                    layout: {
                        "line-cap":
                            "round",

                        "line-join":
                            "round",
                    },

                    paint: {
                        "line-color":
                            "#ffffff",

                        "line-width":
                            10,

                        "line-opacity":
                            0.96,
                    },
                });

                /*
                 * Main Foodly route.
                 */

                map.addLayer({
                    id:
                        "foodly-route",

                    type:
                        "line",

                    source:
                        "foodly-delivery-routes",

                    layout: {
                        "line-cap":
                            "round",

                        "line-join":
                            "round",
                    },

                    paint: {
                        "line-color":
                            "#ff5a22",

                        "line-width":
                            5.5,

                        "line-opacity":
                            1,
                    },
                });

                const isMobile =
                    window.innerWidth <
                    768;

                map.fitBounds(
                    bounds,
                    {
                        padding:
                            isMobile
                                ? {
                                    top:
                                        75,

                                    right:
                                        32,

                                    bottom:
                                        32,

                                    left:
                                        32,
                                }
                                : {
                                    top:
                                        90,

                                    right:
                                        50,

                                    bottom:
                                        50,

                                    left:
                                        50,
                                },

                        maxZoom:
                            14,

                        duration:
                            850,
                    }
                );
            }
        );

        /*
         * Keep MapLibre sized correctly
         * inside Bootstrap responsive columns.
         */

        const observer =
            new ResizeObserver(
                () => {
                    map.resize();
                }
            );

        observer.observe(
            containerRef.current
        );

        return () => {
            observer.disconnect();

            markers.forEach(
                (
                    marker
                ) => {
                    marker.remove();
                }
            );

            map.remove();
        };
    }, [
        preview,
    ]);

    return (
        <>
            <style>
                {mapStyles}
            </style>

            <div className="delivery-map-shell">

                <div className="delivery-map-overlay">

                    <div className="delivery-map-overlay-icon">
                        ↗
                    </div>

                    <div>

                        <div className="delivery-map-overlay-title">
                            Delivery route
                        </div>

                        <div className="delivery-map-overlay-meta">
                            {
                                preview.totalDistanceMiles
                            }{" "}
                            mi
                            {" · "}
                            up to{" "}
                            {
                                preview.maxEstimatedDeliveryMinutes
                            }{" "}
                            min
                        </div>

                    </div>

                </div>

                <div
                    ref={
                        containerRef
                    }
                    className="delivery-map-container"
                />

            </div>
        </>
    );
}