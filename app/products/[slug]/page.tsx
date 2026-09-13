import {
    notFound,
} from "next/navigation";

import {
    prisma,
} from "@/lib/prisma";
import Product from "@/components/product/Product";


type Props = {
    params: Promise<{
        slug: string;
    }>;
};

import type {
    Metadata,
} from "next";


export async function generateMetadata({params,}: Props): Promise<Metadata> {
    const {
        slug,
    } = await params;

    const product =
        await prisma.product.findFirst({
            where: {
                slug,
                isActive: true,
            },

            select: {
                name: true,
                description: true,
            },
        });

    if (!product) {
        return {
            title:
                "Product not found | Foodly",
        };
    }

    return {
        title:
            `${product.name} | Foodly`,

        description:
            product.description ||
            `Order ${product.name} on Foodly.`,
    };
}


export default async function ProductPage({
                                              params,
                                          }: Props) {
    const {
        slug,
    } = await params;

    const product =
        await prisma.product.findFirst({
            where: {
                slug,
                isActive: true,

                restaurant: {
                    isActive: true,
                },
            },

            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                currency: true,
                imageUrl: true,
                ingredients: true,
                allergens: true,
                badge: true,
                ratingAverage: true,
                reviewCount: true,
                isAvailable: true,
                categoryId: true,

                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },

                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        address: true,
                        city: true,
                        logoUrl: true,
                        deliveryMinMinutes: true,
                        deliveryMaxMinutes: true,
                        deliveryFee: true,
                        minimumOrder: true,
                        isAcceptingOrders: true,
                    },
                },
            },
        });

    if (!product) {
        notFound();
    }

    const relatedProducts =
        await prisma.product.findMany({
            where: {
                id: {
                    not: product.id,
                },

                categoryId:
                product.categoryId,

                isActive: true,
                isAvailable: true,

                restaurant: {
                    isActive: true,
                },
            },

            take: 3,

            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                currency: true,
                imageUrl: true,
                ingredients: true,
                allergens: true,
                badge: true,
                ratingAverage: true,
                reviewCount: true,
                isAvailable: true,

                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },

                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        address: true,
                        city: true,
                        logoUrl: true,
                        deliveryMinMinutes: true,
                        deliveryMaxMinutes: true,
                        deliveryFee: true,
                        minimumOrder: true,
                        isAcceptingOrders: true,
                    },
                },
            },
        });

    return (
        <Product
            product={product}
            relatedProducts={
                relatedProducts
            }
        />
    );
}