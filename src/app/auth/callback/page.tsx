"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // supabase.auth.getSession() will automatically detect and exchange
        // the code/token in the URL (both ?code= PKCE and #access_token= implicit flow)
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (data.session) {
                // Session established — go to dashboard
                router.replace("/");
            } else {
                // Something went wrong, go back to auth page
                console.error("Auth callback error:", error);
                router.replace("/auth");
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-medium">Signing you in...</p>
            </div>
        </div>
    );
}
