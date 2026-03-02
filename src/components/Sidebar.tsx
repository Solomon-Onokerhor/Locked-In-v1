'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, PlusCircle, Library, LogOut, User, ExternalLink, Shield, Share2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/create-room', label: 'Host Room', icon: PlusCircle },
    { href: '/resources', label: 'Resources', icon: Library },
];

export function Sidebar() {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    return (
        <>
            {/* ═══ MOBILE: Top App Bar ═══ */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0a0b14]/95 backdrop-blur-xl border-b border-white/[0.04]">
                <Link href="/" className="flex items-center">
                    <span className="text-xl font-bold tracking-tight text-white">Locked In<span className="text-blue-500">.</span></span>
                </Link>
                <button
                    onClick={signOut}
                    className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="Sign Out"
                >
                    <User className="w-4 h-4 text-gray-400" />
                </button>
            </header>

            {/* ═══ MOBILE: Bottom Tab Bar ═══ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1224]/90 backdrop-blur-xl border-t border-white/[0.06]">
                <div className="flex items-stretch justify-around px-2 py-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-200 ${isActive
                                    ? 'text-blue-400'
                                    : 'text-gray-500 active:text-gray-300'
                                    }`}
                            >
                                <div className={`relative ${isActive ? '' : ''}`}>
                                    <Icon className={`w-[22px] h-[22px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-blue-400' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    {/* Admin tab - only for admins */}
                    {profile?.role === 'admin' && (
                        <Link
                            href="/admin"
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-200 ${pathname === '/admin'
                                ? 'text-red-400'
                                : 'text-gray-500 active:text-gray-300'
                                }`}
                        >
                            <Shield className={`w-[22px] h-[22px] transition-transform duration-200 ${pathname === '/admin' ? 'scale-110' : ''}`} strokeWidth={pathname === '/admin' ? 2.5 : 1.8} />
                            <span className={`text-[10px] font-semibold tracking-wide ${pathname === '/admin' ? 'text-red-400' : ''}`}>
                                Admin
                            </span>
                        </Link>
                    )}
                </div>

                {/* Safe area spacer for iPhones */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>

            {/* ═══ DESKTOP: Classic Side Panel ═══ */}
            <aside className="hidden md:flex fixed top-0 left-0 h-screen w-72 bg-brand-secondary border-r border-white/5 flex-col p-6 z-50">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-brand-accent/10 text-brand-accent shadow-inner'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
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
                                ? 'bg-red-500/10 text-red-400 shadow-inner'
                                : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/5 border border-red-500/15'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Admin Panel</span>
                        </Link>
                    )}

                    {/* Invite Friends / Viral Growth */}
                    <button
                        onClick={() => {
                            const text = `🔥 Check out Locked In - The ultimate UMaT study platform!\n\nLock in to study rooms, download resources, and level up your grades.\n\nSign up here: ${window.location.host}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all border border-emerald-500/20 mt-4 animate-pulse group"
                    >
                        <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold">Invite Friends</span>
                    </button>
                </nav>

                {/* User Profile */}
                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{profile?.name || 'Student'}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{profile?.role || 'student'}</p>
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
