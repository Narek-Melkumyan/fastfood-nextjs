import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/adminAuth";
import {
    getImageFolder,
    isAdminImageKind,
    optimizeAdminImage,
} from "@/lib/imageProcessing";
import { isAllowedMediaKey, mediaUrl } from "@/lib/media";
import {
    deleteR2Object,
    uploadR2Object,
} from "@/lib/r2";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
];

export async function POST(request: Request) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const formData = await request.formData();

        const file = formData.get("file");
        const kind = String(formData.get("kind") || "");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Image is required." },
                { status: 400 }
            );
        }

        if (!isAdminImageKind(kind)) {
            return NextResponse.json(
                { error: "Invalid image type." },
                { status: 400 }
            );
        }

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error:
                        "Only JPG, PNG, WebP and AVIF images are allowed.",
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error:
                        "Image must be smaller than 10 MB.",
                },
                { status: 400 }
            );
        }

        const input = Buffer.from(
            await file.arrayBuffer()
        );

        const image = await optimizeAdminImage(
            input,
            kind
        );

        const folder = getImageFolder(kind);

        const key = `${folder}/${randomUUID()}.webp`;

        await uploadR2Object(
            key,
            image.buffer,
            "image/webp"
        );

        return NextResponse.json(
            {
                key,
                url: mediaUrl(key),
                width: image.width,
                height: image.height,
                size: image.size,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "ADMIN MEDIA UPLOAD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error: "Could not upload image.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const admin = await getAdminFromRequest(request);

        if (!admin) {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const key = String(body.key || "");

        if (!isAllowedMediaKey(key)) {
            return NextResponse.json(
                { error: "Invalid media key." },
                { status: 400 }
            );
        }

        await deleteR2Object(key);

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "ADMIN MEDIA DELETE ERROR:",
            error
        );

        return NextResponse.json(
            {
                error: "Could not delete image.",
            },
            { status: 500 }
        );
    }
}