import { create } from "zustand";
import {
    createJSONStorage,
    persist,
} from "zustand/middleware";

export type CartItem = {
    id: number;
    slug: string;
    name: string;
    price: number;
    imageUrl: string | null;

    restaurantId: number;
    restaurantName: string;

    quantity: number;
};

export type AddCartItem = {
    id: number;
    slug: string;
    name: string;
    price: number;
    imageUrl: string | null;

    restaurantId: number;
    restaurantName: string;
};

type CartStore = {
    items: CartItem[];

    hasHydrated: boolean;

    addItem: (
        item: AddCartItem
    ) => void;

    increaseQuantity: (
        productId: number
    ) => void;

    decreaseQuantity: (
        productId: number
    ) => void;

    removeItem: (
        productId: number
    ) => void;

    clearCart: () => void;

    setHasHydrated: (
        value: boolean
    ) => void;
};

export const useCartStore =
    create<CartStore>()(
        persist(
            (set) => ({
                items: [],

                hasHydrated: false,

                setHasHydrated: (
                    value
                ) =>
                    set({
                        hasHydrated: value,
                    }),

                addItem: (product) =>
                    set((state) => {
                        const existing =
                            state.items.find(
                                (item) =>
                                    item.id ===
                                    product.id
                            );

                        if (existing) {
                            return {
                                items:
                                    state.items.map(
                                        (item) =>
                                            item.id ===
                                            product.id
                                                ? {
                                                    ...item,
                                                    quantity:
                                                        item.quantity +
                                                        1,
                                                }
                                                : item
                                    ),
                            };
                        }

                        return {
                            items: [
                                ...state.items,
                                {
                                    ...product,
                                    quantity: 1,
                                },
                            ],
                        };
                    }),

                increaseQuantity: (
                    productId
                ) =>
                    set((state) => ({
                        items:
                            state.items.map(
                                (item) =>
                                    item.id ===
                                    productId
                                        ? {
                                            ...item,
                                            quantity:
                                                item.quantity +
                                                1,
                                        }
                                        : item
                            ),
                    })),

                decreaseQuantity: (
                    productId
                ) =>
                    set((state) => ({
                        items:
                            state.items
                                .map((item) =>
                                    item.id ===
                                    productId
                                        ? {
                                            ...item,
                                            quantity:
                                                item.quantity -
                                                1,
                                        }
                                        : item
                                )
                                .filter(
                                    (item) =>
                                        item.quantity >
                                        0
                                ),
                    })),

                removeItem: (
                    productId
                ) =>
                    set((state) => ({
                        items:
                            state.items.filter(
                                (item) =>
                                    item.id !==
                                    productId
                            ),
                    })),

                clearCart: () =>
                    set({
                        items: [],
                    }),
            }),

            {
                name: "foodly-cart-v1",

                storage:
                    createJSONStorage(
                        () =>
                            localStorage
                    ),

                partialize: (
                    state
                ) => ({
                    items: state.items,
                }),

                onRehydrateStorage:
                    () => (state) => {
                        state?.setHasHydrated(
                            true
                        );
                    },
            }
        )
    );