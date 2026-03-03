'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';
import Link from 'next/link';
import { Search, BookOpen, Zap, Users, Calendar, DollarSign, ArrowRight, PlusCircle, Share2 } from 'lucide-react';

export default function DashboardPage() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [myRoomIds, setMyRoomIds] = useState<Set<string>>(new Set());
    const [buddyRoomCounts, setBuddyRoomCounts] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<'all' | 'study' | 'skill' | 'my_rooms' | 'upcoming'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Removal of mandatory redirect to allow preview mode
    // useEffect(() => {
    //     if (!loading && !session) router.push('/auth');
    // }, [loading, session, router]);

    useEffect(() => {
        fetchRooms();
    }, [session]);

    const fetchRooms = async () => {
        const { data: roomsData } = await supabase
            .from('rooms')
            .select(`
                room_id, room_type, session_mode, title, description, image_url,
                created_by, date_time, duration_minutes, physical_location, 
                location_note, max_members, is_paid, price, commission_rate, 
                status, tags, course_code, created_at
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (session) {
            const { data: memberData } = await supabase
                .from('room_members')
                .select('room_id')
                .eq('user_id', session.user.id);

            if (memberData) {
                setMyRoomIds(new Set(memberData.map(m => m.room_id)));
            }

            // Fetch buddy activity
            const { data: buddiesData } = await supabase
                .from('buddy_connections')
                .select('*')
                .or(`user_id.eq.${session.user.id},buddy_id.eq.${session.user.id}`);

            let buddyIds: string[] = [];
            if (buddiesData) {
                buddyIds = buddiesData.map(b => b.user_id === session.user.id ? b.buddy_id : b.user_id);
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
        }

        if (roomsData) setRooms(roomsData as Room[]);
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

            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-accent/20 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] opacity-30"></div>
            </div>

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10">
                {/* Header Section */}
                <header className="mb-6 md:mb-10 mt-2 md:mt-0">
                    <div className="flex items-end justify-between">
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
                </header>

                {/* Metric Cards */}
                <div className="flex gap-3 md:grid md:grid-cols-2 md:gap-6 mb-6 md:mb-10 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
                    <div className="min-w-[200px] md:min-w-0 snap-center flex-shrink-0 bg-white/[0.04] border border-white/[0.06] backdrop-blur-md p-5 rounded-2xl flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            Buddies
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">
                            {profile ? profile.study_buddies : '0'}
                        </div>
                    </div>
                    <div className="min-w-[200px] md:min-w-0 snap-center flex-shrink-0 bg-white/[0.04] border border-white/[0.06] backdrop-blur-md p-5 rounded-2xl flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            Streak
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">
                            {profile ? `${profile.current_streak} Days` : '0 Days'}
                        </div>
                    </div>
                </div>

                {/* Search + Tabs + Faculty Filters */}
                <div className="flex flex-col gap-6 mb-8">
                    {/* Primary Tabs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex bg-white/[0.04] border border-white/[0.06] p-1 rounded-full w-fit max-w-full overflow-x-auto scrollbar-hide">
                            {['all', 'study', 'skill', 'my_rooms', 'upcoming'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 md:px-5 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                        ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {tab === 'my_rooms' ? 'My Rooms' : tab === 'upcoming' ? 'Upcoming' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search by title or course code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full py-2.5 pl-10 pr-4 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 text-white text-sm"
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
                            <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center glass-card border border-white/5 rounded-3xl animate-fade-in-up">
                                <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mb-6 border border-brand-accent/20">
                                    {activeTab === 'upcoming' ? <Calendar className="w-10 h-10 text-brand-accent opacity-80" /> : <BookOpen className="w-10 h-10 text-brand-accent opacity-80" />}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                                    {activeTab === 'my_rooms' ? "You haven't joined any rooms yet" :
                                        activeTab === 'upcoming' ? "No upcoming sessions found" :
                                            "No sessions found"}
                                </h3>
                                <p className="text-gray-400 max-w-md mx-auto mb-8">
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
                                    className="px-8 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
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

                        <Link href="/create-room" className="hidden md:flex glass-card rounded-2xl border-dashed border-2 !border-white/10 !bg-transparent hover:!border-brand-accent cursor-pointer items-center justify-center p-6 min-h-[300px] group transition-all">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-accent/20">
                                    <PlusCircle className="text-3xl text-gray-500 group-hover:text-brand-accent w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">Create New Room</h4>
                                <p className="text-gray-400 text-sm">Start your own session</p>
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

function RoomCard({ room, buddyCount }: { room: Room, buddyCount?: number }) {
    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const text = `🚀 Lock in to my study session on Locked In!\n\n📚 Topic: ${room.title}${room.course_code ? `\n🔢 Course: ${room.course_code}` : ''}\n\nLock in here: ${window.location.host}/room/${room.room_id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Calculate room status
    const now = new Date();
    const startTime = new Date(room.date_time);
    const endTime = new Date(startTime.getTime() + room.duration_minutes * 60000);
    const isLive = now >= startTime && now <= endTime;
    const isEnded = now > endTime;
    const isUpcoming = now < startTime;

    return (
        <Link
            href={`/room/${room.room_id}`}
            className="group flex flex-col glass-card border border-white/5 hover:border-brand-accent/50 hover:bg-white/[0.07] transition-all duration-500 hover:-translate-y-2 overflow-hidden relative p-0"
        >
            <div className="aspect-video w-full bg-cover bg-center relative" style={{ backgroundImage: `url('${room.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop'}')` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 to-transparent"></div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <button
                        onClick={handleShare}
                        className="p-2.5 bg-brand-accent/80 hover:bg-brand-accent border border-white/20 rounded-full text-white transition-all backdrop-blur-md shadow-lg"
                        title="Share to WhatsApp"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter backdrop-blur-md border ${room.room_type === 'Study' ? 'bg-brand-accent/40 border-brand-accent/20 text-blue-100' : 'bg-amber-500/40 border-amber-500/20 text-amber-100'}`}>
                        {room.room_type}
                    </span>
                    {room.course_code && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter backdrop-blur-md border bg-white/10 border-white/10 text-white">
                            {room.course_code}
                        </span>
                    )}
                </div>

                {/* Buddy Activity Indicator */}
                {(buddyCount || 0) > 0 && (
                    <div className="absolute top-3 right-3 bg-indigo-500/90 border border-indigo-400 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-transform group-hover:scale-110 origin-top-right">
                        <Users className="w-3 h-3" />
                        {buddyCount} {buddyCount === 1 ? 'Buddy' : 'Buddies'} Inside
                    </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                    <div className="flex gap-2">
                        {isLive && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border bg-red-500/40 border-red-500/40 text-white flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                Live
                            </span>
                        )}
                        {isUpcoming && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border bg-amber-500/40 border-amber-500/20 text-white flex items-center gap-1.5">
                                Upcoming
                            </span>
                        )}
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-white/90 border border-white/5">
                        {room.duration_minutes}m
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col z-10">
                <h3 className="text-base font-bold text-white group-hover:text-brand-accent transition-colors line-clamp-1 mb-1">
                    {room.title}
                </h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{room.description || 'No description provided.'}</p>

                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">{room.max_members} Limit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">
                                {new Date(room.date_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
