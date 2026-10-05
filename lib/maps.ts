import "server-only";

import {
    prisma,
} from "@/lib/prisma";

/*
 * =========================================
 * TYPES
 * =========================================
 */

type CartItemInput = {
    productId: number;
    quantity: number;
};

type GeocodeAddressInput = {
    address: string;
    city?: string;
    district?: string;
};

export type DeliveryPoint = {
    latitude: number;
    longitude: number;
};

export type DeliveryRestaurantRoute = {
    restaurantId: number;
    restaurantName: string;

    latitude: number;
    longitude: number;

    /*
     * New US-facing value.
     */
    distanceMiles: number;

    /*
     * Temporary compatibility value.
     * The current Checkout component still reads distanceKm.
     * We can remove this after the Checkout UI is switched to miles.
     */
    distanceKm: number;

    driveMinutes: number;
    estimatedDeliveryMinutes: number;

    geometry: [number, number][];
};

export type DeliveryPreview = {
    delivery: {
        address: string;

        latitude: number;
        longitude: number;
    };

    restaurants:
        DeliveryRestaurantRoute[];

    /*
     * New US-facing value.
     */
    totalDistanceMiles: number;

    /*
     * Temporary compatibility value.
     */
    totalDistanceKm: number;

    maxEstimatedDeliveryMinutes:
        number;
};

/*
 * =========================================
 * LOS ANGELES SEARCH AREA
 * =========================================
 *
 * These are broad demo bounds around
 * Los Angeles so geocoding does not jump
 * to a similarly named street in another
 * state or country.
 */

const LOS_ANGELES_BOUNDS = {
    west: -118.67,
    north: 34.34,
    east: -118.15,
    south: 33.70,
};

const LOS_ANGELES_VIEWBOX =
    [
        LOS_ANGELES_BOUNDS.west,
        LOS_ANGELES_BOUNDS.north,
        LOS_ANGELES_BOUNDS.east,
        LOS_ANGELES_BOUNDS.south,
    ].join(",");

function isInsideLosAngelesBounds(
    latitude: number,
    longitude: number
) {
    return (
        latitude >=
        LOS_ANGELES_BOUNDS.south &&
        latitude <=
        LOS_ANGELES_BOUNDS.north &&
        longitude >=
        LOS_ANGELES_BOUNDS.west &&
        longitude <=
        LOS_ANGELES_BOUNDS.east
    );
}

/*
 * =========================================
 * ADDRESS CLEANING
 * =========================================
 */

function cleanAddressForGeocoding(
    address: string
) {
    return address
        /*
         * Apartment / unit / suite.
         *
         * Example:
         * 6801 Hollywood Blvd, Apt 18
         *
         * becomes:
         * 6801 Hollywood Blvd
         */
        .replace(
            /,\s*(apt\.?|apartment|unit|suite|ste\.?|#)\s*[^,]*/gi,
            ""
        )

        /*
         * Entrance / floor.
         */
        .replace(
            /,\s*entrance\s*[^,]*/gi,
            ""
        )
        .replace(
            /,\s*floor\s*[^,]*/gi,
            ""
        )

        /*
         * Remove location suffixes because
         * city/state/country are added by
         * the geocoder below.
         */
        .replace(
            /,\s*los angeles\b/gi,
            ""
        )
        .replace(
            /,\s*california\b/gi,
            ""
        )
        .replace(
            /,\s*ca\b/gi,
            ""
        )
        .replace(
            /,\s*(united states of america|united states|usa|u\.s\.a\.|us)\b/gi,
            ""
        )

        /*
         * Normalize whitespace / commas.
         */
        .replace(
            /\s+/g,
            " "
        )
        .replace(
            /,\s*,+/g,
            ","
        )
        .trim()
        .replace(
            /^,\s*|\s*,$/g,
            ""
        );
}

/*
 * =========================================
 * STREET VARIANTS
 * =========================================
 */

function createStreetVariants(
    address: string
) {
    const variants = [
        address,

        address
            .replace(
                /\bSt\.?\b/gi,
                "Street"
            )
            .replace(
                /\bRd\.?\b/gi,
                "Road"
            )
            .replace(
                /\bAve\.?\b/gi,
                "Avenue"
            )
            .replace(
                /\bBlvd\.?\b/gi,
                "Boulevard"
            )
            .replace(
                /\bDr\.?\b/gi,
                "Drive"
            )
            .replace(
                /\bLn\.?\b/gi,
                "Lane"
            )
            .replace(
                /\bHwy\.?\b/gi,
                "Highway"
            ),
    ];

    return [
        ...new Set(
            variants
                .map(
                    (value) =>
                        value.trim()
                )
                .filter(Boolean)
        ),
    ];
}

/*
 * =========================================
 * NOMINATIM RESULT
 * =========================================
 */

type NominatimResult = {
    lat?: string;
    lon?: string;
    display_name?: string;
};

function parseNominatimPoint(
    result:
        | NominatimResult
        | undefined
): DeliveryPoint | null {
    if (
        !result?.lat ||
        !result?.lon
    ) {
        return null;
    }

    const latitude =
        Number(
            result.lat
        );

    const longitude =
        Number(
            result.lon
        );

    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {
        return null;
    }

    /*
     * Safety check:
     * only accept points inside the LA area
     * configured above.
     */
    if (
        !isInsideLosAngelesBounds(
            latitude,
            longitude
        )
    ) {
        return null;
    }

    return {
        latitude,
        longitude,
    };
}

/*
 * =========================================
 * NOMINATIM REQUEST
 * =========================================
 */

async function requestNominatim(
    params: URLSearchParams
): Promise<DeliveryPoint | null> {
    const response =
        await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                method:
                    "GET",

                headers: {
                    Accept:
                        "application/json",

                    "Accept-Language":
                        "en-US,en;q=0.9",

                    "User-Agent":
                        "Foodly/1.0 (food-delivery-platform)",
                },

                cache:
                    "no-store",
            }
        );

    if (!response.ok) {
        console.error(
            "NOMINATIM ERROR:",
            response.status,
            response.statusText
        );

        throw new Error(
            "Could not contact the address service."
        );
    }

    const data =
        (await response.json()) as
            NominatimResult[];

    for (
        const result
        of data
        ) {
        const point =
            parseNominatimPoint(
                result
            );

        if (point) {
            return point;
        }
    }

    return null;
}

/*
 * =========================================
 * NOMINATIM FREE-FORM SEARCH
 * =========================================
 */

async function searchNominatim(
    query: string
): Promise<DeliveryPoint | null> {
    const cleanedQuery =
        query.trim();

    if (!cleanedQuery) {
        return null;
    }

    const params =
        new URLSearchParams({
            q:
            cleanedQuery,

            format:
                "jsonv2",

            limit:
                "5",

            addressdetails:
                "1",

            countrycodes:
                "us",

            viewbox:
            LOS_ANGELES_VIEWBOX,

            bounded:
                "1",
        });

    return requestNominatim(
        params
    );
}

/*
 * =========================================
 * STRUCTURED NOMINATIM SEARCH
 * =========================================
 */

async function searchNominatimStructured(
    street: string,
    city: string
): Promise<DeliveryPoint | null> {
    const params =
        new URLSearchParams({
            street,

            city,

            state:
                "California",

            country:
                "United States",

            countrycodes:
                "us",

            format:
                "jsonv2",

            limit:
                "5",

            addressdetails:
                "1",

            viewbox:
            LOS_ANGELES_VIEWBOX,

            bounded:
                "1",
        });

    return requestNominatim(
        params
    );
}

/*
 * =========================================
 * GEOCODE DELIVERY ADDRESS
 * =========================================
 */

export async function geocodeAddress({
                                         address,
                                         city,
                                         district,
                                     }: GeocodeAddressInput): Promise<DeliveryPoint | null> {
    const cleanedAddress =
        cleanAddressForGeocoding(
            address
        );

    if (!cleanedAddress) {
        return null;
    }

    /*
     * Foodly is LA-only for now.
     *
     * Even if an older saved address still
     * contains another city,
     * new checkout geocoding is constrained
     * to Los Angeles.
     */
    const cleanedCity =
        city
            ?.trim() ||
        "Los Angeles";

    const normalizedCity =
        cleanedCity
            .toLowerCase() ===
        "los angeles"
            ? "Los Angeles"
            : "Los Angeles";

    const cleanedDistrict =
        district
            ?.trim() ||
        "";

    const streetVariants =
        createStreetVariants(
            cleanedAddress
        );

    /*
     * =====================================
     * 1. STRUCTURED SEARCH
     * =====================================
     */

    for (
        const street
        of streetVariants
        ) {
        const result =
            await searchNominatimStructured(
                street,
                normalizedCity
            );

        if (result) {
            console.log(
                "GEOCODING STRUCTURED MATCH:",
                street,
                normalizedCity
            );

            return result;
        }
    }

    /*
     * =====================================
     * 2. FREE-FORM SEARCH
     * =====================================
     */

    const candidates:
        string[] = [];

    for (
        const street
        of streetVariants
        ) {
        /*
         * Primary LA candidate.
         */
        candidates.push(
            [
                street,
                normalizedCity,
                "CA",
                "United States",
            ]
                .filter(Boolean)
                .join(", ")
        );

        /*
         * Neighborhood candidate.
         *
         * district is kept as the database
         * field name for compatibility, but
         * in the UI it represents an LA
         * neighborhood such as Hollywood,
         * Koreatown or Silver Lake.
         */
        if (cleanedDistrict) {
            candidates.push(
                [
                    street,
                    cleanedDistrict,
                    normalizedCity,
                    "CA",
                    "United States",
                ]
                    .filter(Boolean)
                    .join(", ")
            );
        }
    }

    const uniqueCandidates =
        [
            ...new Set(
                candidates
                    .map(
                        (candidate) =>
                            candidate.trim()
                    )
                    .filter(Boolean)
            ),
        ];

    console.log(
        "GEOCODING CANDIDATES:",
        uniqueCandidates
    );

    for (
        const candidate
        of uniqueCandidates
        ) {
        const result =
            await searchNominatim(
                candidate
            );

        if (result) {
            console.log(
                "GEOCODING MATCH:",
                candidate
            );

            return result;
        }
    }

    /*
     * =====================================
     * 3. STREET-ONLY FALLBACK
     * =====================================
     *
     * OpenStreetMap may know the street
     * but not the exact house number.
     *
     * Example:
     *
     * 6801 Hollywood Blvd
     *
     * becomes:
     *
     * Hollywood Blvd
     */

    const withoutHouseNumber =
        cleanedAddress
            .replace(
                /^\s*\d+[A-Za-z/-]*\s+/u,
                ""
            )
            .trim();

    if (
        withoutHouseNumber &&
        withoutHouseNumber !==
        cleanedAddress
    ) {
        const streetOnlyVariants =
            createStreetVariants(
                withoutHouseNumber
            );

        for (
            const street
            of streetOnlyVariants
            ) {
            const structuredResult =
                await searchNominatimStructured(
                    street,
                    normalizedCity
                );

            if (structuredResult) {
                console.log(
                    "GEOCODING STREET FALLBACK:",
                    street
                );

                return structuredResult;
            }

            const candidate =
                [
                    street,
                    cleanedDistrict,
                    normalizedCity,
                    "CA",
                    "United States",
                ]
                    .filter(Boolean)
                    .join(", ");

            const result =
                await searchNominatim(
                    candidate
                );

            if (result) {
                console.log(
                    "GEOCODING STREET FALLBACK:",
                    candidate
                );

                return result;
            }
        }
    }

    return null;
}

/*
 * =========================================
 * DRIVING ROUTE
 * =========================================
 */

async function getDrivingRoute(params: {
    startLatitude: number;
    startLongitude: number;

    endLatitude: number;
    endLongitude: number;
}) {
    const {
        startLatitude,
        startLongitude,

        endLatitude,
        endLongitude,
    } = params;

    /*
     * OSRM expects:
     *
     * longitude,latitude
     *
     * NOT:
     * latitude,longitude
     */
    const coordinates =
        `${startLongitude},${startLatitude};` +
        `${endLongitude},${endLatitude}`;

    const searchParams =
        new URLSearchParams({
            overview:
                "full",

            geometries:
                "geojson",

            steps:
                "false",
        });

    const response =
        await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?${searchParams.toString()}`,
            {
                method:
                    "GET",

                headers: {
                    Accept:
                        "application/json",
                },

                cache:
                    "no-store",
            }
        );

    if (!response.ok) {
        console.error(
            "OSRM ERROR:",
            response.status,
            response.statusText
        );

        throw new Error(
            "Could not calculate delivery route."
        );
    }

    const data =
        (await response.json()) as {
            code?: string;

            message?: string;

            routes?: Array<{
                distance: number;
                duration: number;

                geometry: {
                    coordinates:
                        [number, number][];
                };
            }>;
        };

    const route =
        data.routes?.[0];

    if (
        data.code !==
        "Ok" ||
        !route
    ) {
        console.error(
            "OSRM ROUTE ERROR:",
            data
        );

        throw new Error(
            "No driving route was found for this address."
        );
    }

    /*
     * OSRM:
     *
     * distance = meters
     * duration = seconds
     */

    const distanceMiles =
        Math.round(
            (
                route.distance /
                1609.344
            ) * 10
        ) / 10;

    /*
     * Temporary km value so the existing
     * Checkout component keeps compiling
     * until we switch its text to miles.
     */
    const distanceKm =
        Math.round(
            (
                route.distance /
                1000
            ) * 10
        ) / 10;

    const driveMinutes =
        Math.max(
            1,

            Math.ceil(
                route.duration /
                60
            )
        );

    /*
     * GeoJSON:
     * [longitude, latitude]
     *
     * Leaflet:
     * [latitude, longitude]
     */
    const geometry =
        route.geometry.coordinates.map(
            (
                [
                    longitude,
                    latitude,
                ]
            ) =>
                [
                    latitude,
                    longitude,
                ] as [
                    number,
                    number,
                ]
        );

    return {
        distanceMiles,
        distanceKm,
        driveMinutes,
        geometry,
    };
}

/*
 * =========================================
 * BUILD DELIVERY PREVIEW
 * =========================================
 */

export async function buildDeliveryPreview(params: {
    items: CartItemInput[];

    address: string;
    city?: string;
    district?: string;
}): Promise<DeliveryPreview> {
    const {
        items,
        address,
        district,
    } = params;

    /*
     * Foodly is Los Angeles only.
     */
    const city =
        "Los Angeles";

    /*
     * =====================================
     * VALIDATE CART
     * =====================================
     */

    if (!items.length) {
        throw new Error(
            "Your basket is empty."
        );
    }

    const validItems =
        items.filter(
            (item) =>
                Number.isInteger(
                    item.productId
                ) &&
                item.productId >
                0 &&
                Number.isInteger(
                    item.quantity
                ) &&
                item.quantity >
                0
        );

    if (
        validItems.length !==
        items.length
    ) {
        throw new Error(
            "One or more basket items are invalid."
        );
    }

    /*
     * =====================================
     * PRODUCT IDS
     * =====================================
     */

    const productIds =
        [
            ...new Set(
                validItems.map(
                    (item) =>
                        item.productId
                )
            ),
        ];

    /*
     * =====================================
     * LOAD PRODUCTS + RESTAURANTS
     * =====================================
     */

    const products =
        await prisma.product.findMany({
            where: {
                id: {
                    in:
                    productIds,
                },

                isActive:
                    true,

                isAvailable:
                    true,
            },

            select: {
                id:
                    true,

                restaurant: {
                    select: {
                        id:
                            true,

                        name:
                            true,

                        latitude:
                            true,

                        longitude:
                            true,

                        deliveryMinMinutes:
                            true,

                        deliveryMaxMinutes:
                            true,

                        isActive:
                            true,

                        isAcceptingOrders:
                            true,
                    },
                },
            },
        });

    if (
        products.length !==
        productIds.length
    ) {
        throw new Error(
            "One or more products are unavailable."
        );
    }

    /*
     * =====================================
     * DISPLAY ADDRESS
     * =====================================
     */

    const fullAddress =
        [
            address.trim(),

            district
                ?.trim(),

            city,

            "CA",
        ]
            .filter(Boolean)
            .filter(
                (
                    value,
                    index,
                    array
                ) =>
                    array.findIndex(
                        (candidate) =>
                            candidate
                                ?.toLowerCase() ===
                            value
                                ?.toLowerCase()
                    ) === index
            )
            .join(", ");

    /*
     * =====================================
     * GEOCODE CUSTOMER
     * =====================================
     */

    const deliveryPoint =
        await geocodeAddress({
            address,

            city,

            district,
        });

    if (!deliveryPoint) {
        throw new Error(
            "We could not find this Los Angeles delivery address. Check the street and building number and try again."
        );
    }

    /*
     * =====================================
     * UNIQUE RESTAURANTS
     * =====================================
     */

    const restaurantsMap =
        new Map<
            number,
            {
                id: number;

                name: string;

                latitude: number;
                longitude: number;

                deliveryMinMinutes:
                    number;

                deliveryMaxMinutes:
                    number;
            }
        >();

    for (
        const product
        of products
        ) {
        const restaurant =
            product.restaurant;

        if (
            !restaurant.isActive ||
            !restaurant
                .isAcceptingOrders
        ) {
            throw new Error(
                `${restaurant.name} is not accepting orders right now.`
            );
        }

        if (
            restaurant.latitude ==
            null ||
            restaurant.longitude ==
            null
        ) {
            throw new Error(
                `${restaurant.name} does not have map coordinates configured.`
            );
        }

        if (
            !Number.isFinite(
                restaurant.latitude
            ) ||
            !Number.isFinite(
                restaurant.longitude
            )
        ) {
            throw new Error(
                `${restaurant.name} has invalid map coordinates.`
            );
        }

        if (
            !isInsideLosAngelesBounds(
                restaurant.latitude,
                restaurant.longitude
            )
        ) {
            throw new Error(
                `${restaurant.name} has coordinates outside the Los Angeles delivery area.`
            );
        }

        restaurantsMap.set(
            restaurant.id,
            {
                id:
                restaurant.id,

                name:
                restaurant.name,

                latitude:
                restaurant.latitude,

                longitude:
                restaurant.longitude,

                deliveryMinMinutes:
                restaurant
                    .deliveryMinMinutes,

                deliveryMaxMinutes:
                restaurant
                    .deliveryMaxMinutes,
            }
        );
    }

    if (
        restaurantsMap.size ===
        0
    ) {
        throw new Error(
            "No restaurant was found for this order."
        );
    }

    /*
     * =====================================
     * CALCULATE ROUTES
     * =====================================
     */

    const restaurants =
        await Promise.all(
            Array.from(
                restaurantsMap.values()
            ).map(
                async (
                    restaurant
                ): Promise<DeliveryRestaurantRoute> => {
                    const route =
                        await getDrivingRoute({
                            startLatitude:
                            restaurant.latitude,

                            startLongitude:
                            restaurant.longitude,

                            endLatitude:
                            deliveryPoint.latitude,

                            endLongitude:
                            deliveryPoint.longitude,
                        });

                    const minPreparation =
                        Math.max(
                            0,
                            restaurant
                                .deliveryMinMinutes
                        );

                    const maxPreparation =
                        Math.max(
                            minPreparation,
                            restaurant
                                .deliveryMaxMinutes
                        );

                    const preparationMinutes =
                        Math.round(
                            (
                                minPreparation +
                                maxPreparation
                            ) / 2
                        );

                    const estimatedDeliveryMinutes =
                        preparationMinutes +
                        route.driveMinutes;

                    return {
                        restaurantId:
                        restaurant.id,

                        restaurantName:
                        restaurant.name,

                        latitude:
                        restaurant.latitude,

                        longitude:
                        restaurant.longitude,

                        distanceMiles:
                        route.distanceMiles,

                        distanceKm:
                        route.distanceKm,

                        driveMinutes:
                        route.driveMinutes,

                        estimatedDeliveryMinutes,

                        geometry:
                        route.geometry,
                    };
                }
            )
        );

    /*
     * =====================================
     * TOTAL DISTANCE
     * =====================================
     */

    const totalDistanceMiles =
        Math.round(
            restaurants.reduce(
                (
                    total,
                    restaurant
                ) =>
                    total +
                    restaurant
                        .distanceMiles,

                0
            ) * 10
        ) / 10;

    /*
     * Temporary compatibility value.
     */
    const totalDistanceKm =
        Math.round(
            restaurants.reduce(
                (
                    total,
                    restaurant
                ) =>
                    total +
                    restaurant
                        .distanceKm,

                0
            ) * 10
        ) / 10;

    /*
     * =====================================
     * MAX ETA
     * =====================================
     */

    const maxEstimatedDeliveryMinutes =
        Math.max(
            ...restaurants.map(
                (
                    restaurant
                ) =>
                    restaurant
                        .estimatedDeliveryMinutes
            )
        );

    /*
     * =====================================
     * RESPONSE
     * =====================================
     */

    return {
        delivery: {
            address:
            fullAddress,

            latitude:
            deliveryPoint.latitude,

            longitude:
            deliveryPoint.longitude,
        },

        restaurants,

        totalDistanceMiles,

        totalDistanceKm,

        maxEstimatedDeliveryMinutes,
    };
}
