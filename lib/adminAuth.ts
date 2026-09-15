import {
    getBearerToken,
    verifyAccessToken,
} from "@/lib/auth";

import {
    prisma,
} from "@/lib/prisma";

export async function getAdminFromRequest(
    request: Request
) {
    const token = getBearerToken(request);

    if (!token) {
        return null;
    }

    try {
        const auth =
            await verifyAccessToken(token);

        const admin =
            await prisma.user.findFirst({
                where: {
                    id: auth.userId,
                    role: "ADMIN",
                    isActive: true,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });

        return admin;
    } catch {
        return null;
    }
}