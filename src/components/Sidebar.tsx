'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlusCircle, Library, LogOut, User, ExternalLink, Shield, Share2, Check, Users, Trophy, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';
import { SettingsModal } from './SettingsModal';

const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/buddies', label: 'Buddies', icon: Users },
    { href: '/create-room', label: 'Host Room', icon: PlusCircle },
    { href: '/resources', label: 'Resources', icon: Library },
];

export function Sidebar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <>
            {/* ═══ MOBILE: Premium Top App Bar ═══ */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[#000000]/70 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                <Link href="/" className="flex items-center">
                    <span className="text-xl font-bold tracking-tight text-white">Locked In<span className="text-gray-300">.</span></span>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={signOut}
                        className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 transition-colors"
                        title="Sign Out"
                    >
                        <User className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </header>

            {/* ═══ MOBILE: Premium Bottom Tab Bar ═══ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-2xl border-t border-white/[0.05] shadow-[0_-4px_30px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between px-1 py-1.5 w-full max-w-md mx-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 flex-1 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'text-gray-300 bg-white/10'
                                    : 'text-gray-500 hover:text-gray-400'
                                    }`}
                            >
                                <div className={`relative flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-bold tracking-tight text-center w-full truncate px-0.5 ${isActive ? 'text-gray-300' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    {/* Admin tab - only for admins */}
                    {profile?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 flex-1 rounded-2xl transition-all duration-300 ${pathname === '/admin'
                                ? 'text-gray-300 bg-white/10'
                                : 'text-gray-500 hover:text-gray-400'
                                }`}
                        >
                            <Shield className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-200 ${pathname === '/admin' ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`} strokeWidth={pathname === '/admin' ? 2.5 : 2} />
                            <span className={`text-[9px] sm:text-[10px] font-bold tracking-tight text-center w-full truncate px-0.5 ${pathname === '/admin' ? 'text-gray-300' : ''}`}>
                                Admin
                            </span>
                        </Link>
                    )}
                </div>

                {/* Safe area spacer for iPhones */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>

            {/* ═══ DESKTOP: Premium Glass Side Panel ═══ */}
            <aside className="hidden md:flex fixed top-0 left-0 h-screen w-72 bg-[#000000]/40 backdrop-blur-2xl border-r border-white/5 flex-col p-6 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
                {/* Logo */}
                <Link href="/" className="flex flex-col mb-12 group">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white leading-none">
                        Locked In<span className="text-brand-accent animate-pulse">.</span>
                    </h1>
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black mt-2 ml-0.5">Lock In. Level Up.</p>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden relative ${isActive
                                    ? 'bg-white/10 text-brand-accent border border-white/20 shadow-[inset_0_0_20px_rgba(255, 255, 255, 0.1)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent shadow-[0_0_10px_rgba(255, 255, 255, 0.1)]"></div>}
                                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Dynamic Stitch Link */}
                    {process.env.NEXT_PUBLIC_STITCH_URL && (
                        <a
                            href={process.env.NEXT_PUBLIC_STITCH_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-accent hover:bg-brand-accent/10 transition-all border border-brand-accent/20 mt-2"
                        >
                            <ExternalLink className="w-5 h-5" />
                            <span className="font-medium">View Stitch Design</span>
                        </a>
                    )}

                    {/* Admin link - only visible to admins */}
                    {profile?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-2 ${pathname === '/admin'
                                ? 'bg-white/10 text-gray-300 shadow-inner'
                                : 'text-gray-300 hover:text-gray-300 hover:bg-white/10 border border-white/20'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Admin Panel</span>
                        </Link>
                    )}

                    {/* Premium Invite Friends Button */}
                    <button
                        onClick={() => {
                            const shareUrl = window.location.origin;
                            const text = `⚠️ UMaT students are using this app to lock in and it's actually working...\\n\\n📈 Track your streaks, join study & skill sessions, and access free resources.\\n\\n🔗 Join before your mates do: ${shareUrl}\\n\\n#LockedIn 🔒🔥`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-300 bg-white/10 hover:bg-white/10 transition-all duration-300 border border-white/20 mt-6 shadow-[0_0_20px_rgba(255, 255, 255, 0.1)] hover:shadow-[0_0_30px_rgba(255, 255, 255, 0.1)] group hover:scale-[1.02]"
                    >
                        <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                        <span className="font-bold tracking-wide">Invite Friends</span>
                    </button>
                </nav>

                {/* User Profile / Auth Action */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    {profile ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-brand-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-bold text-white truncate">{profile?.name || 'Student'}</p>
                                        {profile?.is_verified && (
                                            <div className="flex-shrink-0" title={profile?.badge_label || 'Verified Student'}>
                                                <div className="bg-white/10 rounded-full p-0.5">
                                                    <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{profile?.role || 'student'}</p>
                                        {profile?.level && (
                                            <>
                                                <span className="text-[10px] text-gray-700">•</span>
                                                <span className="text-[10px] text-gray-400 font-black tracking-tighter">Lvl {profile.level}</span>
                                            </>
                                        )}
                                        {profile?.badge_label && (
                                            <>
                                                <span className="text-[10px] text-gray-700">•</span>
                                                <span className="text-[9px] text-brand-accent font-black uppercase tracking-tighter bg-brand-accent/5 px-1 rounded">{profile.badge_label}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all bg-white/[0.02] border border-white/5"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={signOut}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-400 hover:text-gray-300 hover:bg-white/10 transition-all bg-white/[0.02] border border-white/5"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/auth"
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold transition-all shadow-lg shadow-white/10 active:scale-95"
                        >
                            <LogOut className="w-5 h-5 rotate-180" />
                            Sign In / Join
                        </Link>
                    )}
                </div>
            </aside>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
}
