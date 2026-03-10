"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { StepCard } from "@/components/onboarding/StepCard";
import { ArrowRight } from "lucide-react";
import { FACULTIES } from "@/lib/constants";

export default function OnboardingPage() {
    const router = useRouter();
    const { refreshProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Profile Data
    const [userId, setUserId] = useState("");
    const [email, setEmail] = useState("");
    const [faculty, setFaculty] = useState("");
    const [programme, setProgramme] = useState("");
    const [level, setLevel] = useState("");

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    router.push("/auth");
                    return;
                }

                setUserId(user.id);
                setEmail(user.email || "");

                // Fetch existing profile if they have one (in case they refresh)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("faculty, programme, level")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    if (profile.faculty) setFaculty(profile.faculty);
                    if (profile.programme) setProgramme(profile.programme);
                    if (profile.level) setLevel(profile.level);

                    // If they already have these set, they shouldn't be here
                    if (profile.faculty && profile.programme && profile.level) {
                        router.push("/");
                        return;
                    }
                }
            } catch (err) {
                console.error("Error checking user:", err);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!faculty.trim() || !programme.trim() || !level.trim()) {
            setError("Please fill out all fields to continue.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // First, check if the profile exists to decide between update and insert
            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", userId)
                .single();

            if (existingProfile) {
                const { error: updateError } = await supabase
                    .from("profiles")
                    .update({
                        faculty: faculty.trim(),
                        programme: programme.trim(),
                        level: level.trim()
                    })
                    .eq('id', userId);
                if (updateError) throw updateError;
            } else {
                // If profile is missing (e.g. failed insert during signup), create it
                const { data: authUser } = await supabase.auth.getUser();
                const userName = authUser.user?.user_metadata?.full_name || "Scholar";

                const { error: insertError } = await supabase
                    .from("profiles")
                    .insert({
                        id: userId,
                        email: email,
                        name: userName,
                        faculty: faculty.trim(),
                        programme: programme.trim(),
                        level: level.trim(),
                        role: 'student'
                    });
                if (insertError) throw insertError;
            }

            // Refresh the global profile state so OnboardingEnforcer sees a complete profile
            await refreshProfile();

            // Redirect to dashboard with tour active
            router.push("/?tour=1");

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#000000] text-white font-display min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[520px] bg-[#0a0a0a] border border-white/10 rounded-xl p-8 shadow-2xl relative z-10">
                <div className="mb-8">
                    <h1 className="text-white text-[32px] font-bold leading-tight mb-2 tracking-tight">Complete Your Profile</h1>
                    <p className="text-[#888888] text-sm font-normal">Tell us a bit about your academics to personalize your experience</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="faculty">Faculty</label>
                        <div className="relative">
                            <select
                                id="faculty"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 appearance-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                                required
                            >
                                <option value="" disabled className="text-[#888888]">Select Faculty</option>
                                {FACULTIES.map(fac => (
                                    <option key={fac} value={fac}>{fac}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none">▼</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="programme">Programme</label>
                        <input
                            id="programme"
                            type="text"
                            value={programme}
                            onChange={(e) => setProgramme(e.target.value)}
                            placeholder="e.g. BSc Computer Science"
                            className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#888888] transition-colors"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="level">Level</label>
                        <div className="relative">
                            <select
                                id="level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 appearance-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                                required
                            >
                                <option value="" disabled className="text-[#888888]">Select Level</option>
                                <option value="Level 100">Level 100 / Freshman</option>
                                <option value="Level 200">Level 200 / Sophomore</option>
                                <option value="Level 300">Level 300 / Junior</option>
                                <option value="Level 400">Level 400 / Senior</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="Alumni">Alumni</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none">▼</span>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-14 bg-white text-black font-bold text-lg rounded-lg hover:bg-gray-200 transition-colors mt-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Complete Profile
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                    <path fillRule="evenodd" clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor"></path>
                </svg>
                <span className="text-white text-sm font-bold tracking-tight">Locked In.</span>
            </div>
        </div>
    );
}
