"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // With implicit flow, Supabase auto-detects the #access_token= hash and
        // fires SIGNED_IN on onAuthStateChange. No manual code exchange needed.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                subscription.unsubscribe();
                router.replace("/");
            }
        });

        // Fallback: if session was already set (e.g. page refresh), redirect immediately
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                subscription.unsubscribe();
                router.replace("/");
            }
        });

        // Safety timeout — if nothing happens in 8s, go back to auth page
        const timeout = setTimeout(() => {
            subscription.unsubscribe();
            router.replace("/auth");
        }, 8000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
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
