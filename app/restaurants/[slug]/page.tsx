import {
    notFound,
} from "next/navigation";

import { prisma } from "@/lib/prisma";

import Restaurant from "@/components/restaurant/Restaurant";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function RestaurantPage({
                                                 params,
                                             }: Props) {
    const { slug } =
        await params;

    const restaurant =
        await prisma.restaurant.findUnique(
            {
                where: {
                    slug,
                },

                include: {
                    cuisines: true,

                    hours: {
                        orderBy: {
                            id: "asc",
                        },
                    },

                    products: {
                        where: {
                            isActive: true,
                            isAvailable: true,
                        },

                        include: {
                            category: true,
                        },

                        orderBy: [
                            {
                                sortOrder:
                                    "asc",
                            },

                            {
                                id: "asc",
                            },
                        ],
                    },
                },
            }
        );

    if (
        !restaurant ||
        !restaurant.isActive
    ) {
        notFound();
    }

    return (
        <Restaurant
            restaurant={
                restaurant
            }
        />
    );
}