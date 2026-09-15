import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export class EmailVerificationCooldownError extends Error {
    retryAfterSeconds: number;

    constructor(retryAfterSeconds: number) {
        super("Please wait before requesting another verification email.");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export function hashEmailVerificationToken(token: string) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

export async function sendEmailVerification(user: {
    id: number;
    email: string;
}) {
    const latestToken = await prisma.emailVerificationToken.findFirst({
        where: {
            userId: user.id,
            usedAt: null,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            createdAt: true,
        },
    });

    if (latestToken) {
        const elapsed = Date.now() - latestToken.createdAt.getTime();

        if (elapsed < RESEND_COOLDOWN_MS) {
            const retryAfterSeconds = Math.ceil(
                (RESEND_COOLDOWN_MS - elapsed) / 1000
            );

            throw new EmailVerificationCooldownError(
                retryAfterSeconds
            );
        }
    }

    await prisma.emailVerificationToken.deleteMany({
        where: {
            userId: user.id,
            usedAt: null,
        },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashEmailVerificationToken(token);

    const expiresAt = new Date(
        Date.now() + TOKEN_LIFETIME_MS
    );

    await prisma.emailVerificationToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
    });

    const appUrl = (
        process.env.APP_URL ||
        "http://localhost:3000"
    ).replace(/\/$/, "");

    const verificationUrl =
        `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESET_EMAIL_FROM;

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured.");
    }

    if (!from) {
        throw new Error("RESET_EMAIL_FROM is not configured.");
    }

    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
        from,
        to: user.email,
        subject: "Verify your Foodly email",
        html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#171717;">
        <h1 style="font-size:28px;margin-bottom:16px;">
          Verify your email
        </h1>

        <p style="font-size:16px;line-height:1.6;color:#555;">
          Thanks for creating your Foodly account.
          Please verify your email address to confirm that this email belongs to you.
        </p>

        <div style="margin:32px 0;">
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              background:#ff5722;
              color:#ffffff;
              text-decoration:none;
              padding:14px 24px;
              border-radius:12px;
              font-weight:700;
            "
          >
            Verify email
          </a>
        </div>

        <p style="font-size:14px;color:#777;">
          This verification link expires in 24 hours.
        </p>

        <p style="font-size:14px;color:#777;">
          If you did not create this Foodly account, you can ignore this email.
        </p>
      </div>
    `,
    });

    if (result.error) {
        await prisma.emailVerificationToken.deleteMany({
            where: {
                tokenHash,
            },
        });

        throw new Error(
            result.error.message || "Could not send verification email."
        );
    }

    return {
        expiresAt,
    };
}