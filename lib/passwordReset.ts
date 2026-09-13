import {
    createHash,
    randomBytes,
} from "crypto";

const RESET_TOKEN_MINUTES = 15;

function getPepper() {
    const pepper =
        process.env
            .PASSWORD_RESET_PEPPER;

    if (!pepper) {
        throw new Error(
            "PASSWORD_RESET_PEPPER is not configured."
        );
    }

    return pepper;
}

export function createPasswordResetToken() {
    return randomBytes(16)
        .toString("hex")
        .toUpperCase();
}


export function hashPasswordResetToken(
    token: string
) {
    return createHash("sha256")
        .update(
            `${token.trim().toUpperCase()}:${getPepper()}`
        )
        .digest("hex");
}

export function getPasswordResetExpiration() {
    return new Date(
        Date.now() +
        RESET_TOKEN_MINUTES *
        60 *
        1000
    );
}