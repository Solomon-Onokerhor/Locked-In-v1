'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpen, LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
    const { session, loading } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [faculty, setFaculty] = useState('Faculty of Engineering');
    const [level, setLevel] = useState('100');

    const FACULTIES = [
        'Faculty of Mining and Minerals Technology',
        'Faculty of Engineering',
        'Faculty of Computing and Mathematical Sciences',
        'Faculty Of Integrated Management Studies',
        'Faculty of Geosciences and Environmental Studies',
        'School of Petroleum Studies'
    ];


    useEffect(() => {
        if (!loading && session) router.push('/');
    }, [loading, session, router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } },
                });
                if (signUpError) throw signUpError;
                if (data.user) {
                    const { error: profileError } = await supabase.from('profiles').insert([
                        { id: data.user.id, name, email, role: 'student', faculty, level },
                    ]);
                    if (profileError) throw profileError;
                }
            }
            router.push('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setAuthLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-accent/20 rounded-full blur-[150px] opacity-60 animate-pulse-glow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] opacity-40 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="mb-10 flex flex-col items-center animate-fade-in-up relative z-10">
                <div className="w-20 h-20 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-accent/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                    <Lock className="w-10 h-10 text-brand-accent drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3 text-center">
                    Locked In<span className="text-brand-accent drop-shadow-[0_0_10px_rgba(37,99,235,0.8)]">.</span>
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[11px] md:text-xs">Lock In. Level Up.</p>
            </div>

            <div className="w-full max-w-md glass-card p-8 md:p-10 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex glass-panel p-1.5 rounded-2xl mb-8">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-3.5 text-[15px] font-bold rounded-xl transition-all duration-300 ${isLogin ? 'bg-brand-accent text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-3.5 text-[15px] font-bold rounded-xl transition-all duration-300 ${!isLogin ? 'bg-brand-accent text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors duration-300" />
                                    <input type="text" required placeholder="Kofi Mensah" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-4 pl-12 pr-4 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder:text-gray-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Faculty</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors duration-300" />
                                    <select
                                        value={faculty}
                                        onChange={(e) => setFaculty(e.target.value)}
                                        className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-4 pl-12 pr-4 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all text-white appearance-none"
                                    >
                                        {FACULTIES.map(fac => (
                                            <option key={fac} value={fac} className="bg-brand-primary text-white">{fac}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Academic Level</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors duration-300" />
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-4 pl-12 pr-4 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all text-white appearance-none"
                                    >
                                        {['100', '200', '300', '400'].map(lvl => (
                                            <option key={lvl} value={lvl} className="bg-brand-primary text-white">Level {lvl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors duration-300" />
                            <input type="email" required placeholder="student@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-4 pl-12 pr-4 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder:text-gray-600 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors duration-300" />
                            <input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-4 pl-12 pr-12 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder:text-gray-600 text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={authLoading}
                        className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-6 text-[15px]"
                    >
                        {authLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isLogin ? (
                            <><LogIn className="w-5 h-5" /> Sign In</>
                        ) : (
                            <><UserPlus className="w-5 h-5" /> Create Account</>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500 leading-relaxed">
                    By continuing, you agree to Locked In&apos;s <span className="text-white hover:underline cursor-pointer">Terms</span> and <span className="text-white hover:underline cursor-pointer">Privacy Policy</span>. Verified students only.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <button
                        onClick={async () => {
                            // Dev bypass to avoid email rate limits!
                            setAuthLoading(true);
                            try {
                                const { data, error } = await supabase.auth.signUp({
                                    email: `test_bypass_${Date.now()}@example.com`,
                                    password: 'TestPassword123!',
                                    options: { data: { full_name: 'Dev Test User' } }
                                });
                                if (error) throw error;
                                if (data.user) {
                                    await supabase.from('profiles').insert([
                                        { id: data.user.id, name: 'Dev Test User', email: data.user.email, role: 'student' }
                                    ]);
                                }
                                router.push('/');
                            } catch (err: unknown) {
                                alert("Bypass failed: " + (err instanceof Error ? err.message : 'Unknown error'));
                            } finally {
                                setAuthLoading(false);
                            }
                        }}
                        className="mt-6 w-full text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 py-2 rounded-lg hover:bg-red-400/20 transition-all"
                    >
                        [DEV ONLY] Bypass Rate Limit (Create Test User)
                    </button>
                )}
            </div>
        </div>
    );
}
