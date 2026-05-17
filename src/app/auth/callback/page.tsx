"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // Listen for when Supabase fires SIGNED_IN after auto-detecting tokens
        // This catches BOTH hash-based (implicit) and code-based (PKCE) flows
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                subscription.unsubscribe();
                router.replace("/");
            }
        });

        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (code) {
                // PKCE flow: exchange the code for a session
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error("PKCE code exchange error:", error);
                    subscription.unsubscribe();
                    router.replace("/auth");
                }
                // onAuthStateChange will fire SIGNED_IN and redirect
                return;
            }

            // Hash/implicit flow: Supabase JS SDK auto-detects #access_token in URL
            // and fires onAuthStateChange. Nothing to do here — just wait.
            // If no code and no hash token after 5s, give up.
            setTimeout(async () => {
                const { data } = await supabase.auth.getSession();
                if (!data.session) {
                    subscription.unsubscribe();
                    router.replace("/auth");
                }
            }, 5000);
        };

        handleCallback();

        return () => subscription.unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm font-medium mt-2">Signing you in...</p>
            </div>
        </div>
    );
}
