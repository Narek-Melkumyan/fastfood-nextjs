"use client";

import {
    useEffect,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    useAuth,
} from "@/app/providers/AuthProvider";

import AdminSidebar from "@/components/admin/AdminSidebar";

const adminStyles = `
  .admin-shell{
    min-height:calc(100vh - var(--nav-h));
    background:var(--surface-2);
  }

  .admin-sidebar{
    position:sticky;
    top:calc(var(--nav-h) + 20px);

    padding:1.25rem;

    background:var(--surface);

    border:1px solid var(--line);
    border-radius:var(--r);

    box-shadow:var(--shadow-sm);
  }

  .admin-nav-link{
    display:flex;
    align-items:center;
    gap:.75rem;

    padding:.8rem .9rem;

    color:var(--ink);

    border-radius:12px;

    text-decoration:none;

    font-weight:600;

    transition:
      background .2s,
      color .2s;
  }

  .admin-nav-link:hover{
    background:var(--surface-2);
  }

  .admin-nav-link.active{
    background:var(--brand);
    color:#fff;
  }

  .admin-stat{
    height:100%;

    padding:1.25rem;

    background:var(--surface);

    border:1px solid var(--line);
    border-radius:var(--r);
  }

  .admin-stat .value{
    font-size:2rem;
    font-weight:800;
    letter-spacing:-.04em;
  }

  .admin-stat .label{
    color:var(--muted);
    font-size:.88rem;
  }
`;

export default function AdminLayout({children,}: { children: React.ReactNode; }) {
    const router =
        useRouter();

    const {
        user,
        loading,
    } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace(
                "/login"
            );

            return;
        }

        if (
            user.role !==
            "ADMIN"
        ) {
            router.replace(
                "/"
            );
        }
    }, [
        loading,
        user,
        router,
    ]);

    if (loading) {
        return (
            <div className="container py-5">
                Loading admin panel...
            </div>
        );
    }

    if (
        !user ||
        user.role !==
        "ADMIN"
    ) {
        return null;
    }

    return (
        <div className="admin-shell">

            <style>
                {adminStyles}
            </style>

            <div className="container py-4">

                <div className="row g-4">

                    <div className="col-12 col-lg-3">

                        <AdminSidebar />

                    </div>

                    <div className="col-12 col-lg-9">

                        {children}

                    </div>

                </div>

            </div>

        </div>
    );
}