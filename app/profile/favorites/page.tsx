"use client";

import {
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";
import ProfileNav from "@/components/profile/ProfileNav";

type FavoriteItem =
    Record<string, unknown>;

function text(
    value: unknown
) {
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    return "";
}

export default function FavoritesPage() {
    const router =
        useRouter();

    const {
        user,
        loading: authLoading,
        apiFetch,
    } = useAuth();

    const [
        favorites,
        setFavorites,
    ] =
        useState<FavoriteItem[]>([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        async function load() {
            try {
                const response =
                    await apiFetch(
                        "/api/profile/favorites"
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                setFavorites(
                    Array.isArray(
                        data.favorites
                    )
                        ? data.favorites
                        : []
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [
        authLoading,
        user,
        apiFetch,
        router,
    ]);

    if (
        loading ||
        authLoading
    ) {
        return (
            <main className="container py-5">
                Loading favorites...
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="py-5">
            <div className="container">

        <span className="eyebrow">
          My account
        </span>

                <h1 className="display-md mb-2">
                    Favorites
                </h1>

                <p className="muted mb-4">
                    Restaurants and dishes you have
                    saved.
                </p>

                <ProfileNav />

                {favorites.length ===
                0 ? (
                    <div
                        className="card border-0 shadow-sm"
                        style={{
                            borderRadius:
                                "24px",
                        }}
                    >
                        <div className="card-body p-5 text-center">

                            <div
                                className="mb-3"
                                style={{
                                    fontSize: "2rem",
                                }}
                            >
                                ♡
                            </div>

                            <h2 className="h4">
                                No favorites yet
                            </h2>

                            <p className="muted mb-0">
                                Save restaurants or dishes
                                and they will appear here.
                            </p>

                        </div>
                    </div>
                ) : (
                    <div className="row g-3">

                        {favorites.map(
                            (
                                favorite,
                                index
                            ) => {
                                const id =
                                    text(
                                        favorite.id
                                    ) ||
                                    String(index);

                                const title =
                                    text(
                                        favorite.name ??
                                        favorite.title
                                    ) ||
                                    (
                                        favorite.productId
                                            ? `Product #${favorite.productId}`
                                            : favorite.restaurantId
                                                ? `Restaurant #${favorite.restaurantId}`
                                                : `Favorite ${index + 1}`
                                    );

                                return (
                                    <div
                                        className="col-md-6 col-lg-4"
                                        key={id}
                                    >
                                        <div
                                            className="card border-0 shadow-sm h-100"
                                            style={{
                                                borderRadius:
                                                    "20px",
                                            }}
                                        >
                                            <div className="card-body p-4">

                                                <div
                                                    className="mb-3"
                                                    style={{
                                                        fontSize:
                                                            "1.7rem",
                                                    }}
                                                >
                                                    ❤️
                                                </div>

                                                <h2 className="h5 mb-0">
                                                    {title}
                                                </h2>

                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>
        </main>
    );
}