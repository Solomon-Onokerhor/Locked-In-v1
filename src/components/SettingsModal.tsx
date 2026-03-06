'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { X, User, BookOpen, Save, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FACULTIES = [
    'Faculty of Mining and Minerals Technology',
    'Faculty of Engineering',
    'Faculty of Computing and Mathematical Sciences',
    'Faculty Of Integrated Management Studies',
    'Faculty of Geosciences and Environmental Studies',
    'School of Petroleum Studies'
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { profile, refreshProfile } = useAuth();

    const [name, setName] = useState('');
    const [faculty, setFaculty] = useState('Faculty of Engineering');
    const [level, setLevel] = useState('100');

    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Load current profile data when modal opens
    useEffect(() => {
        if (isOpen && profile) {
            setName(profile.name || '');
            setFaculty(profile.faculty || 'Faculty of Engineering');
            setLevel(profile.level || '100');
            setSuccessMessage('');
            setError(null);
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile?.id) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                    faculty: faculty,
                    level: level
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            // Refresh the Auth Provider context so the sidebar instantly updates
            await refreshProfile();

            setSuccessMessage('Profile updated successfully!');
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0a0b14]/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-brand-primary border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <h2 className="text-xl font-bold text-white tracking-tight">Profile Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2 animate-fade-in">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Display Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all text-white placeholder:text-gray-600 focus:bg-white/[0.08]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">UMaT Faculty</label>
                            <div className="relative group">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                <select
                                    value={faculty}
                                    onChange={(e) => setFaculty(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all text-white focus:bg-white/[0.08] appearance-none"
                                >
                                    {FACULTIES.map(fac => (
                                        <option key={fac} value={fac} className="bg-brand-primary text-white">{fac}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Academic Level</label>
                            <div className="relative group">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-accent transition-colors" />
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all text-white focus:bg-white/[0.08] appearance-none"
                                >
                                    {['100', '200', '300', '400'].map(lvl => (
                                        <option key={lvl} value={lvl} className="bg-brand-primary text-white">Level {lvl}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[11px] text-gray-500 ml-1 mt-1">Required to participate in the Campus Leaderboards.</p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSaving || !!successMessage}
                                className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Save className="w-5 h-5" /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
