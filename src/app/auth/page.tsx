"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({
                    type: 'success',
                    text: 'Magic link sent! Check your email to sign in.'
                });
                setEmail('');
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || 'Failed to authenticate with Google' });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-display flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group z-10">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Back</span>
            </Link>

            <div className="w-full max-w-[420px] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Locked In<span className="text-blue-500">.</span></h1>
                    <p className="text-gray-400 text-sm">Sign in to your account or create a new one to join the study platform.</p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 mb-6"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative flex items-center gap-4 mb-6">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or email</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@student.umat.edu.gh"
                                className="w-full h-12 bg-[#111111] border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                Send Magic Link
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

            </div>
        </div>
    );
}
