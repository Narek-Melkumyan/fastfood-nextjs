import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log("🌱 Starting Foodly seed...");

    // =====================================================
    // CATEGORIES
    // =====================================================

    const categoriesData = [
        { name: "Pizza", slug: "pizza", emoji: "🍕", sortOrder: 1 },
        { name: "Burgers", slug: "burgers", emoji: "🍔", sortOrder: 2 },
        { name: "Pasta", slug: "pasta", emoji: "🍝", sortOrder: 3 },
        { name: "Salads", slug: "salads", emoji: "🥗", sortOrder: 4 },
        { name: "Sushi", slug: "sushi", emoji: "🍣", sortOrder: 5 },
        { name: "Wraps", slug: "wraps", emoji: "🌯", sortOrder: 6 },
        { name: "Drinks", slug: "drinks", emoji: "🥤", sortOrder: 7 },
        { name: "Desserts", slug: "desserts", emoji: "🍰", sortOrder: 8 },
    ];

    const categoryMap = new Map<string, number>();

    for (const category of categoriesData) {
        const savedCategory = await prisma.productCategory.upsert({
            where: {
                slug: category.slug,
            },

            update: {
                name: category.name,
                emoji: category.emoji,
                sortOrder: category.sortOrder,
                isActive: true,
            },

            create: {
                name: category.name,
                slug: category.slug,
                emoji: category.emoji,
                sortOrder: category.sortOrder,
                isActive: true,
            },
        });

        categoryMap.set(savedCategory.slug, savedCategory.id);
    }

    console.log("✅ Categories seeded");

    // =====================================================
    // CUISINES
    // =====================================================

    const cuisinesData = [
        { name: "Italian", slug: "italian" },
        { name: "Healthy", slug: "healthy" },
        { name: "Japanese", slug: "japanese" },
        { name: "Burgers", slug: "burgers" },
        { name: "Pizza", slug: "pizza" },
        { name: "Asian", slug: "asian" },
    ];

    const cuisineMap = new Map<string, number>();

    for (const cuisine of cuisinesData) {
        const savedCuisine = await prisma.cuisine.upsert({
            where: {
                slug: cuisine.slug,
            },

            update: {
                name: cuisine.name,
            },

            create: {
                name: cuisine.name,
                slug: cuisine.slug,
            },
        });

        cuisineMap.set(savedCuisine.slug, savedCuisine.id);
    }

    console.log("✅ Cuisines seeded");

    // =====================================================
    // RESTAURANTS
    // =====================================================

    const restaurantsData = [
        {
            name: "La Pasta Yerevan",
            slug: "la-pasta-yerevan",

            description:
                "Fresh pasta, pizza and Italian classics made to order.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop",

            address: "Northern Avenue 12, Yerevan",
            city: "Yerevan",

            foundedYear: 2014,

            deliveryMinMinutes: 25,
            deliveryMaxMinutes: 35,

            deliveryFee: 500,
            minimumOrder: 2000,
            freeDeliveryFrom: 8000,

            ratingAverage: 4.8,
            reviewCount: 126,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["italian"],
        },

        {
            name: "Green Bowl",
            slug: "green-bowl",

            description:
                "Fresh salads, healthy bowls and light meals.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",

            address: "Yerevan",
            city: "Yerevan",

            deliveryMinMinutes: 20,
            deliveryMaxMinutes: 30,

            deliveryFee: 500,

            ratingAverage: 4.6,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["healthy"],
        },

        {
            name: "Tokyo Ramen House",
            slug: "tokyo-ramen-house",

            description:
                "Japanese comfort food, ramen and sushi.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=800&auto=format&fit=crop",

            address: "Yerevan",
            city: "Yerevan",

            deliveryMinMinutes: 30,
            deliveryMaxMinutes: 40,

            deliveryFee: 500,

            ratingAverage: 4.9,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["japanese"],
        },

        {
            name: "Smash & Co.",
            slug: "smash-and-co",

            description:
                "Smash burgers, fries and classic comfort food.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",

            address: "Yerevan",
            city: "Yerevan",

            deliveryMinMinutes: 20,
            deliveryMaxMinutes: 30,

            deliveryFee: 500,

            ratingAverage: 4.5,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["burgers"],
        },

        {
            name: "Nolita Pizza",
            slug: "nolita-pizza",

            description:
                "Wood-fired pizzas with classic and modern toppings.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",

            address: "Yerevan",
            city: "Yerevan",

            deliveryMinMinutes: 25,
            deliveryMaxMinutes: 35,

            deliveryFee: 500,

            ratingAverage: 4.7,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["pizza", "italian"],
        },

        {
            name: "Spice Route",
            slug: "spice-route",

            description:
                "Asian-inspired dishes with bold spices and flavors.",

            coverImageUrl:
                "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=800&auto=format&fit=crop",

            address: "Yerevan",
            city: "Yerevan",

            deliveryMinMinutes: 35,
            deliveryMaxMinutes: 45,

            deliveryFee: 500,

            ratingAverage: 4.4,

            isAcceptingOrders: true,
            isActive: true,

            cuisines: ["asian"],
        },
    ];

    const restaurantMap = new Map<string, number>();

    for (const restaurantData of restaurantsData) {
        const {
            cuisines,
            ...restaurant
        } = restaurantData;

        const cuisineConnections = cuisines.map((slug) => {
            const id = cuisineMap.get(slug);

            if (!id) {
                throw new Error(`Cuisine not found: ${slug}`);
            }

            return { id };
        });

        const savedRestaurant = await prisma.restaurant.upsert({
            where: {
                slug: restaurant.slug,
            },

            update: {
                ...restaurant,

                cuisines: {
                    set: cuisineConnections,
                },
            },

            create: {
                ...restaurant,

                cuisines: {
                    connect: cuisineConnections,
                },
            },
        });

        restaurantMap.set(
            savedRestaurant.slug,
            savedRestaurant.id
        );
    }

    console.log("✅ Restaurants seeded");

    // =====================================================
    // HELPERS
    // =====================================================

    function getRestaurantId(slug: string) {
        const id = restaurantMap.get(slug);

        if (!id) {
            throw new Error(`Restaurant not found: ${slug}`);
        }

        return id;
    }

    function getCategoryId(slug: string) {
        const id = categoryMap.get(slug);

        if (!id) {
            throw new Error(`Category not found: ${slug}`);
        }

        return id;
    }

    // =====================================================
    // PRODUCTS
    // =====================================================

    const productsData = [
        {
            name: "Margherita",
            slug: "margherita",

            description:
                "Fior di latte, tomato, basil",

            price: 2400,

            imageUrl:
                "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Fior di latte",
                "Tomato",
                "Basil",
            ],

            allergens: [],

            ratingAverage: 4.7,
            reviewCount: 98,

            isFeatured: true,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "pizza",
        },

        {
            name: "Pepperoni",
            slug: "pepperoni",

            description:
                "Spicy pepperoni, mozzarella",

            price: 2900,

            imageUrl:
                "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Pepperoni",
                "Mozzarella",
            ],

            allergens: [],

            ratingAverage: 4.5,
            reviewCount: 76,

            isFeatured: true,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "pizza",
        },

        {
            name: "Carbonara",
            slug: "carbonara",

            description:
                "Guanciale, egg yolk, pecorino",

            price: 2600,

            imageUrl:
                "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Guanciale",
                "Egg yolk",
                "Pecorino",
                "Black pepper",
            ],

            allergens: [],

            badge: "Chef's pick",

            ratingAverage: 4.6,
            reviewCount: 64,

            isFeatured: true,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "pasta",
        },

        {
            name: "Bolognese",
            slug: "bolognese",

            description:
                "Slow-cooked beef ragù, herbs",

            price: 2500,

            imageUrl:
                "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Beef ragù",
                "Italian herbs",
            ],

            allergens: [],

            ratingAverage: 4.2,
            reviewCount: 51,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "pasta",
        },

        {
            name: "Caesar salad",
            slug: "caesar-salad",

            description:
                "Chicken, croutons, caesar dressing",

            price: 1900,

            imageUrl:
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Chicken",
                "Romaine",
                "Croutons",
                "Caesar dressing",
            ],

            allergens: [],

            ratingAverage: 4.3,
            reviewCount: 52,

            isFeatured: true,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "salads",
        },

        {
            name: "Sushi set",
            slug: "sushi-set",

            description:
                "24 pieces, chef's selection",

            price: 3900,

            imageUrl:
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Rice",
                "Fish",
                "Nori",
            ],

            allergens: [],

            ratingAverage: 4.8,
            reviewCount: 120,

            isFeatured: true,

            restaurantSlug: "tokyo-ramen-house",
            categorySlug: "sushi",
        },

        {
            name: "Chicken wrap",
            slug: "chicken-wrap",

            description:
                "Grilled chicken, garlic sauce",

            price: 1400,

            imageUrl:
                "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop",

            ingredients: [
                "Grilled chicken",
                "Garlic sauce",
            ],

            allergens: [],

            ratingAverage: 4.0,
            reviewCount: 33,

            restaurantSlug: "green-bowl",
            categorySlug: "wraps",
        },

        {
            name: "Cola 0.5L",
            slug: "cola-05l",

            description:
                "Chilled soft drink",

            price: 600,

            imageUrl:
                "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?q=80&w=800&auto=format&fit=crop",

            ingredients: [],

            allergens: [],

            ratingAverage: 3.9,
            reviewCount: 18,

            restaurantSlug: "la-pasta-yerevan",
            categorySlug: "drinks",
        },
    ];

    for (const productData of productsData) {
        const {
            restaurantSlug,
            categorySlug,
            ...product
        } = productData;

        const restaurantId =
            getRestaurantId(restaurantSlug);

        const categoryId =
            getCategoryId(categorySlug);

        await prisma.product.upsert({
            where: {
                slug: product.slug,
            },

            update: {
                ...product,

                restaurantId,
                categoryId,

                isActive: true,
                isAvailable: true,
            },

            create: {
                ...product,

                restaurantId,
                categoryId,

                isActive: true,
                isAvailable: true,
            },
        });
    }

    console.log("✅ Products seeded");

    // =====================================================
    // PROMOTIONS
    // =====================================================

    const promotions: Array<{
        title: string;
        slug: string;
        code: string;
        description: string;
        type:
            | "PERCENTAGE"
            | "FIXED_AMOUNT"
            | "FREE_DELIVERY";
        value: number;
        minimumOrder: number;
        newCustomersOnly: boolean;
    }> = [
        {
            title: "10% off",
            slug: "save-10",
            code: "SAVE10",

            description:
                "Get 10% off your order.",

            type: "PERCENTAGE",
            value: 10,

            minimumOrder: 0,
            newCustomersOnly: false,
        },

        {
            title: "Free delivery",
            slug: "free-delivery",
            code: "FREEDEL",

            description:
                "Get free delivery on your order.",

            type: "FREE_DELIVERY",
            value: 0,

            minimumOrder: 0,
            newCustomersOnly: false,
        },

        {
            title: "First delivery free",
            slug: "hello-new-customer",
            code: "HELLO",

            description:
                "Free delivery for new Foodly customers.",

            type: "FREE_DELIVERY",
            value: 0,

            minimumOrder: 0,
            newCustomersOnly: true,
        },
    ];

    for (const promotion of promotions) {
        await prisma.promotion.upsert({
            where: {
                code: promotion.code,
            },

            update: {
                ...promotion,
                isActive: true,
            },

            create: {
                ...promotion,
                isActive: true,
            },
        });
    }

    console.log("✅ Promotions seeded");

    console.log("");
    console.log("🎉 Foodly database seeded successfully!");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:");
        console.error(error);

        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });