'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpen, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

export default function AuthPage() {
    const { session, loading } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');


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
                        { id: data.user.id, name, email, role: 'student' },
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
        <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.05),transparent)]">
            <div className="mb-10 flex flex-col items-center animate-fade-in-up">
                <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2">
                    Locked In<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Lock In. Level Up.</p>
            </div>

            <div className="w-full max-w-md glass-card p-8">
                <div className="flex bg-white/5 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'
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
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                    <input type="text" required placeholder="Kofi Mensah" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600 focus:bg-white/[0.08]"
                                    />
                                </div>
                            </div>

                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                            <input type="email" required placeholder="student@campus.edu" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600 focus:bg-white/[0.08]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600 focus:bg-white/[0.08]"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={authLoading}
                        className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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
