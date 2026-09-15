const allowedPrefixes = [
    "products/",
    "restaurants/logos/",
    "restaurants/covers/",
    "promotions/",
];

export function isAllowedMediaKey(
    key: string
) {
    if (
        !key ||
        key.includes("..")
    ) {
        return false;
    }

    return allowedPrefixes.some(
        (prefix) =>
            key.startsWith(prefix)
    );
}

export function mediaUrl(
    key: string
) {
    const encodedKey = key
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    return `/api/media/${encodedKey}`;
}

export function mediaKeyFromUrl(
    url: string
) {
    const prefix =
        "/api/media/";

    if (!url.startsWith(prefix)) {
        return null;
    }

    try {
        const encodedKey =
            url.slice(prefix.length);

        const key = encodedKey
            .split("/")
            .map(decodeURIComponent)
            .join("/");

        return isAllowedMediaKey(key)
            ? key
            : null;
    } catch {
        return null;
    }
}