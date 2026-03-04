import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    metadataBase: new URL("https://locked-in-v1.vercel.app"),
    title: "Locked In — The Study App UMaT Students Won't Stop Talking About",
    description: "Free study rooms, shared resources, and a streak system that actually keeps you consistent. Join 100+ students already locked in.",
    openGraph: {
        title: "Locked In — The Study App UMaT Students Won't Stop Talking About",
        description: "Your mates are already using this. Free study rooms, shared notes, and a streak system that actually works. Don't get left behind.",
        url: "https://locked-in-v1.vercel.app",
        siteName: "Locked In",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Locked In Preview",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Locked In — The Study App UMaT Students Won't Stop Talking About",
        description: "Your mates are already using this. Free study rooms, shared notes, and a streak system that actually works. Don't get left behind.",
        images: ["/og-image.png"],
    },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="antialiased">
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
