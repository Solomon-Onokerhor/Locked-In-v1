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

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update the current time every 10 seconds to keep the UI fresh without manual refresh
        const interval = setInterval(() => {
            setNow(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const sessionDate = new Date(room.date_time);
    const startTime = sessionDate.getTime();
    const endTime = startTime + (room.duration_minutes || 60) * 60000;
    const tenMinutesBefore = startTime - 10 * 60000;

    const canAccessLink = now.getTime() >= tenMinutesBefore && now.getTime() <= endTime;
    const sessionStatus = now.getTime() < startTime ? 'upcoming' : (now.getTime() <= endTime ? 'live' : 'ended');

    return (
        <div className="min-h-screen bg-brand-primary flex flex-col md:flex-row">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full overflow-y-auto px-4 pt-20 pb-24 md:px-8 md:pt-8 md:ml-[280px]">
                <div className="max-w-[1200px] w-full mx-auto flex flex-col min-h-[calc(100vh-100px)]">

                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex flex-col gap-2">
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 text-sm font-medium">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                            <h2 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">{room.title}</h2>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm font-mono bg-white/5 px-2 py-1 rounded">
                                    Code: {roomId.substring(0, 8)}
                                </span>
                                <div className="flex h-6 items-center justify-center rounded-full border border-white/20 px-3">
                                    <span className="text-gray-300 text-xs font-bold tracking-wider uppercase">{room.room_type}</span>
                                </div>
                                {room.course_code && (
                                    <div className="flex h-6 items-center justify-center rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3">
                                        <span className="text-brand-accent text-xs font-bold tracking-wider uppercase">{room.course_code}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {canDelete && (
                            <div className="flex gap-2 self-start md:self-center">
                                {!showDeleteConfirm ? (
                                    <>
                                        <Link href={`/edit-room/${roomId}`} className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                            <Edit className="w-4 h-4" /> Edit
                                        </Link>
                                        <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleDeleteRoom} disabled={isDeleting} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                            {isDeleting ? 'Deleting...' : 'Confirm'}
                                        </button>
                                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-bold">
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </header>

                    {!session && (
                        <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gray-400" />
                                <div>
                                    <h4 className="text-white font-bold text-sm">Preview Mode</h4>
                                    <p className="text-gray-400 text-xs">Sign in to lock in and chat with scholars.</p>
                                </div>
                            </div>
                            <Link href="/auth" className="bg-brand-accent text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors whitespace-nowrap">
                                Sign In
                            </Link>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] bg-white/[0.02] border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden">
                        
                        <div className="flex flex-col items-center mb-6 text-center">
                            {sessionStatus === 'upcoming' ? (
                                <div className="inline-flex flex-col items-center">
                                    <span className="text-sm font-bold tracking-[0.2em] text-brand-accent uppercase mb-2">Starts Soon</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-white">Get Ready to Lock In</h3>
                                </div>
                            ) : sessionStatus === 'live' ? (
                                <div className="inline-flex flex-col items-center">
                                    <span className="text-sm font-bold tracking-[0.2em] text-red-500 uppercase mb-2 animate-pulse flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Live Now
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-black text-white">Session in Progress</h3>
                                </div>
                            ) : (
                                <div className="inline-flex flex-col items-center opacity-50">
                                    <span className="text-sm font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Session Over</span>
                                    <h3 className="text-2xl md:text-3xl font-black text-white">Ended</h3>
                                </div>
                            )}
                        </div>

                        {/* Lock In / Join Actions */}
                        <div className="flex flex-col items-center gap-4 z-10 w-full max-w-md">
                            {session && !membership && (
                                <button
                                    onClick={handleLockIn}
                                    disabled={lockingIn || sessionStatus === 'ended'}
                                    className="w-full py-4 px-8 rounded-full bg-brand-accent text-brand-primary text-lg font-black tracking-wide hover:scale-105 active:scale-95 transition-all text-center disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    {lockingIn ? 'LOCKING IN...' : room.is_paid ? `PAY GHS ${room.price} TO JOIN` : 'LOCK IN TO SESSION'}
                                </button>
                            )}

                            {membership && room.session_mode === 'virtual' && room.meeting_link && canAccessLink && (
                                <a
                                    href={room.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 px-8 rounded-full bg-brand-accent text-brand-primary text-lg font-black tracking-wide hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    <Video className="w-6 h-6" /> JOIN CALL
                                </a>
                            )}

                            {membership && room.session_mode === 'virtual' && !canAccessLink && sessionStatus === 'upcoming' && (
                                <div className="w-full py-3 px-6 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" /> Link unlocks 10m before start
                                </div>
                            )}

                            {membership && sessionStatus === 'live' && (
                                <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-brand-accent/30 text-brand-accent text-sm font-bold bg-brand-accent/5">
                                    <CheckCircle className="w-4 h-4" /> You are Locked In
                                </div>
                            )}

                            {/* Location info if in person */}
                            {room.session_mode === 'in_person' && (
                                <div className="mt-2 p-4 w-full bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center gap-1">
                                    <div className="flex items-center gap-2 text-white">
                                        <MapPin className="w-4 h-4 text-brand-accent" />
                                        <span className="font-bold text-sm">{room.physical_location}</span>
                                    </div>
                                    {room.location_note && <span className="text-xs text-gray-400 mt-1">{room.location_note}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Members List (Avatars row at bottom for active feel) */}
                    <div className="pt-6 pb-8">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-accent" />
                                Scholars ({members.length}/{room.max_members})
                            </h3>
                            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 text-xs font-bold transition-all">
                                <Share2 className="w-4 h-4" /> Invite
                            </button>
                        </div>

                        {members.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">No scholars have locked in yet.</p>
                        ) : (
                            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                                {members.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedUserId(member.user_id)}
                                        className="flex flex-col items-center gap-3 min-w-[70px] group transition-transform hover:scale-105"
                                    >
                                        <div className="relative">
                                            <div className="size-14 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center text-white font-bold group-hover:border-brand-accent/50 transition-colors">
                                                {member.profiles?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            {member.role_in_room === 'creator' && (
                                                <div className="absolute -bottom-1 -right-1 size-5 bg-brand-accent rounded-full border-2 border-brand-primary flex items-center justify-center" title="Host">
                                                    <span className="text-brand-primary text-[10px]">&starf;</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium truncate w-full text-center group-hover:text-white transition-colors">
                                            {member.profiles?.name ? member.profiles.name.split(' ')[0] : 'Scholar'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Section */}
                    {membership ? (
                        <div className="mt-4 flex-1 animate-fade-in-up mb-8 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
                            <Chat roomId={room.room_id} userProfile={profile} />
                        </div>
                    ) : (
                        <div className="mt-4 p-8 border border-white/10 rounded-3xl bg-white/[0.02] text-center mb-8">
                            <Lock className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Members Only Chat</h3>
                            <p className="text-sm text-gray-400">Lock in to join the conversation and access resources.</p>
                        </div>
                    )}
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
