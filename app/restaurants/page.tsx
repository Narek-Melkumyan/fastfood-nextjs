import Restaurants from "@/components/restaurants/Restaurants";
import { prisma } from "@/lib/prisma";

export default async function RestaurantsPage() {
    const restaurants = await prisma.restaurant.findMany({
        where: {
            isActive: true,
        },
        include: {
            cuisines: true,
        },
        orderBy: {
            ratingAverage: "desc",
        },
    });

    return <Restaurants restaurants={restaurants} />;
}