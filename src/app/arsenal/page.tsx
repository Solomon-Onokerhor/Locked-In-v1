'use client';

import { useState } from 'react';
import { ArrowRight, Brain, Target, Flame, CheckCircle, Zap, BookOpen, BarChart3 } from 'lucide-react';

const AI_HACKS = [
    {
        emoji: '🧠',
        title: 'The Concept Breakdown Prompt',
        prompt: '"Act as an MIT professor. Explain [insert your topic, e.g. Thermodynamics] using simple everyday analogies. List the core formulas and the 3 most common exam mistakes students make."',
    },
    {
        emoji: '💻',
        title: 'The Code Debugger Prompt',
        prompt: '"I wrote this [C++/Python] code for my lab and it throws [Error]. Do NOT just fix it — point out the exact line where the logic breaks and explain why, so I actually learn."',
    },
    {
        emoji: '📝',
        title: 'The Past Questions Analyst',
        prompt: '"Here is a past exam question: [paste question]. Walk me through the full solution step by step, then explain the underlying concept so I can solve similar ones myself."',
    },
    {
        emoji: '🚀',
        title: 'The Study Plan Generator',
        prompt: '"I have [X] days before my [Subject] exam. My weak areas are [list them]. Build me a day-by-day study schedule that prioritizes my weakest topics and includes daily review checkpoints."',
    },
];

const ARSENAL_FEATURES = [
    { icon: Brain, title: '4 AI Engineering Prompts', desc: 'Copy-paste prompts built for UMaT engineering & science courses.' },
    { icon: Target, title: 'Locked-In Focus Protocol', desc: 'A battle-tested daily study routine to eliminate burnout.' },
    { icon: BarChart3, title: 'Semester Planner (Google Sheet)', desc: 'A colour-coded assignment tracker + GPA calculator inside.' },
    { icon: BookOpen, title: 'Platform Early Access', desc: 'Skip the queue. Get full Locked-In access instantly.' },
];

export default function ArsenalPage() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) {
            setError('Please fill in both fields.');
            return;
        }
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong.');

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden" style={{ fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" }}>

            {/* === NAV === */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/70 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight">Locked In<span className="text-blue-500">.</span></span>
                </div>
                <a href="https://lockedinumat.tech/auth" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-xl hover:bg-gray-200 transition-all active:scale-95">
                    Open Platform →
                </a>
            </nav>

            {/* === HERO === */}
            <section className="relative pt-32 pb-16 px-6">
                {/* Glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-2xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Free for UMaT Students
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-5">
                        The <span className="text-blue-500">UMaT Academic</span><br />Arsenal.
                    </h1>

                    <p className="text-lg text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed">
                        AI hacks, a focus protocol, and an automated semester planner built <span className="text-white font-semibold">specifically for UMaT engineering students.</span> Free. No login required.
                    </p>

                    {/* === FEATURE PILLS === */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {ARSENAL_FEATURES.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.title} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-300">
                                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                                    {f.title}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* === FORM SECTION === */}
            <section className="px-6 pb-20">
                <div className="max-w-md mx-auto">
                    {submitted ? (
                        <div className="text-center p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-black mb-3">You're Locked In! 🔥</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Your <span className="text-white font-semibold">UMaT Academic Arsenal</span> is on its way to you via WhatsApp right now. Check your messages in the next 60 seconds.
                            </p>
                            <a href="https://lockedinumat.tech/auth" className="mt-6 inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-200 transition-all">
                                Open Locked-In Platform <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Glow effect on card */}
                            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none" />
                            <div className="relative p-7 rounded-3xl bg-[#0a0a0a] border border-white/[0.08]">
                                <div className="mb-6">
                                    <h2 className="text-xl font-black mb-1">Get It For Free</h2>
                                    <p className="text-gray-500 text-sm">We'll send the full PDF + planner directly to your WhatsApp in under a minute.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider" htmlFor="lead-name">Your Name</label>
                                        <input
                                            id="lead-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Kwame Asante"
                                            className="w-full h-12 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white px-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] placeholder:text-gray-600 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider" htmlFor="lead-phone">WhatsApp Number</label>
                                        <input
                                            id="lead-phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. 0501234567 or +233501234567"
                                            className="w-full h-12 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white px-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] placeholder:text-gray-600 transition-all"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-xs font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>
                                    )}

                                    <button
                                        id="arsenal-submit-btn"
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full h-12 bg-white text-black font-black text-sm rounded-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Me The Arsenal 🚀
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-gray-600 text-xs mt-4">
                                    No spam. No BS. Just your free toolkit. 🔒
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* === WHAT'S INSIDE === */}
            <section className="px-6 pb-20 border-t border-white/[0.05] pt-16">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black mb-2">What's Inside 📦</h2>
                        <p className="text-gray-500 text-sm">Built for engineers, scientists, and every UMaT student who actually wants to win this semester.</p>
                    </div>

                    {/* AI HACKS */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black">Section 1: AI Engineering Hacks</h3>
                                <p className="text-gray-500 text-xs">Copy-paste prompts for ChatGPT & Gemini — designed for complex engineering topics.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {AI_HACKS.map((hack) => (
                                <div key={hack.title} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl flex-shrink-0">{hack.emoji}</span>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-1">{hack.title}</p>
                                            <p className="text-xs text-gray-500 leading-relaxed italic">{hack.prompt}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FOCUS PROTOCOL */}
                    <div className="mb-10 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                <Flame className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black">Section 2: The Locked-In Focus Protocol</h3>
                                <p className="text-gray-500 text-xs">A daily system to study harder without burning out.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[
                                '⏱️ The 50/10 Rule — 50 mins aggressive focus, 10 mins real rest (no scrolling)',
                                '📵 Environment Design — How to turn your phone into a "dumb phone" during study',
                                '🔥 The Night-Before Ritual — A 5-minute prep routine that saves 2 hours the next day',
                                '📊 Focus Scoring — How to track and gamify your own productivity using Locked-In',
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="flex-shrink-0 text-xs leading-5">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEMESTER PLANNER */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-black">Bonus: Semester Planner (Google Sheets)</h3>
                                <p className="text-gray-500 text-xs">Automated. Colour-coded. Built for UMaT's grading system.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {[
                                '✅ Dynamic assignment tracker that auto-highlights overdue tasks in red',
                                '📊 UMaT GPA calculator (already calibrated to the 4.0 scale)',
                                '📅 Semester timeline view showing your exam cluster zones',
                            ].map((item) => (
                                <p key={item} className="text-sm text-gray-400">{item}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* === FINAL CTA === */}
            <section className="py-20 px-6 border-t border-white/[0.05]">
                <div className="max-w-md mx-auto text-center">
                    <h2 className="text-3xl font-black mb-3">Ready to <span className="text-blue-500">Lock In?</span></h2>
                    <p className="text-gray-400 text-sm mb-6">Join 76+ UMaT students already using Locked-In to kill distractions and build focus streaks.</p>
                    <a href="https://lockedinumat.tech/auth" className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-8 py-3.5 rounded-2xl hover:bg-gray-200 transition-all active:scale-95">
                        Open Locked-In — Free <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </section>

            {/* === FOOTER === */}
            <footer className="border-t border-white/[0.05] py-8 px-6 text-center">
                <span className="text-lg font-black tracking-tight">Locked In<span className="text-blue-500">.</span></span>
                <p className="text-gray-600 text-xs mt-2">Built for UMaT students by UMaT students. © 2026 Locked In.</p>
            </footer>
        </div>
    );
}
