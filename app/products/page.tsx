import { prisma } from "@/lib/prisma";
import Products from "@/components/products/Products";

export default async function ProductsPage() {
    const products =
        await prisma.product.findMany({
            where: {
                isActive: true,
                isAvailable: true,

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
                imageUrl: true,
                badge: true,
                ratingAverage: true,
                reviewCount: true,

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
                        deliveryMinMinutes: true,
                        deliveryMaxMinutes: true,
                        isAcceptingOrders: true,
                    },
                },
            },

            orderBy: [
                {
                    isFeatured: "desc",
                },

                {
                    sortOrder: "asc",
                },

                {
                    id: "asc",
                },
            ],
        });

    return (
        <Products products={products} />
    );
}