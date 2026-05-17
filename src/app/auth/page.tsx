"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Step 1: Send OTP code to email
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: true },
        });

        setLoading(false);
        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: `Code sent to ${email}. Check your inbox!` });
            setStep("otp");
        }
    };

    // Step 2: Verify the 6-digit code
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length < 6) return;
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: otp.trim(),
            type: "email",
        });

        setLoading(false);
        if (error) {
            setMessage({ type: 'error', text: "Invalid or expired code. Please try again." });
        } else {
            // Session is now established in the client. Go to the dashboard.
            router.replace("/");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-display flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group z-10">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Back</span>
            </Link>

            <div className="w-full max-w-[420px] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-8 shadow-2xl relative z-10">

                {step === "email" ? (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black tracking-tight mb-2">
                                Locked In<span className="text-blue-500">.</span>
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Enter your email and we'll send you a sign-in code.
                            </p>
                        </div>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full h-12 bg-[#111111] border border-white/10 rounded-xl pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-all"
                                    required
                                    autoFocus
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Send Code <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-7 h-7 text-blue-400" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight mb-2">Check your email</h1>
                            <p className="text-gray-400 text-sm">
                                We sent a 6-digit code to<br />
                                <span className="text-white font-semibold">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                className="w-full h-14 bg-[#111111] border border-white/10 rounded-xl px-4 text-center text-2xl font-black text-white tracking-[0.5em] placeholder:text-gray-700 focus:outline-none focus:border-white/30 transition-all"
                                required
                                autoFocus
                            />

                            {message && (
                                <div className={`p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full h-12 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep("email"); setMessage(null); setOtp(""); }}
                                className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                ← Use a different email
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
