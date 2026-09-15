import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getEnv(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} is not configured.`);
    }

    return value;
}

function getR2Client() {
    if (client) {
        return client;
    }

    client = new S3Client({
        region: "auto",
        endpoint: `https://${getEnv(
            "R2_ACCOUNT_ID"
        )}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: getEnv(
                "R2_ACCESS_KEY_ID"
            ),
            secretAccessKey: getEnv(
                "R2_SECRET_ACCESS_KEY"
            ),
        },
    });

    return client;
}

function getBucket() {
    return getEnv("R2_BUCKET_NAME");
}

export async function uploadR2Object(
    key: string,
    body: Buffer,
    contentType: string
) {
    await getR2Client().send(
        new PutObjectCommand({
            Bucket: getBucket(),
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl:
                "public, max-age=31536000, immutable",
        })
    );
}

export async function getR2Object(
    key: string
) {
    return getR2Client().send(
        new GetObjectCommand({
            Bucket: getBucket(),
            Key: key,
        })
    );
}

export async function deleteR2Object(
    key: string
) {
    await getR2Client().send(
        new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: key,
        })
    );
}