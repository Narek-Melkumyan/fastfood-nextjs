import {
    NextResponse,
} from "next/server";

import {
    Resend,
} from "resend";

import {
    prisma,
} from "@/lib/prisma";

import {
    createPasswordResetToken,
    getPasswordResetExpiration,
    hashPasswordResetToken,
} from "@/lib/passwordReset";

const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );

type ForgotPasswordBody = {
    email?: string;
};

function validEmail(
    email: string
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

export async function POST(
    request: Request
) {
    try {
        /*
         * =====================================
         * BODY
         * =====================================
         */

        const body =
            (await request.json()) as
                ForgotPasswordBody;

        const email =
            body.email
                ?.trim()
                .toLowerCase();

        if (
            !email ||
            !validEmail(email)
        ) {
            return NextResponse.json(
                {
                    error:
                        "Enter a valid email address.",
                },
                {
                    status: 400,
                }
            );
        }

        

        const user =
            await prisma.user.findUnique({
                where: {
                    email,
                },

                select: {
                    id: true,
                    email: true,
                    isActive: true,
                },
            });



        if (
            !user ||
            !user.isActive
        ) {
            return NextResponse.json({
                success: true,

                message:
                    "If an account exists with that email, a reset token has been sent.",
            });
        }



        const token =
            createPasswordResetToken();

        const tokenHash =
            hashPasswordResetToken(
                token
            );

        const expiresAt =
            getPasswordResetExpiration();



        await prisma
            .passwordResetToken
            .deleteMany({
                where: {
                    userId:
                    user.id,
                },
            });


        const resetRecord =
            await prisma
                .passwordResetToken
                .create({
                    data: {
                        userId:
                        user.id,

                        tokenHash,

                        expiresAt,
                    },
                });



        const from =
            process.env
                .RESET_EMAIL_FROM ||
            "Foodly <onboarding@resend.dev>";

        const {
            error,
        } =
            await resend.emails.send({
                from,

                to: [
                    user.email,
                ],

                subject:
                    "Reset your Foodly password",

                html: `
          <div style="
            max-width:560px;
            margin:0 auto;
            padding:32px;
            font-family:Arial,sans-serif;
            color:#111827;
          ">

            <h1 style="
              margin:0 0 16px;
              font-size:26px;
            ">
              Reset your password
            </h1>

            <p style="
              color:#6b7280;
              line-height:1.6;
            ">
              We received a request to reset
              your Foodly password.
            </p>

            <p style="
              color:#6b7280;
              line-height:1.6;
            ">
              Enter this one-time token on
              the password reset page:
            </p>

            <div style="
              margin:28px 0;
              padding:18px;
              background:#f3f4f6;
              border-radius:12px;
              text-align:center;
              font-size:20px;
              font-weight:700;
              letter-spacing:2px;
              word-break:break-all;
            ">
              ${token}
            </div>

            <p style="
              color:#6b7280;
              line-height:1.6;
            ">
              This token expires in
              <strong>15 minutes</strong>.
            </p>

            <p style="
              color:#6b7280;
              line-height:1.6;
            ">
              If you didn't request a password
              reset, you can safely ignore
              this email.
            </p>

            <hr style="
              margin:28px 0;
              border:0;
              border-top:1px solid #e5e7eb;
            " />

            <p style="
              color:#9ca3af;
              font-size:13px;
            ">
              Foodly Security
            </p>

          </div>
        `,
            });



        if (error) {
            console.error(
                "RESET EMAIL ERROR:",
                error
            );

            await prisma
                .passwordResetToken
                .delete({
                    where: {
                        id:
                        resetRecord.id,
                    },
                });

            return NextResponse.json(
                {
                    error:
                        "Could not send the reset email. Please try again.",
                },
                {
                    status: 500,
                }
            );
        }



        return NextResponse.json({
            success: true,

            message:
                "If an account exists with that email, a reset token has been sent.",
        });
    } catch (error) {
        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Could not process the password reset request.",
            },
            {
                status: 500,
            }
        );
    }
}