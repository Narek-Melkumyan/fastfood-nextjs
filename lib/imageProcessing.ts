import sharp from "sharp";

export type AdminImageKind =
    | "product"
    | "restaurant-logo"
    | "restaurant-cover"
    | "promotion";

const imageSettings = {
    product: {
        width: 1200,
        height: 800,
        quality: 82,
        folder: "products",
    },
    "restaurant-logo": {
        width: 512,
        height: 512,
        quality: 85,
        folder: "restaurants/logos",
    },
    "restaurant-cover": {
        width: 1600,
        height: 900,
        quality: 82,
        folder: "restaurants/covers",
    },
    promotion: {
        width: 1400,
        height: 700,
        quality: 82,
        folder: "promotions",
    },
} satisfies Record<
    AdminImageKind,
    {
        width: number;
        height: number;
        quality: number;
        folder: string;
    }
>;

export function isAdminImageKind(
    value: string
): value is AdminImageKind {
    return value in imageSettings;
}

export function getImageFolder(
    kind: AdminImageKind
) {
    return imageSettings[kind].folder;
}

export async function optimizeAdminImage(
    input: Buffer,
    kind: AdminImageKind
) {
    const settings = imageSettings[kind];

    const { data, info } = await sharp(input, {
        failOn: "error",
        limitInputPixels: 40_000_000,
    })
        .rotate()
        .resize({
            width: settings.width,
            height: settings.height,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({
            quality: settings.quality,
            effort: 4,
        })
        .toBuffer({
            resolveWithObject: true,
        });

    return {
        buffer: data,
        width: info.width,
        height: info.height,
        size: info.size,
    };
}