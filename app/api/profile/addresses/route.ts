import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

async function getUserId(
    request: NextRequest
) {
    const token =
        getBearerToken(request);

    if (!token) {
        return null;
    }

    const auth =
        await verifyAccessToken(token);

    return auth.userId;
}

export async function GET(
    request: NextRequest
) {
    try {
        const userId =
            await getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const addresses =
            await prisma.address.findMany({
                where: {
                    userId,
                },

                orderBy: [
                    {
                        isDefault: "desc",
                    },
                    {
                        createdAt: "desc",
                    },
                ],
            });

        return NextResponse.json({
            addresses,
        });
    } catch (error) {
        console.error(
            "GET ADDRESSES:",
            error
        );

        return NextResponse.json(
            { message: "Unauthorized." },
            { status: 401 }
        );
    }
}

export async function POST(
    request: NextRequest
) {
    try {
        const userId =
            await getUserId(request);

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 }
            );
        }

        const body =
            await request.json();

        const label =
            typeof body.label === "string"
                ? body.label.trim()
                : "";

        const city =
            typeof body.city === "string"
                ? body.city.trim()
                : "Yerevan";

        const district =
            typeof body.district === "string"
                ? body.district.trim()
                : "";

        const addressLine =
            typeof body.addressLine === "string"
                ? body.addressLine.trim()
                : "";

        const apartment =
            typeof body.apartment === "string"
                ? body.apartment.trim()
                : "";

        const entrance =
            typeof body.entrance === "string"
                ? body.entrance.trim()
                : "";

        const floor =
            typeof body.floor === "string"
                ? body.floor.trim()
                : "";

        const instructions =
            typeof body.instructions === "string"
                ? body.instructions.trim()
                : "";

        const requestedDefault =
            body.isDefault === true;

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

        const address =
            await prisma.$transaction(
                async (tx) => {
                    const count =
                        await tx.address.count({
                            where: {
                                userId,
                            },
                        });

                    const isDefault =
                        count === 0 ||
                        requestedDefault;

                    if (isDefault) {
                        await tx.address.updateMany({
                            where: {
                                userId,
                                isDefault: true,
                            },

                            data: {
                                isDefault: false,
                            },
                        });
                    }

                    return tx.address.create({
                        data: {
                            userId,

                            label:
                                label || null,

                            city:
                                city || "Yerevan",

                            district:
                                district || null,

                            addressLine,

                            apartment:
                                apartment || null,

                            entrance:
                                entrance || null,

                            floor:
                                floor || null,

                            instructions:
                                instructions || null,

                            isDefault,
                        },
                    });
                }
            );

        return NextResponse.json(
            {
                address,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "CREATE ADDRESS:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Unable to create address.",
            },
            {
                status: 500,
            }
        );
    }
}