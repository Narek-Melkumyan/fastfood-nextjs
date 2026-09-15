import VerifyEmailClient from "@/components/auth/VerifyEmailClient";

type Props = {
    searchParams: Promise<{
        token?: string | string[];
    }>;
};

export default async function VerifyEmailPage({
                                                  searchParams,
                                              }: Props) {
    const params = await searchParams;

    const token = Array.isArray(params.token)
        ? params.token[0] || ""
        : params.token || "";

    return <VerifyEmailClient token={token} />;
}