'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Make sure we have a session to update password for
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Not authenticated via the email link, redirect to login
                router.push('/auth');
            }
        };
        checkSession();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;
            
            setSuccessMessage('Password updated successfully. Redirecting to dashboard...');
            
            // Short delay so they see the success message
            setTimeout(() => {
                router.push('/');
            }, 2000);
            
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred updating your password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-display text-white">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-white/5 blur-[80px] md:blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[480px] bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-8 md:p-12 shadow-2xl flex flex-col items-center">
                <div className="flex flex-col items-center gap-1 w-full mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">Locked In.</h1>
                    <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#888888] uppercase">Update Password</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="w-full flex flex-col gap-5">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg flex items-center gap-2">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg flex items-center gap-2">
                            {successMessage}
                        </div>
                    )}

                    <label className="flex flex-col gap-2 relative">
                        <span className="text-sm font-medium text-gray-300">New Password</span>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter your new password"
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

                    <label className="flex flex-col gap-2 relative">
                        <span className="text-sm font-medium text-gray-300">Confirm New Password</span>
                        <div className="relative flex items-center">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-14 bg-[#111] border border-white/10 text-white rounded px-4 pr-12 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-base placeholder:text-[#888888]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-0 top-0 bottom-0 px-4 text-[#888888] hover:text-white flex items-center justify-center transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={loading || password.length < 6}
                        className="w-full h-14 bg-white text-black font-bold text-lg mt-2 rounded hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
