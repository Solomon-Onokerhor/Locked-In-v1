'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room, RoomMember } from '@/types';
import {
    AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, CreditCard, Lock, MapPin, Share2, Trash2, Users, Video
} from 'lucide-react';
import Link from 'next/link';
import { Chat } from '@/components/Chat';

export default function RoomPageClient({ roomId }: { roomId: string }) {
    const { session, profile, loading: authLoading, refreshProfile } = useAuth();
    const router = useRouter();

    const [room, setRoom] = useState<Room | null>(null);
    const [membership, setMembership] = useState<RoomMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [lockingIn, setLockingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !session) router.push('/auth');
    }, [authLoading, session, router]);

    useEffect(() => {
        if (session && roomId) {
            fetchRoomData();
            checkMembership();
        }
    }, [session, roomId]);

    const fetchRoomData = async () => {
        const { data } = await supabase
            .from('rooms')
            .select(`
                room_id, room_type, session_mode, title, description, image_url,
                created_by, date_time, duration_minutes, physical_location, 
                location_note, max_members, is_paid, price, commission_rate, 
                status, tags, course_code, created_at
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
            await refreshProfile();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to lock in');
        } finally {
            setLockingIn(false);
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
        const text = `🚀 Lock in to my study session on Locked In!\n\n📚 Topic: ${room?.title}${room?.course_code ? `\n🔢 Course: ${room.course_code}` : ''}\n⏰ Time: ${new Date(room?.date_time || '').toLocaleString()}\n\nLock in here: ${window.location.protocol}//${window.location.host}/room/${roomId}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading || !session || !room) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    const isCreator = room.created_by === session.user.id;
    const isAdmin = profile?.role === 'admin';
    const canDelete = isCreator || isAdmin;

    const sessionDate = new Date(room.date_time);
    const sessionStatus = sessionDate > new Date() ? 'upcoming' : (new Date(sessionDate.getTime() + room.duration_minutes * 60000) > new Date() ? 'live' : 'ended');

    return (
        <div className="min-h-screen bg-brand-primary">
            <Sidebar />

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

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
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isDeleting}
                                        className="p-3 bg-red-500/20 border border-red-500/30 text-white hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 backdrop-blur-md shadow-lg"
                                        title={isAdmin && !isCreator ? "Delete Session (Admin)" : "Delete Session"}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        <span className="hidden sm:inline font-bold text-sm">Delete</span>
                                    </button>
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

                {!membership ? (
                    <section className="glass-card p-8 mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                                <Lock className="w-7 h-7 text-brand-accent" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-white">Lock in to this Room</h2>
                                <p className="text-gray-500 text-sm">
                                    {room.is_paid ? `Pay GHS ${room.price} to lock in to this session` : 'Free to lock in — start learning now'}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button
                            onClick={handleLockIn}
                            disabled={lockingIn}
                            className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-brand-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                        >
                            {lockingIn ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : room.is_paid ? (
                                <><CreditCard className="w-5 h-5" /> Pay & Lock In</>
                            ) : (
                                <><CheckCircle className="w-5 h-5" /> Lock In Now</>
                            )}
                        </button>
                    </section>
                ) : (
                    <section className="space-y-6">
                        <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                                <div>
                                    <h3 className="text-green-400 font-bold">You are a confirmed member</h3>
                                </div>
                            </div>

                            {room.session_mode === 'virtual' && room.meeting_link && sessionStatus === 'live' ? (
                                <a
                                    href={room.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                                >
                                    <Video className="w-4 h-4" />
                                    Lock In to Video Call
                                </a>
                            ) : room.session_mode === 'virtual' && sessionStatus === 'upcoming' ? (
                                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-gray-400">
                                    Link available when live
                                </div>
                            ) : null}
                        </div>

                        <Chat roomId={room.room_id} userProfile={profile} />
                    </section>
                )}
            </main>
        </div>
    );
}
