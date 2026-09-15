import Home from "@/components/home/Home";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            isAvailable: true,
            restaurant: {
                isActive: true,
            },
        },
        orderBy: [
            { isFeatured: "desc" },
            { ratingAverage: "desc" },
            { createdAt: "desc" },
        ],
        take: 4,
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            badge: true,
            ratingAverage: true,
            isAvailable: true,
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    deliveryMinMinutes: true,
                    deliveryMaxMinutes: true,
                    isAcceptingOrders: true,
                },
            },
        },
    });

    return <Home products={products} />;
}