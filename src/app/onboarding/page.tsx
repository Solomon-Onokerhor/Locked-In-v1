"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StepCard } from "@/components/onboarding/StepCard";
import { ArrowRight } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
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

            // Redirect to dashboard with tour active
            router.push("/?tour=1");

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background gradients for premium feel */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

            <main className="w-full max-w-md relative z-10">
                <StepCard
                    title="Welcome to Locked-In! 🔒"
                    description="Tell us about your academics. We'll use this to match you with relevant study rooms and resources."
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <label htmlFor="faculty" className="block text-sm font-bold text-gray-300">
                                Faculty / College
                            </label>
                            <input
                                id="faculty"
                                type="text"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                placeholder="e.g. Science, Engineering, Business..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none text-white transition-all placeholder:text-gray-500 hover:bg-white/10"
                                required
                            />
                        </div>

                        <div className="space-y-2 text-left">
                            <label htmlFor="programme" className="block text-sm font-bold text-gray-300">
                                Programme of Study
                            </label>
                            <input
                                id="programme"
                                type="text"
                                value={programme}
                                onChange={(e) => setProgramme(e.target.value)}
                                placeholder="e.g. BSc Computer Science"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none text-white transition-all placeholder:text-gray-500 hover:bg-white/10"
                                required
                            />
                        </div>

                        <div className="space-y-2 text-left">
                            <label htmlFor="level" className="block text-sm font-bold text-gray-300">
                                Class / Level
                            </label>
                            <select
                                id="level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0f1123] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none text-white transition-all hover:bg-[#151830] appearance-none"
                                required
                            >
                                <option value="" disabled className="text-gray-500">Select your current level</option>
                                <option value="Level 100">Level 100 / Freshman</option>
                                <option value="Level 200">Level 200 / Sophomore</option>
                                <option value="Level 300">Level 300 / Junior</option>
                                <option value="Level 400">Level 400 / Senior</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="Alumni">Alumni</option>
                            </select>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 px-6 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Complete Profile & Start Tour
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </StepCard>
            </main>
        </div>
    );
}
