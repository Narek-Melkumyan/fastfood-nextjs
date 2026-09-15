import { NextResponse } from "next/server";

import { isAllowedMediaKey } from "@/lib/media";
import { getR2Object } from "@/lib/r2";

type Props = {
    params: Promise<{
        key: string[];
    }>;
};

export async function GET(
    _request: Request,
    { params }: Props
) {
    try {
        const { key } = await params;
        const objectKey = key.join("/");

        console.log("MEDIA KEY:", objectKey);

        if (!isAllowedMediaKey(objectKey)) {
            return NextResponse.json(
                { error: "Invalid media key." },
                { status: 400 }
            );
        }

        const object = await getR2Object(
            objectKey
        );

        if (!object.Body) {
            return NextResponse.json(
                { error: "Image not found." },
                { status: 404 }
            );
        }

        const bytes =
            await object.Body.transformToByteArray();

        return new Response(
            Buffer.from(bytes),
            {
                status: 200,
                headers: {
                    "Content-Type":
                        object.ContentType ||
                        "image/webp",

                    "Cache-Control":
                        "public, max-age=31536000, immutable",
                },
            }
        );
    } catch (error) {
        console.error(
            "MEDIA GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                error: "Could not load image.",
            },
            {
                status: 500,
            }
        );
    }
}