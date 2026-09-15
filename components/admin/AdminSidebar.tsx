"use client";

import Link from "next/link";

import {
    usePathname,
} from "next/navigation";

const links = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: "📊",
    },

    {
        href: "/admin/orders",
        label: "Orders",
        icon: "🧾",
    },

    {
        href: "/admin/users",
        label: "Users",
        icon: "👥",
    },

    {
        href: "/admin/restaurants",
        label: "Restaurants",
        icon: "🍽️",
    },

    {
        href: "/admin/products",
        label: "Products",
        icon: "🍕",
    },

    {
        href: "/admin/promotions",
        label: "Promotions",
        icon: "🏷️",
    },
];

export default function AdminSidebar() {
    const pathname =
        usePathname();

    return (
        <aside className="admin-sidebar">

            <div className="mb-4">

        <span className="eyebrow">
          Foodly
        </span>

                <h2 className="h4 mb-0">
                    Admin Panel
                </h2>

            </div>

            <nav className="d-grid gap-2">

                {links.map(
                    (
                        link
                    ) => {
                        const active =
                            link.href ===
                            "/admin"
                                ? pathname ===
                                "/admin"
                                : pathname.startsWith(
                                    link.href
                                );

                        return (
                            <Link
                                key={
                                    link.href
                                }
                                href={
                                    link.href
                                }
                                className={
                                    active
                                        ? "admin-nav-link active"
                                        : "admin-nav-link"
                                }
                            >

                <span>
                  {link.icon}
                    </span>
                  <span>
                  {link.label}
                </span>

                            </Link>
                        );
                    }
                )}

            </nav>

        </aside>
    );
}