'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Send, Check, Clock, MessageCircle, ChevronDown } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface ChatMessage {
    message_id: string;
    room_id: string;
    sender_id: string;
    text: string;
    timestamp: string;
    sender_name?: string;
    sender_is_verified?: boolean;
    sender_badge_label?: string;
}

interface SenderInfo {
    name: string;
    is_verified: boolean;
    badge_label?: string;
}

interface ChatProps {
    roomId: string;
    userProfile: Profile | null;
}

export function Chat({ roomId, userProfile }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [senderInfo, setSenderInfo] = useState<Record<string, SenderInfo>>({});
    const senderRef = useRef<Record<string, SenderInfo>>({});
    const scrollRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isFocused, setIsFocused] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageTime = useRef<number>(0);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        senderRef.current = senderInfo;
    }, [senderInfo]);

    // Resolve a sender info using ref (stable, no stale closure)
    const resolveSenderInfo = useCallback(async (senderId: string): Promise<SenderInfo> => {
        if (senderRef.current[senderId]) {
            return senderRef.current[senderId];
        }
        if (senderId === userProfile?.id) {
            const info = {
                name: userProfile?.name || 'You',
                is_verified: userProfile?.is_verified || false,
                badge_label: userProfile?.badge_label
            };
            setSenderInfo(prev => ({ ...prev, [senderId]: info }));
            return info;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('name, is_verified, badge_label')
                .eq('id', senderId)
                .single();

            const info = {
                name: data?.name || 'Unknown',
                is_verified: data?.is_verified || false,
                badge_label: data?.badge_label
            };
            setSenderInfo(prev => ({ ...prev, [senderId]: info }));
            return info;
        } catch (err) {
            console.error('Exception resolving sender info:', err);
            const unknown = { name: 'Unknown', is_verified: false };
            return unknown;
        }
    }, [userProfile]);

    // Fetch all messages and resolve sender names
    const fetchMessages = useCallback(async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .order('timestamp', { ascending: true });

        if (data) {
            // Resolve all unique sender info
            const uniqueSenderIds = [...new Set(data.map(m => m.sender_id))];
            const infoMap: Record<string, SenderInfo> = {};

            for (const id of uniqueSenderIds) {
                if (id === userProfile?.id) {
                    infoMap[id] = {
                        name: userProfile?.name || 'You',
                        is_verified: userProfile?.is_verified || false,
                        badge_label: userProfile?.badge_label
                    };
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name, is_verified, badge_label')
                        .eq('id', id)
                        .single();
                    infoMap[id] = {
                        name: profile?.name || 'Unknown',
                        is_verified: profile?.is_verified || false,
                        badge_label: profile?.badge_label
                    };
                }
            }

            setSenderInfo(prev => ({ ...prev, ...infoMap }));
            setMessages(data.map(m => ({
                ...m,
                sender_name: infoMap[m.sender_id]?.name || 'Unknown',
                sender_is_verified: infoMap[m.sender_id]?.is_verified,
                sender_badge_label: infoMap[m.sender_id]?.badge_label
            })));
        }
    }, [roomId, userProfile]);

    useEffect(() => {
        fetchMessages();

        const handleFocus = () => {
            setIsFocused(true);
            setUnreadCount(0);
        };
        const handleBlur = () => setIsFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        const channel = supabase
            .channel(`room-chat:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    const info = await resolveSenderInfo(newMsg.sender_id);

                    // Update state properly with the new info so child components/renders can use it
                    setSenderInfo(prev => ({ ...prev, [newMsg.sender_id]: info }));

                    newMsg.sender_name = info.name;
                    newMsg.sender_is_verified = info.is_verified;
                    newMsg.sender_badge_label = info.badge_label;

                    setMessages((prev) => [...prev, newMsg]);

                    const isOwn = newMsg.sender_id === userProfile?.id;
                    if (!isOwn) {
                        // Play sound
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
                            audio.volume = 0.5;
                            audio.play().catch(() => { });
                        } catch (e) { }

                        // Handle focus/scroll notifications
                        if (!isFocused) {
                            setUnreadCount(prev => prev + 1);
                        } else if (!isAtBottom) {
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [roomId, fetchMessages, resolveSenderInfo, isFocused, isAtBottom, userProfile?.id]);

    // Handle Tab Title Flashing
    useEffect(() => {
        if (unreadCount > 0 && !isFocused) {
            const originalTitle = document.title;
            const interval = setInterval(() => {
                document.title = document.title === originalTitle
                    ? `(${unreadCount}) New Message!`
                    : originalTitle;
            }, 1000);

            return () => {
                clearInterval(interval);
                document.title = originalTitle;
            };
        }
    }, [unreadCount, isFocused]);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(atBottom);
        if (atBottom) setUnreadCount(0);
    };

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadCount(0);
    };

    // Auto-scroll to bottom only if already at bottom or own message
    useEffect(() => {
        if (isAtBottom || (messages.length > 0 && messages[messages.length - 1].sender_id === userProfile?.id)) {
            scrollToBottom();
        }
    }, [messages, userProfile?.id]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage || !userProfile) return;

        // --- RATE LIMITING & VALIDATION ---
        const now = Date.now();
        if (now - lastMessageTime.current < 500) { // 2 messages per second
            return;
        }

        if (trimmedMessage.length > 500) {
            alert('Message is too long (Max 500 characters)');
            return;
        }
        // ----------------------------------

        setLoading(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        room_id: roomId,
                        sender_id: userProfile.id,
                        text: trimmedMessage,
                    }
                ]);

            if (error) throw error;
            lastMessageTime.current = now;
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Enter key to send
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isOwnMessage = (senderId: string) => senderId === userProfile?.id;

    // Generate avatar color from sender ID
    const getAvatarColor = (senderId: string) => {
        const colors = [
            'bg-white/10', 'bg-white/10', 'bg-white/10',
            'bg-white/10', 'bg-white/20', 'bg-white/15', 'bg-white/10'
        ];
        const hash = senderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div className="flex flex-col h-[500px] bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-gray-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Live Chat</h3>
                        <span className="text-[10px] text-gray-500">{messages.length} messages</span>
                    </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                    Real-time
                </span>
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative"
            >
                {/* Notification Pill */}
                {unreadCount > 0 && !isAtBottom && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce z-20"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
                    </button>
                )}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <MessageCircle className="w-10 h-10 mb-3 opacity-15" />
                        <p className="text-sm font-semibold text-gray-500">No messages yet</p>
                        <p className="text-xs text-gray-600 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const own = isOwnMessage(msg.sender_id);
                        const info = senderInfo[msg.sender_id];
                        const senderName = msg.sender_name || info?.name || 'Unknown';
                        const isVerified = msg.sender_is_verified ?? info?.is_verified;
                        const badgeLabel = msg.sender_badge_label ?? info?.badge_label;

                        return (
                            <div
                                key={msg.message_id}
                                className={`flex gap-2.5 group ${own ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Other user's avatar */}
                                {!own && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUserId(msg.sender_id)}
                                        className={`w-8 h-8 rounded-full ${getAvatarColor(msg.sender_id)} flex items-center justify-center flex-shrink-0 mt-0.5 hover:ring-2 hover:ring-white/20 transition-all cursor-pointer`}
                                    >
                                        <span className="text-white text-xs font-bold">
                                            {senderName.charAt(0).toUpperCase()}
                                        </span>
                                    </button>
                                )}

                                <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {/* Sender name (not for own messages) */}
                                    {!own && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUserId(msg.sender_id)}
                                            className="flex items-center gap-1.5 mb-1 ml-1 hover:opacity-80 transition-opacity cursor-pointer text-left"
                                        >
                                            <span className="text-[11px] text-gray-500 font-semibold group-hover:text-brand-accent transition-colors">{senderName}</span>
                                            {isVerified && (
                                                <div className="bg-white/10 rounded-full p-0.5" title={badgeLabel || 'Verified Scholar'}>
                                                    <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                                </div>
                                            )}
                                            {badgeLabel && (
                                                <span className="text-[8px] text-brand-accent font-black uppercase tracking-tighter bg-brand-accent/5 px-1 rounded">{badgeLabel}</span>
                                            )}
                                        </button>
                                    )}

                                    {/* Message bubble */}
                                    <div className={`px-4 py-2.5 text-sm leading-relaxed ${own
                                        ? 'bg-white/10 text-white rounded-2xl rounded-br-md'
                                        : 'bg-white/[0.06] text-gray-200 rounded-2xl rounded-bl-md border border-white/[0.04]'
                                        }`}>
                                        {msg.text}
                                    </div>

                                    {/* Timestamp */}
                                    <span className={`text-[10px] text-gray-600 mt-1 flex items-center gap-1 ${own ? 'mr-1' : 'ml-1'}`}>
                                        {own ? (
                                            <Check className="w-2.5 h-2.5 text-gray-300" />
                                        ) : (
                                            <Clock className="w-2.5 h-2.5" />
                                        )}
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} />
            </div>


            {/* Message Input */}
            <form
                onSubmit={handleSendMessage}
                className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.03] flex items-center gap-3"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    maxLength={500}
                    className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-white/10"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </form>

            <UserProfileModal
                isOpen={!!selectedUserId}
                onClose={() => setSelectedUserId(null)}
                userId={selectedUserId || ''}
                currentUserProfile={userProfile}
            />
        </div>
    );
}
