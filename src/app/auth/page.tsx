'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpen, LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
    const { session, loading, profile } = useAuth();
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');



    useEffect(() => {
        if (!loading && session) {
            if (profile && !profile.faculty) {
                router.push('/onboarding');
            } else if (profile && profile.faculty) {
                router.push('/');
            }
        }
    }, [loading, session, profile, router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Strict email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

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

                    // Send the welcome email
                    try {
                        await fetch('/api/send-welcome', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, name }),
                        });
                    } catch (emailErr) {
                        console.error('Failed to send welcome email:', emailErr);
                        // We don't throw here because the user is already signed up successfully
                    }
                    // Force explicit redirect immediately instead of waiting for AuthProvider state sync
                    router.push('/onboarding');
                    return;
                }
            }
            // Redirection is handled by the useEffect above

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setAuthLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            });
            if (error) throw error;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Google sign in failed');
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-display text-white">
            {/* Ambient Background Blur from Stitch Sign In */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-white/5 blur-[80px] md:blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[480px] bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-8 md:p-12 shadow-2xl flex flex-col items-center">
                <div className="flex flex-col items-center gap-1 w-full mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">Locked In.</h1>
                    <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#888888] uppercase">Lock in. Level up.</p>
                </div>

                <div className="flex w-full border-b border-white/10 mb-8">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 pb-3 text-center border-b-2 text-sm font-bold transition-colors ${isLogin
                                ? 'border-white text-white'
                                : 'border-transparent text-[#888888] hover:text-gray-300'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 pb-3 text-center border-b-2 text-sm font-bold transition-colors ${!isLogin
                                ? 'border-white text-white'
                                : 'border-transparent text-[#888888] hover:text-gray-300'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleAuth} className="w-full flex flex-col gap-5">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg flex items-center gap-2">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-300">Full Name</span>
                            <input
                                type="text"
                                required
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-14 bg-[#111] border border-white/10 text-white rounded px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-base placeholder:text-[#888888]"
                            />
                        </label>
                    )}

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-300">Email</span>
                        <input
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 bg-[#111] border border-white/10 text-white rounded px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-base placeholder:text-[#888888]"
                        />
                    </label>

                    <label className="flex flex-col gap-2 relative">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-300">Password</span>
                            {isLogin && (
                                <button type="button" className="text-xs text-[#888888] hover:text-white transition-colors">Forgot?</button>
                            )}
                        </div>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder={isLogin ? "Enter your password" : "Create a password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-14 bg-[#111] border border-white/10 text-white rounded px-4 pr-12 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-base placeholder:text-[#888888]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 bottom-0 px-4 text-[#888888] hover:text-white flex items-center justify-center transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full h-14 bg-white text-black font-bold text-lg mt-2 rounded hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {authLoading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : isLogin ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>




                <p className="mt-8 text-center text-[#888888] text-xs">
                    By continuing, you agree to our <a href="#" className="text-white hover:underline">Terms of Service</a>. Verified students only.
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
                        className="mt-6 w-full text-xs font-bold text-gray-300 bg-white/10 border border-white/20 py-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                        [DEV ONLY] Bypass Rate Limit (Create Test User)
                    </button>
                )}
            </div>
        </div>
    );
}
