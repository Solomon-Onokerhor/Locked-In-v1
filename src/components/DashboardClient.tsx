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
        } else if (!loading && session && profile && !profile.faculty) {
            // Old accounts missing onboarding data → force onboarding
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
        <div className="min-h-screen bg-[#000000]">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:p-10 md:ml-[280px] relative z-10 animate-fade-in flex-1">
                <div className="max-w-[1080px] mx-auto flex flex-col gap-10">
                    {/* Header Section */}
                    <header className="flex flex-col gap-2" data-tour="welcome">
                        <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight">Welcome back{session?.user?.email ? `, ${session.user.email.split('@')[0]}` : ''}</h2>
                        <p className="text-[#888888] text-lg">Lock In. Level Up.</p>
                    </header>

                    {/* Banner */}
                    <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-white/20 bg-[#0a0a0a] gap-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-white text-xl font-bold tracking-tight">Campus Leaderboards are live! 🏆</h3>
                            <p className="text-[#888888] text-sm">Check out where you stand among your peers.</p>
                        </div>
                        <Link href="/leaderboard" className="px-6 py-3 md:py-2 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors text-center shrink-0">
                            View Rankings
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Timer Card */}
                        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/20 bg-[#0d0d0d] p-8 flex flex-col gap-6" data-tour="solo-timer">
                            <h3 className="text-white text-2xl font-bold tracking-tight">Solo Lock-In</h3>
                            <SoloTimer />
                        </div>

                        {/* Right Column Cards */}
                        <div className="col-span-1 flex flex-col gap-6">
                            <div onClick={() => router.push('/buddies')} className="flex-1 rounded-2xl border border-white/20 bg-[#0d0d0d] p-6 flex flex-col justify-between cursor-pointer group hover:border-white/40 transition-colors">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white text-lg font-bold uppercase tracking-wider">Buddies</h3>
                                    <Users className="w-6 h-6 text-[#888888]" />
                                </div>
                                <div className="flex flex-col gap-1 mt-4">
                                    <span className="text-white text-4xl font-black">{profile ? profile.study_buddies : '0'}</span>
                                    <span className="text-[#888888] text-sm">Online now</span>
                                </div>
                                <button className="mt-6 w-full py-2.5 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors">
                                    Find Buddies
                                </button>
                            </div>
                            <div className="flex-1 rounded-2xl border border-white/20 bg-[#0d0d0d] p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white text-lg font-bold uppercase tracking-wider">Streak</h3>
                                    <span className="text-[#888888]"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80q-100 0-170-70.5T240-322q0-46 17-86.5t48-73.5q25-25 57-46t64-37q-9-33-8-68t16-68q23 35 59 55t77 24q5-42-4.5-85T502-780q62 25 100 77t38 117q0 61-26 113.5T541-379q14-11 32-15t38-4q30 5 57.5 21t46.5 42q20-31 32.5-66.5T760-476q0 21-6 41t-15 39q-22 56-65 92t-99 43L480-80Z" /></svg></span>
                                </div>
                                <div className="flex flex-col gap-1 mt-4">
                                    <span className="text-white text-4xl font-black">{profile ? profile.current_streak : '0'}</span>
                                    <span className="text-[#888888] text-sm">Days active</span>
                                </div>
                                <div className="flex gap-1.5 mt-6 h-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-full ${i < (profile?.current_streak || 0) % 5 ? 'bg-white' : 'bg-white/20'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room Browser */}
                    <div className="flex flex-col gap-6" data-tour="room-tabs">
                        <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-4 gap-4">
                            <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto scrollbar-hide">
                                {['all', 'study', 'skill', 'my_rooms', 'upcoming'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`text-sm font-bold pb-4 -mb-[18px] transition-colors whitespace-nowrap ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-[#888888] hover:text-white'}`}
                                    >
                                        {tab === 'my_rooms' ? 'My Rooms' : tab === 'upcoming' ? 'Upcoming' : tab === 'all' ? 'All Rooms' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                                <input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder-[#888888] transition-colors"
                                />
                            </div>
                        </div>

                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-white/20 rounded-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                            {activeTab === 'upcoming' ? <Calendar className="w-8 h-8 text-[#888888]" /> : <BookOpen className="w-8 h-8 text-[#888888]" />}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                                            {activeTab === 'my_rooms' ? "You haven't joined any rooms yet" :
                                                activeTab === 'upcoming' ? "No upcoming sessions found" :
                                                    "No sessions found"}
                                        </h3>
                                        <p className="text-[#888888] max-w-sm mx-auto mb-8 text-sm">
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

                                <Link href="/create-room" data-tour="host-room" className="hidden md:flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5 transition-all p-8 cursor-pointer group min-h-[220px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <PlusCircle className="w-8 h-8 text-[#888888] group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-white font-bold text-lg tracking-tight group-hover:text-white transition-colors">Create New Room</h4>
                                        <p className="text-[#888888] text-sm">Start your own session</p>
                                    </div>
                                </Link>
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
