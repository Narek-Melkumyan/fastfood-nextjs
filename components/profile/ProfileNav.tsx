"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    {
        href: "/profile",
        label: "Overview",
    },
    {
        href: "/profile/orders",
        label: "Orders",
    },
    {
        href: "/profile/addresses",
        label: "Addresses",
    },
    {
        href: "/profile/favorites",
        label: "Favorites",
    },
    {
        href: "/profile/edit",
        label: "Edit info",
    },
];

export default function ProfileNav() {
    const pathname = usePathname();

    return (
        <div
            className="d-flex flex-wrap gap-2 mb-4"
        >
            {links.map((link) => {
                const active =
                    link.href === "/profile"
                        ? pathname === "/profile"
                        : pathname.startsWith(link.href);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={
                            active
                                ? "btn btn-brand"
                                : "btn btn-line"
                        }
                    >
                        {link.label}
                    </Link>
                );
            })}
        </div>
    );
}