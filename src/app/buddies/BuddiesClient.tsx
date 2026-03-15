'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Search, UserPlus, UserMinus, Users, Check, Flame, Trophy, BookOpen } from 'lucide-react';
import { UserProfileModal } from '@/components/UserProfileModal';

export function BuddiesClient() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [myBuddies, setMyBuddies] = useState<Profile[]>([]);
    const [isLoadingBuddies, setIsLoadingBuddies] = useState(true);
    const [activeTab, setActiveTab] = useState<'my_buddies' | 'discover'>('my_buddies');

    // Profile Modal
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Suggested Buddies
    const [suggestedBuddies, setSuggestedBuddies] = useState<Profile[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth');
        } else if (session) {
            fetchMyBuddies();
        }
    }, [session, loading, router]);

    // Load suggestions when switching to discover tab
    useEffect(() => {
        if (activeTab === 'discover' && session && profile) {
            fetchSuggestedBuddies();
        }
    }, [activeTab, session, profile]);

    const fetchMyBuddies = async () => {
        if (!session) return;
        setIsLoadingBuddies(true);

        try {
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

            const buddyIds = connections.map(conn =>
                conn.user_id === session.user.id ? conn.buddy_id : conn.user_id
            );

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

    const fetchSuggestedBuddies = async () => {
        if (!session || !profile?.faculty) return;
        setIsLoadingSuggestions(true);

        try {
            const existingBuddyIds = myBuddies.map(b => b.id);
            const excludedIds = [...existingBuddyIds, session.user.id];

            // Fetch students from same faculty, sorted by focus score
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('faculty', profile.faculty)
                .not('id', 'in', `(${excludedIds.join(',')})`)
                .order('focus_score', { ascending: false, nullsFirst: false })
                .limit(10);

            if (error) throw error;
            setSuggestedBuddies((data as Profile[]) || []);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !session) return;

        setIsSearching(true);
        try {
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
    }, [searchQuery, myBuddies]);

    const handleConnect = async (buddyId: string) => {
        if (!session) return;
        try {
            const { error } = await supabase
                .from('buddy_connections')
                .insert([{ user_id: session.user.id, buddy_id: buddyId }]);

            if (error) throw error;

            const newBuddy = searchResults.find(p => p.id === buddyId) || suggestedBuddies.find(p => p.id === buddyId);
            if (newBuddy) {
                setMyBuddies(prev => [...prev, newBuddy]);
                setSearchResults(prev => prev.filter(p => p.id !== buddyId));
                setSuggestedBuddies(prev => prev.filter(p => p.id !== buddyId));
            }
        } catch (err) {
            console.error('Error connecting:', err);
            alert('Failed to connect. Please try again.');
        }
    };

    const handleDisconnect = async (buddyId: string) => {
        if (!session) return;
        try {
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

    // Helper to find courses in common
    const getSharedCourses = (buddyCourses?: string[]) => {
        if (!profile?.courses || !buddyCourses) return [];
        return profile.courses.filter(c => buddyCourses.includes(c));
    };

    if (loading || !session) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20" />
            </div>
        );
    }

    // Reusable card component
    const renderUserCard = (user: Profile, actions: React.ReactNode) => {
        const sharedCourses = getSharedCourses(user.courses);
        return (
            <div key={user.id} className="bg-[#111111] p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                    <div
                        className="flex items-center gap-4 min-w-0 cursor-pointer group flex-1"
                        onClick={() => setSelectedUserId(user.id)}
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg border border-white/20 shrink-0 group-hover:border-white/40 transition-colors">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="font-bold text-white truncate text-base group-hover:underline">{user.name}</p>
                                {user.is_verified && (
                                    <div className="bg-white/10 rounded-full p-0.5 shrink-0" title={user.badge_label || 'Verified'}>
                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {user.faculty || 'Unknown Faculty'}
                            </p>
                        </div>
                    </div>
                    {actions}
                </div>

                {/* Stats badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {(user.focus_score || 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            <Trophy className="w-3 h-3" /> {user.focus_score} pts
                        </span>
                    )}
                    {(user.current_streak || 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                            <Flame className="w-3 h-3" /> {user.current_streak} day streak
                        </span>
                    )}
                    {sharedCourses.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                            <BookOpen className="w-3 h-3" /> {sharedCourses.length} shared {sharedCourses.length === 1 ? 'course' : 'courses'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#000000] font-display text-white">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:px-10 md:pt-10 md:pb-10 md:ml-[280px] max-w-[1000px] mx-auto">
                <header className="mb-6 md:mb-10 mt-2 md:mt-0" data-tour="buddies">
                    <h2 className="text-3xl md:text-[40px] font-black leading-tight tracking-tight text-white mb-2">
                        Study Buddies
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Connect with course mates and see their active sessions
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab('my_buddies')}
                        className={`px-6 py-4 border-b-[3px] font-bold tracking-wide uppercase text-sm transition-colors ${activeTab === 'my_buddies'
                            ? 'border-b-white text-white'
                            : 'border-b-transparent text-gray-500 hover:text-white'
                            }`}
                    >
                        My Buddies ({myBuddies.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`px-6 py-4 border-b-[3px] font-bold tracking-wide uppercase text-sm transition-colors flex items-center gap-2 ${activeTab === 'discover'
                            ? 'border-b-white text-white'
                            : 'border-b-transparent text-gray-500 hover:text-white'
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        Discover
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'my_buddies' ? (
                    <section className="animate-fade-in-up">
                        {isLoadingBuddies ? (
                            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20" /></div>
                        ) : myBuddies.length === 0 ? (
                            <div className="bg-[#111111] p-10 text-center rounded-2xl border border-white/10">
                                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No buddies yet</h3>
                                <p className="text-gray-400 mb-6">Connect with course mates to see what they&apos;re studying.</p>
                                <button
                                    onClick={() => setActiveTab('discover')}
                                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Find Buddies
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myBuddies.map(buddy =>
                                    renderUserCard(buddy, (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDisconnect(buddy.id); }}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
                                            title="Remove Buddy"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="animate-fade-in-up">
                        <div className="relative mb-8 max-w-2xl">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or course code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#111111] border border-white/10 rounded-2xl py-4 pl-14 pr-4 focus:border-white/30 focus:outline-none transition-colors text-white placeholder:text-gray-500"
                            />
                        </div>

                        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                            <p className="text-center text-gray-500 py-4">Type at least 2 characters to search...</p>
                        )}

                        {isSearching ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20" /></div>
                        ) : searchResults.length > 0 ? (
                            <div className="flex flex-col gap-3 max-w-2xl">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Search Results</h3>
                                {searchResults.map(result =>
                                    renderUserCard(result, (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleConnect(result.id); }}
                                            className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shrink-0"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span className="hidden sm:inline">Connect</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : searchQuery.trim().length >= 2 ? (
                            <div className="text-center py-10 bg-[#111111] rounded-2xl border border-white/10 max-w-2xl">
                                <p className="text-gray-400">No users found matching &quot;{searchQuery}&quot;</p>
                            </div>
                        ) : null}

                        {/* Suggested Buddies — shown when not actively searching */}
                        {searchQuery.trim().length < 2 && (
                            <div className="mt-2">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                                    {profile?.faculty ? `Suggested from ${profile.faculty}` : 'Suggested for You'}
                                </h3>
                                {isLoadingSuggestions ? (
                                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20" /></div>
                                ) : suggestedBuddies.length === 0 ? (
                                    <div className="text-center py-10 bg-[#111111] rounded-2xl border border-white/10">
                                        <p className="text-gray-400">No suggestions yet. Try searching by name above!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {suggestedBuddies.map(suggested =>
                                            renderUserCard(suggested, (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleConnect(suggested.id); }}
                                                    className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shrink-0"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Connect</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Profile Modal */}
            <UserProfileModal
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                userId={selectedUserId || ''}
                currentUserProfile={profile}
            />
        </div>
    );
}
