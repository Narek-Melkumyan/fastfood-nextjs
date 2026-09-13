import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

async function getAuthUser(
    request: NextRequest
) {
    const token =
        getBearerToken(request);

    if (!token) {
        return null;
    }

    return verifyAccessToken(token);
}

export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const auth =
            await getAuthUser(request);

        if (!auth) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const { id } =
            await context.params;

        const addressId =
            Number(id);

        const address =
            await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId: auth.userId,
                },
            });

        if (!address) {
            return NextResponse.json(
                {
                    message:
                        "Address not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const body =
            await request.json();

        const addressLine =
            typeof body.addressLine ===
            "string"
                ? body.addressLine.trim()
                : address.addressLine;

        if (!addressLine) {
            return NextResponse.json(
                {
                    message:
                        "Address is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const isDefault =
            body.isDefault === true;

        const updated =
            await prisma.$transaction(
                async (tx) => {
                    if (isDefault) {
                        await tx.address.updateMany({
                            where: {
                                userId:
                                auth.userId,

                                id: {
                                    not: addressId,
                                },
                            },

                            data: {
                                isDefault: false,
                            },
                        });
                    }

                    return tx.address.update({
                        where: {
                            id: addressId,
                        },

                        data: {
                            label:
                                typeof body.label ===
                                "string"
                                    ? body.label.trim() ||
                                    null
                                    : address.label,

                            city:
                                typeof body.city ===
                                "string"
                                    ? body.city.trim() ||
                                    "Yerevan"
                                    : address.city,

                            district:
                                typeof body.district ===
                                "string"
                                    ? body.district.trim() ||
                                    null
                                    : address.district,

                            addressLine,

                            apartment:
                                typeof body.apartment ===
                                "string"
                                    ? body.apartment.trim() ||
                                    null
                                    : address.apartment,

                            entrance:
                                typeof body.entrance ===
                                "string"
                                    ? body.entrance.trim() ||
                                    null
                                    : address.entrance,

                            floor:
                                typeof body.floor ===
                                "string"
                                    ? body.floor.trim() ||
                                    null
                                    : address.floor,

                            instructions:
                                typeof body.instructions ===
                                "string"
                                    ? body.instructions.trim() ||
                                    null
                                    : address.instructions,

                            isDefault:
                                isDefault
                                    ? true
                                    : address.isDefault,
                        },
                    });
                }
            );

        return NextResponse.json({
            address: updated,
        });
    } catch (error) {
        console.error(
            "UPDATE ADDRESS:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to update address.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const auth =
            await getAuthUser(request);

        if (!auth) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const { id } =
            await context.params;

        const addressId =
            Number(id);

        const address =
            await prisma.address.findFirst({
                where: {
                    id: addressId,
                    userId: auth.userId,
                },
            });

        if (!address) {
            return NextResponse.json(
                {
                    message:
                        "Address not found.",
                },
                {
                    status: 404,
                }
            );
        }

        await prisma.$transaction(
            async (tx) => {
                await tx.address.delete({
                    where: {
                        id: address.id,
                    },
                });

                if (address.isDefault) {
                    const nextAddress =
                        await tx.address.findFirst({
                            where: {
                                userId:
                                auth.userId,
                            },

                            orderBy: {
                                createdAt: "asc",
                            },
                        });

                    if (nextAddress) {
                        await tx.address.update({
                            where: {
                                id: nextAddress.id,
                            },

                            data: {
                                isDefault: true,
                            },
                        });
                    }
                }
            }
        );

        return NextResponse.json({
            message: "Address deleted.",
        });
    } catch (error) {
        console.error(
            "DELETE ADDRESS:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to delete address.",
            },
            {
                status: 500,
            }
        );
    }
}