'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';
import Link from 'next/link';
import { Search, BookOpen, Users, Calendar, ArrowRight, PlusCircle, Trophy, Award } from 'lucide-react';
import { RoomCard } from './RoomCard';

interface DashboardClientProps {
    initialRooms: Room[];
}

export function DashboardClient({ initialRooms }: DashboardClientProps) {
    const { session, profile, loading } = useAuth();
    const [rooms, setRooms] = useState<Room[]>(initialRooms);
    const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set());
    const [buddyRoomCounts, setBuddyRoomCounts] = useState<Record<string, number>>({});
    const [activeSoloCount, setActiveSoloCount] = useState(0);
    const [activeTab, setActiveTab] = useState<'all' | 'study' | 'skill' | 'my_rooms' | 'upcoming'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.push('/sign-in');
        } else if (!loading && session && (!profile || !profile.faculty)) {
            // Missing profile row or missing academic fields → force onboarding
            router.push('/onboarding');
        } else if (session) {
            fetchPrivateData();
        }
    }, [session, loading, profile, router]);

    const fetchPrivateData = async () => {
        // Fetch user's joined rooms
        const { data: memberData } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', session!.user.id);

        if (memberData) {
            setMyRoomIds(new Set(memberData.map(m => m.room_id)));
        }

        // Fetch active solo lockers (recent 30 mins)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from('solo_sessions')
            .select('*', { count: 'exact', head: true })
            .gt('completed_at', thirtyMinsAgo);

        setActiveSoloCount(count || 0);

        // Fetch buddy activity
        const { data: buddiesData } = await supabase
            .from('buddy_connections')
            .select('*')
            .or(`user_id.eq.${session!.user.id},buddy_id.eq.${session!.user.id}`);

        let buddyIds: string[] = [];
        if (buddiesData) {
            buddyIds = buddiesData.map(b => b.user_id === session!.user.id ? b.buddy_id : b.user_id);
        }

        if (buddyIds.length > 0) {
            const { data: buddyRoomsData } = await supabase
                .from('room_members')
                .select('room_id')
                .in('user_id', buddyIds);

            const buddyCounts: Record<string, number> = {};
            if (buddyRoomsData) {
                buddyRoomsData.forEach(mr => {
                    buddyCounts[mr.room_id] = (buddyCounts[mr.room_id] || 0) + 1;
                });
            }
            setBuddyRoomCounts(buddyCounts);
        }
    };

    const filteredRooms = rooms.filter((room) => {
        const isMember = session ? (room.created_by === session.user.id || myRoomIds.has(room.room_id)) : false;

        const now = new Date();
        const startTime = new Date(room.date_time);
        const isUpcoming = startTime > now;

        let matchesTab = false;
        if (activeTab === 'all') matchesTab = true;
        else if (activeTab === 'study' || activeTab === 'skill') matchesTab = room.room_type.toLowerCase() === activeTab;
        else if (activeTab === 'my_rooms') matchesTab = isMember;
        else if (activeTab === 'upcoming') matchesTab = isMember && isUpcoming;

        const matchesSearch =
            room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (room.course_code?.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesTab && matchesSearch;
    });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get display name — use profile name first, then email prefix, truncated
    const displayName = profile?.name || session?.user?.email?.split('@')[0] || '';

    if (!mounted || loading || !session) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000]">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:p-10 md:ml-[280px] relative z-10 animate-fade-in flex-1">
                <div className="max-w-[1080px] mx-auto flex flex-col gap-4 md:gap-10">
                    {/* Header — compact on mobile */}
                    <header className="flex items-center justify-between gap-3" data-tour="welcome">
                        <div className="min-w-0">
                            <h2 className="text-white text-2xl md:text-5xl font-black tracking-tight truncate">
                                Welcome{displayName ? `, ${displayName}` : ''}
                            </h2>
                            <p className="text-[#888888] text-sm md:text-lg">Lock In. Level Up.</p>
                        </div>
                    </header>

                    {/* Quick Stats Row & Leaderboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div onClick={() => router.push('/buddies')} className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-[#888888]" />
                            </div>
                            <div>
                                <span className="text-white text-xl font-black block leading-none">{profile?.study_buddies || '0'}</span>
                                <span className="text-[#888888] text-[10px] font-bold uppercase mt-1 block">Buddies</span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <span className="text-white text-xl font-black block leading-none">{profile?.focus_score || '0'}</span>
                                <span className="text-[#888888] text-[10px] font-bold uppercase mt-1 block">Focus Score</span>
                            </div>
                        </div>
                        
                        <Link href="/leaderboard" className="col-span-2 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 flex items-center justify-between hover:border-white/20 hover:bg-white/5 transition-all group">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white text-sm md:text-base font-bold tracking-tight truncate">Campus Leaderboards</h3>
                                    <p className="text-[#888888] text-xs truncate">Check your standing</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-[#888888] group-hover:text-white shrink-0 transition-colors" />
                        </Link>
                    </div>

                    {/* Room Browser Controls */}
                    <div className="flex flex-col gap-4 md:gap-6" data-tour="room-tabs">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-hide bg-[#0a0a0a] border border-white/10 p-1.5 rounded-xl">
                                {['all', 'study', 'skill', 'my_rooms', 'upcoming'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-[#888888] hover:text-white hover:bg-white/5'}`}
                                    >
                                        {tab === 'my_rooms' ? 'My Rooms' : tab === 'upcoming' ? 'Upcoming' : tab === 'all' ? 'All Rooms' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] group-focus-within:text-white transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 placeholder-[#888888] transition-all"
                                />
                            </div>
                        </div>

                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-14 md:py-20 px-4 text-center border-2 border-dashed border-white/20 rounded-2xl">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                            {activeTab === 'upcoming' ? <Calendar className="w-7 h-7 md:w-8 md:h-8 text-[#888888]" /> : <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-[#888888]" />}
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight">
                                            {activeTab === 'my_rooms' ? "You haven't joined any rooms yet" :
                                                activeTab === 'upcoming' ? "No upcoming sessions found" :
                                                    "No sessions found"}
                                        </h3>
                                        <p className="text-[#888888] max-w-sm mx-auto mb-6 md:mb-8 text-xs md:text-sm">
                                            {activeTab === 'my_rooms' ? "Join a room or host your own to see them here!" :
                                                activeTab === 'upcoming' ? "You don't have any sessions scheduled for the future." :
                                                    "Be the first to lock in! Host a new study or skill-sharing session and invite others to join."}
                                        </p>
                                        <Link
                                            href={activeTab === 'all' ? "/create-room" : "/"}
                                            onClick={(e) => {
                                                if (activeTab !== 'all') {
                                                    e.preventDefault();
                                                    setActiveTab('all');
                                                }
                                            }}
                                            className="px-6 py-3 bg-white hover:bg-gray-200 text-black text-sm font-bold rounded-lg transition-colors flex items-center gap-2 inline-flex"
                                        >
                                            {activeTab === 'all' ? <PlusCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                            {activeTab === 'all' ? "Host a Session" : "Explore All Rooms"}
                                        </Link>
                                    </div>
                                ) : (
                                    filteredRooms.map((room) => (
                                        <RoomCard key={room.room_id} room={room} buddyCount={buddyRoomCounts[room.room_id] || 0} />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <Link
                    href="/create-room"
                    data-tour="host-room"
                    className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl shadow-black/50 active:scale-90 transition-transform"
                >
                    <PlusCircle className="w-6 h-6" />
                </Link>
            </main>
        </div>
    );
}
