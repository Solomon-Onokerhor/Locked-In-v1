'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room, RoomMember } from '@/types';
import {
    AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, CreditCard, Lock, MapPin, Share2, Trash2, Users, Video, Check, Zap, Edit, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { Chat } from '@/components/Chat';
import { UserProfileModal } from '@/components/UserProfileModal';
import type { Profile } from '@/types';

export default function RoomPageClient({ roomId }: { roomId: string }) {
    const { session, profile, loading: authLoading, refreshProfile } = useAuth();
    const router = useRouter();

    const [room, setRoom] = useState<Room | null>(null);
    const [membership, setMembership] = useState<RoomMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [lockingIn, setLockingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [members, setMembers] = useState<(RoomMember & { profiles: Profile | null })[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [confirmingAttendance, setConfirmingAttendance] = useState(false);

    // Removal of mandatory redirect to allow preview mode
    // useEffect(() => {
    //     if (!authLoading && !session) router.push('/auth');
    // }, [authLoading, session, router]);

    useEffect(() => {
        if (roomId) {
            fetchRoomData();
            if (session) {
                checkMembership();
            }
            fetchMembers();
        }
    }, [session, roomId]);

    const fetchRoomData = async () => {
        const { data } = await supabase
            .from('rooms')
            .select(`
                room_id, room_type, session_mode, title, description, image_url,
                created_by, date_time, duration_minutes, physical_location, 
                location_note, max_members, is_paid, price, commission_rate, 
                status, tags, course_code, created_at, whatsapp_group_link, meeting_link
            `)
            .eq('room_id', roomId)
            .single();

        if (data) setRoom(data as Room);
        setLoading(false);
    };

    const checkMembership = async () => {
        const { data } = await supabase
            .from('room_members')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', session?.user.id)
            .single();

        if (data) setMembership(data as RoomMember);
    };

    const fetchMembers = async () => {
        const { data } = await supabase
            .from('room_members')
            .select('*, profiles(*)')
            .eq('room_id', roomId)
            .order('joined_at', { ascending: true });

        if (data) setMembers(data as any);
    };

    const handleLockIn = async () => {
        if (!session || !room) return;
        setLockingIn(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('join_room_atomic', {
                p_room_id: roomId,
                p_user_id: session.user.id
            });

            if (rpcError) throw rpcError;
            if (data && !data.success) throw new Error(data.error);

            await checkMembership();
            await fetchMembers();
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to lock in');
        } finally {
            setLockingIn(false);
        }
    };

    const handleConfirmAttendance = async () => {
        if (!session || !room || !membership) return;
        setConfirmingAttendance(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('confirm_room_attendance', {
                p_room_id: roomId
            });

            if (rpcError) throw rpcError;

            // Optimistic update
            setMembership({ ...membership, attendance_confirmed: true });
            await fetchMembers(); // Refresh the sidebar to show confirmed status if you ever add an indicator there
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to confirm attendance');
        } finally {
            setConfirmingAttendance(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteRoom = async () => {
        if (!room) return;

        setIsDeleting(true);
        try {
            const { error: deleteError } = await supabase
                .from('rooms')
                .delete()
                .eq('room_id', room.room_id);

            if (deleteError) throw deleteError;
            router.push('/');
        } catch (err: unknown) {
            console.error('Failed to delete room:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleShare = () => {
        const text = `🚨 I just locked in to a ${room?.room_type === 'Skill' ? 'skill-building' : 'study'} session and you need to join!\\n\\n💡 ${room?.title}${room?.course_code ? ` (${room.course_code})` : ''}\\n🗓️ ${new Date(room?.date_time || '').toLocaleString()}\\n\\n⚡ Spots are limited — lock in now: ${window.location.protocol}//${window.location.host}/room/${roomId}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading || !room) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    const isCreator = session ? room.created_by === session.user.id : false;
    const isAdmin = profile?.role === 'admin';
    const canDelete = isCreator || isAdmin;

    const sessionDate = new Date(room.date_time);
    const now = new Date();
    const startTime = sessionDate.getTime();
    const endTime = startTime + (room.duration_minutes || 60) * 60000;
    const tenMinutesBefore = startTime - 10 * 60000;

    const canAccessLink = now.getTime() >= tenMinutesBefore && now.getTime() <= endTime;
    const sessionStatus = now.getTime() < startTime ? 'upcoming' : (now.getTime() <= endTime ? 'live' : 'ended');

    return (
        <div className="min-h-screen bg-brand-primary">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                {!session && (
                    <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Scholars Preview Mode</h4>
                                <p className="text-gray-500 text-xs">You are viewing this room as a guest. Sign in to join the session and chat.</p>
                            </div>
                        </div>
                        <Link
                            href="/auth"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                        >
                            Sign In to Join
                        </Link>
                    </div>
                )}

                <section className="mb-8 relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-12 shadow-2xl min-h-[300px] flex items-end">
                    {room.image_url ? (
                        <>
                            <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-1000 hover:scale-105" style={{ backgroundImage: `url('${room.image_url}')` }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/40 to-transparent opacity-90"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-blue-900/20 opacity-50"></div>
                    )}

                    <div className="relative z-10 flex flex-col justify-end gap-6 w-full">
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm ${room.room_type === 'Study' ? 'bg-blue-500/30 border-blue-500/40 text-blue-100' : 'bg-amber-500/30 border-amber-500/40 text-amber-100'}`}>
                                    {room.room_type} Session
                                </span>
                                {room.course_code && (
                                    <span className="bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
                                        {room.course_code}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] mb-3">
                                {room.title}
                            </h1>
                            <p className="text-gray-100 text-sm md:text-xl max-w-3xl leading-snug drop-shadow-md font-medium opacity-95 mb-8">
                                {room.description || 'No description provided for this session.'}
                            </p>

                            <div className="flex flex-wrap gap-y-3 gap-x-6 items-center pt-6 border-t border-white/10">
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
                                    <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                                    <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                                        {sessionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} @ {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
                                    <Clock className="w-3.5 h-3.5 text-brand-accent" />
                                    <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                                        {room.duration_minutes}m
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
                                    <Users className="w-3.5 h-3.5 text-brand-accent" />
                                    <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                                        {room.max_members} Slots
                                    </span>
                                </div>
                            </div>
                        </div>

                        {canDelete && (
                            <div className="absolute top-0 right-0 md:relative md:top-auto md:right-auto self-start flex gap-2">
                                {!showDeleteConfirm ? (
                                    <>
                                        <Link
                                            href={`/edit-room/${roomId}`}
                                            className="p-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 backdrop-blur-md shadow-lg"
                                            title="Edit Session"
                                        >
                                            <Edit className="w-5 h-5" />
                                            <span className="hidden sm:inline font-bold text-sm">Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            disabled={isDeleting}
                                            className="p-3 bg-red-500/20 border border-red-500/30 text-white hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 backdrop-blur-md shadow-lg"
                                            title={isAdmin && !isCreator ? "Delete Session (Admin)" : "Delete Session"}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="hidden sm:inline font-bold text-sm">Delete</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 animate-fade-in">
                                        <button
                                            onClick={handleDeleteRoom}
                                            disabled={isDeleting}
                                            className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                                        >
                                            {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Confirm?
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                            className="p-4 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 flex flex-col md:flex-row md:items-center p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl gap-4">
                        {room.session_mode === 'in_person' ? (
                            <div className="flex flex-col">
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                    <span className="font-bold text-gray-300">{room.physical_location}</span>
                                </span>
                                {room.location_note && (
                                    <span className="text-xs text-gray-500 ml-6 italic">{room.location_note}</span>
                                )}
                            </div>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-blue-400" />
                                <span className="font-bold text-gray-300">Virtual Session</span>
                            </span>
                        )}
                        <span className="hidden md:block h-8 w-[1px] bg-white/10 mx-2"></span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${sessionStatus === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Session is {sessionStatus}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-6 py-4 rounded-2xl font-bold transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                        Share Session
                    </button>
                </section>

                {/* Unified Action & Status Bar */}
                <section className="glass-card p-6 border border-white/10 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Subtle animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 via-transparent to-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                        {/* Status Left */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full lg:w-auto">
                            <div className="flex items-center gap-3">
                                {room.session_mode === 'in_person' ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                        <MapPin className="w-4 h-4" />
                                        <span className="font-bold text-sm">{room.physical_location}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                        <Video className="w-4 h-4" />
                                        <span className="font-bold text-sm">Virtual Session</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                <div className={`w-2 h-2 rounded-full ${sessionStatus === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                <span className="text-sm font-bold tracking-wider text-gray-300 capitalize">{sessionStatus}</span>
                            </div>

                            {room.session_mode === 'in_person' && room.location_note && (
                                <span className="text-xs text-gray-400 italic">"{room.location_note}"</span>
                            )}
                        </div>

                        {/* Action Right */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                            <button
                                onClick={handleShare}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all flex items-center gap-2 shadow-sm"
                                title="Share Session"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>

                            {room.whatsapp_group_link && membership && (
                                <a
                                    href={room.whatsapp_group_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                                    title="Join WhatsApp Group"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.12-.407-.179-1.098-.484-1.554-.863-.456-.379-1.168-1.503-1.564-2.12-.396-.617-.417-1.127-.245-1.543.172-.417.472-.544.698-.592.226-.048.455-.008.629.071.173.08.368.428.53.766.162.338.316.634.348.74.032.106.012.272-.07.412-.082.14-.146.224-.316.42-.17.196-.301.353-.418.497-.183.226-.376.471-.161.84.215.369.832 1.272 1.638 1.954.806.682 1.458.91 1.77 1.05.312.14.542.115.753-.053.211-.168.618-.68.802-.916.184-.236.368-.192.65-.084.282.108 1.838.866 2.152 1.022.314.156.524.232.592.356.068.124.085.672-.059 1.077z" /></svg>
                                </a>
                            )}

                            {error && (
                                <span className="text-red-400 text-sm font-medium mr-2 max-w-[200px] truncate" title={error}>{error}</span>
                            )}

                            {/* Main Action Logic */}
                            {!session ? (
                                <Link
                                    href="/auth"
                                    className="px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center gap-2 hover:-translate-y-0.5"
                                >
                                    <Zap className="w-5 h-5" /> Sign In to Join
                                </Link>
                            ) : !membership ? (
                                <button
                                    onClick={handleLockIn}
                                    disabled={lockingIn}
                                    className={`px-8 py-3 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 ${room.is_paid
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                                        : 'bg-brand-accent hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)]'
                                        }`}
                                >
                                    {lockingIn ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : room.is_paid ? (
                                        <><CreditCard className="w-5 h-5" /> Pay GHS {room.price}</>
                                    ) : (
                                        <><CheckCircle className="w-5 h-5" /> Lock In Now</>
                                    )}
                                </button>
                            ) : (
                                /* User IS a member */
                                <>
                                    {room.session_mode === 'virtual' && room.meeting_link && canAccessLink ? (
                                        <a
                                            href={room.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <Video className="w-5 h-5" /> Join Call
                                        </a>
                                    ) : room.session_mode === 'virtual' && !canAccessLink && sessionStatus === 'upcoming' ? (
                                        <span className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-bold rounded-xl flex items-center gap-2">
                                            <Clock className="w-5 h-5" /> Link unlocks 10m before start
                                        </span>
                                    ) : null}

                                    {sessionStatus === 'live' && (
                                        <span className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl flex items-center gap-2 cursor-default">
                                            <CheckCircle className="w-5 h-5" /> Attended
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        {membership ? (
                            <div className="animate-fade-in-up">
                                <Chat roomId={room.room_id} userProfile={profile} />
                            </div>
                        ) : (
                            <div className="glass-card flex flex-col items-center justify-center p-12 text-center h-[600px] border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <Lock className="w-16 h-16 text-gray-600 mb-6 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                                <h3 className="text-3xl font-black text-white mb-3 tracking-tight relative z-10">Members Only Space</h3>
                                <p className="text-gray-400 max-w-sm text-lg relative z-10">Lock in to this session to view the live chat, share resources, and connect with other scholars.</p>
                            </div>
                        )}
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="glass-card p-5 sticky top-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Users className="w-4 h-4 text-brand-accent" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Scholars Locked In</h3>
                                <span className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-gray-400">
                                    {members.length}/{room.max_members}
                                </span>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {members.length === 0 ? (
                                    <p className="text-xs text-center text-gray-500 py-4">No scholars have locked in yet.</p>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 group">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedUserId(member.user_id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:border-brand-accent/50 transition-colors cursor-pointer"
                                            >
                                                {member.profiles?.name?.charAt(0).toUpperCase() || '?'}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedUserId(member.user_id)}
                                                        className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer text-left"
                                                    >
                                                        <p className="text-xs font-bold text-white truncate group-hover:text-brand-accent transition-colors">
                                                            {member.profiles?.name || 'Scholar'}
                                                            {session && member.user_id === session.user.id && ' (You)'}
                                                        </p>
                                                        {member.profiles?.is_verified && (
                                                            <div className="bg-blue-500 rounded-full p-0.5" title={member.profiles?.badge_label || 'Verified Scholar'}>
                                                                <Check className="w-1.5 h-1.5 text-white" strokeWidth={5} />
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                                                        {member.role_in_room === 'creator' ? 'Host' : 'Member'}
                                                    </p>
                                                    {member.profiles?.badge_label && (
                                                        <>
                                                            <span className="text-gray-700">•</span>
                                                            <span className="text-[8px] text-brand-accent font-black uppercase px-1 rounded bg-brand-accent/5">
                                                                {member.profiles.badge_label}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                <UserProfileModal
                    isOpen={!!selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    userId={selectedUserId || ''}
                    currentUserProfile={profile}
                />
            </main>
        </div>
    );
}
