import type {
    Metadata,
    Viewport,
} from "next";

import {
    Geist,
    Geist_Mono,
} from "next/font/google";

import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

import TopLine from "@/components/layout/topLine";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import {
    AuthProvider,
} from "@/app/providers/AuthProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const appUrl =
    process.env.APP_URL ||
    "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),

    title: {
        default:
            "Foodly - Food Delivery Platform",
        template:
            "%s | Foodly",
    },

    description:
        "Browse restaurants and menus, order food online, manage delivery addresses, track orders, save favorites, and manage your Foodly account.",

    applicationName: "Foodly",

    keywords: [
        "Foodly",
        "food delivery",
        "online food ordering",
        "restaurants",
        "restaurant delivery",
        "food ordering platform",
    ],

    authors: [
        {
            name: "Narek Melkumyan",
        },
    ],

    creator: "Narek Melkumyan",
    publisher: "Foodly",

    robots: {
        index: true,
        follow: true,

        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },

    openGraph: {
        type: "website",
        url: "/",
        siteName: "Foodly",

        title:
            "Foodly - Food Delivery Platform",

        description:
            "Browse restaurants and menus, order food online, manage addresses, and track your Foodly orders.",
    },

    twitter: {
        card: "summary_large_image",

        title:
            "Foodly - Food Delivery Platform",

        description:
            "Browse restaurants and menus, order food online, manage addresses, and track your Foodly orders.",
    },

    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
        <body className="d-flex flex-column min-vh-100">

        <AuthProvider>

            <TopLine />

            <Header />

            <div className="flex-grow-1">
                {children}
            </div>

            <Footer />

        </AuthProvider>

        </body>
        </html>
    );
}