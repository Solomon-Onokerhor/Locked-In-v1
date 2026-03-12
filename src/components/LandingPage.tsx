'use client';

import Link from 'next/link';
import { Timer, Users, Trophy, BookOpen, ArrowRight, Zap, Target, Flame } from 'lucide-react';

const features = [
    {
        icon: Timer,
        title: 'Solo Lock-In Timer',
        description: 'Pomodoro mode, focus scoring, streaks, and audio notifications to keep you locked in.',
    },
    {
        icon: Users,
        title: 'Study Rooms',
        description: 'Create or join timed study sessions with classmates. Virtual or in-person.',
    },
    {
        icon: Trophy,
        title: 'Campus Leaderboard',
        description: 'Compete with your faculty. Earn points for every minute you study.',
    },
    {
        icon: BookOpen,
        title: 'Free Resources',
        description: 'Access past questions, slides, and materials shared by the community.',
    },
];

const steps = [
    {
        num: '01',
        icon: Zap,
        title: 'Sign Up',
        description: 'Create your account in seconds. No payment needed.',
    },
    {
        num: '02',
        icon: Target,
        title: 'Set Your Faculty',
        description: 'Tell us your programme so we can personalize your experience.',
    },
    {
        num: '03',
        icon: Flame,
        title: 'Start Your Lock-In',
        description: 'Hit the timer, join a room, and watch your focus score climb.',
    },
];

export function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white font-display overflow-x-hidden">
            {/* ═══ NAV ═══ */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/70 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">Locked In<span className="text-blue-500">.</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/auth"
                        className="text-sm text-gray-400 hover:text-white transition-colors font-medium hidden sm:block"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/auth"
                        className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="relative pt-32 pb-20 px-6">
                {/* Subtle glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-gray-300 uppercase tracking-widest mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        76+ students already locked in
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] mb-6">
                        Lock In.<br />
                        <span className="text-blue-500">Level Up.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                        The study app built for African university students. Track focus streaks, join study rooms, compete on campus leaderboards, and crush your grades.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/auth"
                            className="w-full sm:w-auto bg-white text-black font-bold text-base px-8 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Get Started — Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto text-gray-300 font-semibold text-base px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            See How It Works
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══ STATS ═══ */}
            <section className="py-12 px-6 border-y border-white/[0.05]">
                <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
                    {[
                        { value: '76+', label: 'Students' },
                        { value: '1,200+', label: 'Focus Minutes' },
                        { value: '6', label: 'Faculties' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ FEATURES ═══ */}
            <section id="features" className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">Premium Features</h2>
                        <p className="text-gray-500 text-base">Everything you need to stay focused.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={feature.title}
                                    className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                        <Icon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1.5">{feature.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ HOW IT WORKS ═══ */}
            <section className="py-20 px-6 border-t border-white/[0.05]">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">How It Works</h2>
                        <p className="text-gray-500 text-base">Three steps to better focus.</p>
                    </div>

                    <div className="flex flex-col gap-6">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.num}
                                    className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <span className="text-blue-400 font-black text-sm">{step.num}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                                        <p className="text-sm text-gray-400">{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
                        Ready to <span className="text-blue-500">Lock In</span>?
                    </h2>
                    <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto">
                        Join the most focused students on campus and start building study habits that stick.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 bg-white text-black font-bold text-base px-10 py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                    >
                        Join Now — It&apos;s Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="border-t border-white/[0.05] py-10 px-6">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tracking-tight">Locked In<span className="text-blue-500">.</span></span>
                        <span className="text-xs text-gray-600">Built for UMaT students</span>
                    </div>
                    <p className="text-xs text-gray-600">© 2026 Locked In. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
