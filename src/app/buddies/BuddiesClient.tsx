'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Search, UserPlus, UserMinus, Users, Shield, Check } from 'lucide-react';

export function BuddiesClient() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [myBuddies, setMyBuddies] = useState<Profile[]>([]);
    const [isLoadingBuddies, setIsLoadingBuddies] = useState(true);
    const [activeTab, setActiveTab] = useState<'my_buddies' | 'discover'>('my_buddies');

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth');
        } else if (session) {
            fetchMyBuddies();
        }
    }, [session, loading, router]);

    const fetchMyBuddies = async () => {
        if (!session) return;
        setIsLoadingBuddies(true);

        try {
            // Get connection records
            const { data: connections, error } = await supabase
                .from('buddy_connections')
                .select('*')
                .or(`user_id.eq.${session.user.id},buddy_id.eq.${session.user.id}`);

            if (error) throw error;

            if (!connections || connections.length === 0) {
                setMyBuddies([]);
                setIsLoadingBuddies(false);
                return;
            }

            // Extract the IDs of the OTHER person in the connection
            const buddyIds = connections.map(conn =>
                conn.user_id === session.user.id ? conn.buddy_id : conn.user_id
            );

            // Fetch profiles for those IDs
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', buddyIds);

            if (profileError) throw profileError;

            setMyBuddies((profiles as Profile[]) || []);
        } catch (err) {
            console.error('Error fetching buddies:', err);
        } finally {
            setIsLoadingBuddies(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !session) return;

        setIsSearching(true);
        try {
            // Find users by name or course, excluding self and existing buddies
            const existingBuddyIds = myBuddies.map(b => b.id);
            const excludedIds = [...existingBuddyIds, session.user.id];

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${excludedIds.join(',')})`)
                .or(`name.ilike.%${searchQuery}%,courses.cs.{${searchQuery}}`)
                .limit(20);

            if (error) throw error;
            setSearchResults((data as Profile[]) || []);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, myBuddies]); // Re-run if myBuddies changes to filter them out of search results

    const handleConnect = async (buddyId: string) => {
        if (!session) return;
        try {
            const { error } = await supabase
                .from('buddy_connections')
                .insert([{ user_id: session.user.id, buddy_id: buddyId }]);

            if (error) throw error;

            // Move from search results to my buddies
            const newBuddy = searchResults.find(p => p.id === buddyId);
            if (newBuddy) {
                setMyBuddies(prev => [...prev, newBuddy]);
                setSearchResults(prev => prev.filter(p => p.id !== buddyId));
            }
        } catch (err) {
            console.error('Error connecting:', err);
            alert('Failed to connect. Please try again.');
        }
    };

    const handleDisconnect = async (buddyId: string) => {
        if (!session) return;
        try {
            // Can be initiator or receiver
            const { error } = await supabase
                .from('buddy_connections')
                .delete()
                .or(`and(user_id.eq.${session.user.id},buddy_id.eq.${buddyId}),and(user_id.eq.${buddyId},buddy_id.eq.${session.user.id})`);

            if (error) throw error;

            setMyBuddies(prev => prev.filter(p => p.id !== buddyId));
        } catch (err) {
            console.error('Error disconnecting:', err);
            alert('Failed to remove connection.');
        }
    };

    if (loading || !session) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-primary">
            <Sidebar />

            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] opacity-30"></div>
            </div>

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10">
                {/* Header */}
                <header className="mb-6 md:mb-10 mt-2 md:mt-0" data-tour="buddies">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-400" />
                        Study Buddies
                    </h2>
                    <p className="text-gray-500 text-sm md:text-lg mt-1">
                        Connect with course mates and see their active sessions.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex bg-white/[0.04] border border-white/[0.06] p-1 rounded-full w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('my_buddies')}
                        className={`px-6 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 ${activeTab === 'my_buddies'
                            ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        My Buddies ({myBuddies.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`px-6 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeTab === 'discover'
                            ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Search className="w-3.5 h-3.5" />
                        Discover
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'my_buddies' ? (
                    <section className="animate-fade-in-up">
                        {isLoadingBuddies ? (
                            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent" /></div>
                        ) : myBuddies.length === 0 ? (
                            <div className="glass-card p-10 text-center rounded-3xl border border-white/5">
                                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No buddies yet</h3>
                                <p className="text-gray-400 mb-6">Connect with course mates to see what they're studying.</p>
                                <button
                                    onClick={() => setActiveTab('discover')}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all"
                                >
                                    Find Buddies
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myBuddies.map(buddy => (
                                    <div key={buddy.id} className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                                                {buddy.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-white truncate">{buddy.name}</p>
                                                    {buddy.is_verified && (
                                                        <div className="bg-blue-500 rounded-full p-0.5 shrink-0" title={buddy.badge_label || 'Verified'}>
                                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 capitalize truncate mt-0.5">
                                                    {buddy.role} • {buddy.current_streak} Day Streak
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(buddy.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                                            title="Remove Buddy"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="animate-fade-in-up max-w-2xl">
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or course code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 text-white shadow-xl"
                            />
                        </div>

                        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                            <p className="text-center text-gray-500 py-4">Type at least 2 characters to search...</p>
                        )}

                        {isSearching ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-accent" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {searchResults.map(result => (
                                    <div key={result.id} className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold shrink-0">
                                                {result.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-white truncate">{result.name}</p>
                                                    {result.is_verified && (
                                                        <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                                                            <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 capitalize truncate mt-0.5">
                                                    {result.role}
                                                    {result.courses && result.courses.length > 0 ? ` • ${result.courses.join(', ')}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleConnect(result.id)}
                                            className="px-4 py-2 bg-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shrink-0"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>Connect</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery.trim().length >= 2 ? (
                            <div className="text-center py-10 glass-card rounded-2xl border border-white/5">
                                <p className="text-gray-400">No users found matching "{searchQuery}"</p>
                            </div>
                        ) : null}
                    </section>
                )}
            </main>
        </div>
    );
}
