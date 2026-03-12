import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    metadataBase: new URL("https://lockedinumat.tech"),
    title: "Locked In | Study Groups & Timers for UMaT Students",
    description: "Join highly focused study groups, track your productivity streak, and compete on the campus leaderboard.",
    keywords: [
        "study app for UMaT students",
        "UMaT Tarkwa study groups",
        "pomodoro timer for engineering students Ghana",
        "UMaT study buddy",
        "University of Mines and Technology study app",
        "Tarkwa student productivity",
        "Ghana university study groups",
        "engineering students focus timer",
        "UMaT campus leaderboard",
        "online study rooms Ghana",
    ],
    manifest: "/manifest.json",
    themeColor: "#000000",
    alternates: {
        canonical: "https://www.lockedinumat.tech/",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Locked In",
    },
    openGraph: {
        title: "Locked In — The Study App UMaT Students Won't Stop Talking About",
        description: "Your mates are already using this. Free study & skill rooms, shared notes, and a streak system that actually works. Don't get left behind.",
        url: "https://lockedinumat.tech",
        siteName: "Locked In",
        images: [
            {
                url: "/og-image.jpg",
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
        description: "Your mates are already using this. Free study & skill rooms, shared notes, and a streak system that actually works. Don't get left behind.",
        images: ["/og-image.jpg"],
    },
};

export const dynamic = 'force-dynamic';

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Locked In",
    "url": "https://lockedinumat.tech",
    "description": "Study groups and timers for UMaT students. Join focused study rooms, track your Pomodoro sessions, and compete on the campus leaderboard at the University of Mines and Technology, Tarkwa.",
    "applicationCategory": "EducationApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "GHS",
    },
    "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student",
    },
    "author": {
        "@type": "Organization",
        "name": "Locked In",
        "url": "https://lockedinumat.tech",
    },
    "potentialAction": {
        "@type": "ViewAction",
        "target": "https://lockedinumat.tech",
        "name": "Open Locked In",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="antialiased">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}
