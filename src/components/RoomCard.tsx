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
        const text = `🚨 This study session is filling up fast!\\n\\n📚 ${room.title}${room.course_code ? ` (${room.course_code})` : ''}\\n👥 Only ${room.max_members} spots total\\n\\n⏳ Don't miss out — lock in here: ${window.location.origin}/room/${room.room_id}`;
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
            className="group flex flex-col glass-card border border-white/5 hover:border-brand-accent/50 hover:bg-white/[0.07] transition-all duration-500 hover:-translate-y-2 overflow-hidden relative p-0"
        >
            <div className="aspect-video w-full relative overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={room.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/90 to-transparent"></div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 z-20">
                    <button
                        onClick={handleShare}
                        className="p-2.5 bg-brand-accent/80 hover:bg-brand-accent border border-white/20 rounded-full text-white transition-all backdrop-blur-md shadow-lg"
                        title="Share to WhatsApp"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
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
                    <div className="absolute top-3 right-3 bg-indigo-500/90 border border-indigo-400 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-transform group-hover:scale-110 origin-top-right z-20">
                        <Users className="w-3 h-3" />
                        {buddyCount} {buddyCount === 1 ? 'Buddy' : 'Buddies'} Inside
                    </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-20">
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
