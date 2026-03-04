import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    metadataBase: new URL("https://locked-in-v1.vercel.app"),
    title: "Locked In — Campus Study & Skill Connect",
    description: "Lock in to study sessions and skill rooms. Connect with students, share resources, and level up together.",
    openGraph: {
        title: "Locked In — Campus Study & Skill Connect",
        description: "The ultimate UMaT study platform. Lock in, level up, and connect with students.",
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
        title: "Locked In — Campus Study & Skill Connect",
        description: "The ultimate UMaT study platform. Lock in, level up, and connect with students.",
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
