'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';
import Link from 'next/link';
import { Search, BookOpen, Users, Calendar, ArrowRight, PlusCircle, Trophy } from 'lucide-react';
import { RoomCard } from './RoomCard';
import { SoloTimer } from './SoloTimer';

interface DashboardClientProps {
    initialRooms: Room[];
}

export function DashboardClient({ initialRooms }: DashboardClientProps) {
    const { session, profile, loading } = useAuth();
    const [rooms, setRooms] = useState<Room[]>(initialRooms);
    const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set());
    const [buddyRoomCounts, setBuddyRoomCounts] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<'all' | 'study' | 'skill' | 'my_rooms' | 'upcoming'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth');
        } else if (session) {
            fetchPrivateData();
        }
    }, [session, loading, router]);

    const fetchPrivateData = async () => {
        // Fetch user's joined rooms
        const { data: memberData } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', session!.user.id);

        if (memberData) {
            setMyRoomIds(new Set(memberData.map(m => m.room_id)));
        }

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

            {/* Premium Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-accent/20 rounded-full blur-[80px] opacity-50 animate-pulse-glow"></div>
                <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[64px] opacity-40 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[64px] opacity-30 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
            </div>

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10 animate-fade-in">
                {/* Header Section */}
                <header className="mb-6 md:mb-10 mt-2 md:mt-0">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Welcome back{session?.user?.email ? `, ${session.user.email.split('@')[0]}` : ''}</h2>
                            <p className="text-gray-500 text-sm md:text-lg mt-1">Lock In. Level Up.</p>
                        </div>
                        <Link
                            href="/create-room"
                            className="hidden md:flex bg-brand-accent hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold items-center gap-2 transition-all shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 active:scale-95"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Host Room
                        </Link>
                    </div>

                    {/* Premium Leaderboard Promo Banner */}
                    <Link href="/leaderboard" className="block w-full glass-card hover:bg-amber-500/5 transition-all p-5 cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                    <Trophy className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg tracking-wide">Campus Leaderboards are live! <span className="text-amber-400">🏆</span></h3>
                                    <p className="text-gray-400 text-sm mt-0.5">See which faculty is currently dominating UMaT.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-amber-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 duration-300 hidden md:block" />
                        </div>
                    </Link>
                </header>

                {/* Solo Lock-In Timer */}
                <div className="mb-6 md:mb-10">
                    <SoloTimer />
                </div>

                {/* Premium Metric Cards */}
                <div className="flex gap-4 md:grid md:grid-cols-2 lg:gap-6 mb-8 md:mb-12 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
                    <div onClick={() => router.push('/buddies')} className="cursor-pointer min-w-[240px] md:min-w-0 snap-center flex-shrink-0 glass-card p-6 flex flex-col gap-2 group">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5 text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                                    <Users className="w-4 h-4 text-indigo-400" />
                                </div>
                                Buddies
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-3xl font-black text-white mt-2 tracking-tight drop-shadow-md">
                            {profile ? profile.study_buddies : '0'}
                        </div>
                    </div>
                    <div className="min-w-[240px] md:min-w-0 snap-center flex-shrink-0 glass-card p-6 flex flex-col gap-2 group">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5 text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-amber-400 transition-colors">
                                <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                                    <BookOpen className="w-4 h-4 text-amber-400" />
                                </div>
                                Streak
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white mt-2 tracking-tight drop-shadow-md">
                            {profile ? `${profile.current_streak} Days` : '0 Days'}
                        </div>
                    </div>
                </div>

                {/* Premium Search + Tabs */}
                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                        <div className="flex glass-panel p-1.5 w-fit max-w-full overflow-x-auto scrollbar-hide">
                            {['all', 'study', 'skill', 'my_rooms', 'upcoming'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-5 py-2.5 text-[13px] font-bold tracking-wide rounded-xl transition-all duration-300 whitespace-nowrap ${activeTab === tab
                                        ? 'bg-brand-accent text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab === 'my_rooms' ? 'My Rooms' : tab === 'upcoming' ? 'Upcoming' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full xl:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by title or course code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full glass-panel !bg-black/20 focus:!bg-black/40 py-3.5 pl-11 pr-5 focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 outline-none transition-all placeholder:text-gray-600 text-white text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Room List */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${activeTab === 'upcoming' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        <h3 className="text-lg md:text-2xl font-bold text-white">
                            {activeTab === 'all' && 'All Rooms'}
                            {activeTab === 'study' && 'Study Rooms'}
                            {activeTab === 'skill' && 'Skill-Building Rooms'}
                            {activeTab === 'my_rooms' && 'My Rooms'}
                            {activeTab === 'upcoming' && 'Your Upcoming Sessions'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 text-center glass-card animate-fade-in-up">
                                <div className="w-24 h-24 bg-brand-accent/10 rounded-full flex items-center justify-center mb-8 border border-brand-accent/20 shadow-[0_0_30px_rgba(37,99,235,0.15)] animate-float">
                                    {activeTab === 'upcoming' ? <Calendar className="w-10 h-10 text-brand-accent drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" /> : <BookOpen className="w-10 h-10 text-brand-accent drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 tracking-tight">
                                    {activeTab === 'my_rooms' ? "You haven't joined any rooms yet" :
                                        activeTab === 'upcoming' ? "No upcoming sessions found" :
                                            "No sessions found"}
                                </h3>
                                <p className="text-gray-400 mt-2 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
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
                                    className="px-10 py-4 bg-brand-accent hover:bg-blue-600 text-white text-base font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] flex items-center gap-3 active:scale-95"
                                >
                                    {activeTab === 'all' ? <PlusCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                                    {activeTab === 'all' ? "Host a Session" : "Explore All Rooms"}
                                </Link>
                            </div>
                        ) : (
                            filteredRooms.map((room) => (
                                <RoomCard key={room.room_id} room={room} buddyCount={buddyRoomCounts[room.room_id] || 0} />
                            ))
                        )}

                        <Link href="/create-room" className="hidden md:flex glass-card !bg-transparent hover:!bg-brand-accent/5 border-dashed border-2 !border-white/10 hover:!border-brand-accent/50 cursor-pointer items-center justify-center p-8 min-h-[320px] group transition-all">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:bg-brand-accent/20 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                    <PlusCircle className="text-3xl text-gray-500 group-hover:text-brand-accent w-8 h-8 transition-colors" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2 tracking-wide group-hover:text-brand-accent transition-colors">Create New Room</h4>
                                <p className="text-gray-500 text-sm font-medium">Start your own session</p>
                            </div>
                        </Link>
                    </div>
                </section>

                <Link
                    href="/create-room"
                    className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 active:scale-90 transition-transform"
                >
                    <PlusCircle className="w-6 h-6 text-white" />
                </Link>
            </main>
        </div>
    );
}
