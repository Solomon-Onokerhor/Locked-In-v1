'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, Users, Calendar } from 'lucide-react';
import type { Room } from '@/types';

interface RoomCardProps {
    room: Room;
    buddyCount?: number;
}

export function RoomCard({ room, buddyCount }: RoomCardProps) {
    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const text = `🚨 This ${room.room_type === 'Skill' ? 'skill-building' : 'study'} session is filling up fast!\\n\\n💡 ${room.title}${room.course_code ? ` (${room.course_code})` : ''}\\n👥 Only ${room.max_members} spots total\\n\\n⏳ Don't miss out — lock in here: ${window.location.origin}/room/${room.room_id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Calculate room status
    const now = new Date();
    const startTime = new Date(room.date_time);
    const endTime = new Date(startTime.getTime() + (room.duration_minutes || 60) * 60000);
    const isLive = now >= startTime && now <= endTime;
    const isUpcoming = now < startTime;

    const imageUrl = room.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';

    return (
        <Link
            href={`/room/${room.room_id}`}
            className="group flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-white/30 hover:bg-[#0f0f0f] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative shadow-lg hover:shadow-2xl"
            data-tour="join-room"
        >
            <div className="aspect-video w-full relative overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={room.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${room.room_type === 'Study' ? 'bg-black/50 border-white/20 text-white' : 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'}`}>
                        {room.room_type}
                    </span>
                    {room.course_code && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border bg-black/50 border-white/20 text-white">
                            {room.course_code}
                        </span>
                    )}
                </div>

                {/* Share Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 z-20">
                    <button
                        onClick={handleShare}
                        className="p-2 bg-black/50 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-md"
                        title="Share to WhatsApp"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Buddy Activity Indicator */}
                {(buddyCount || 0) > 0 && (
                    <div className="absolute bottom-3 right-16 bg-white/10 border border-white/20 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 z-20">
                        <Users className="w-3 h-3" />
                        {buddyCount} {buddyCount === 1 ? 'Buddy' : 'Buddies'} Inside
                    </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-20">
                    <div className="flex gap-2">
                        {isLive && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border bg-red-500/20 border-red-500/50 text-red-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                Live
                            </span>
                        )}
                        {isUpcoming && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border bg-blue-500/20 border-blue-500/50 text-blue-400 flex items-center gap-1.5">
                                Upcoming
                            </span>
                        )}
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/10">
                        {room.duration_minutes}m
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col z-10 bg-[#0a0a0a]">
                <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1 mb-1 tracking-tight">
                    {room.title}
                </h3>
                <p className="text-sm text-[#888888] mb-4 line-clamp-2 leading-relaxed">{room.description || 'No description provided.'}</p>

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#888888]" />
                            <span className="text-xs font-semibold text-[#888888]">{room.max_members} Limit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#888888]" />
                            <span className="text-xs font-semibold text-[#888888]">
                                {new Date(room.date_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
