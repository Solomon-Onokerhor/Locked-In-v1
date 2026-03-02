'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Send, Clock, MessageCircle } from 'lucide-react';

interface ChatMessage {
    message_id: string;
    room_id: string;
    sender_id: string;
    text: string;
    timestamp: string;
    sender_name?: string;
}

interface ChatProps {
    roomId: string;
    userProfile: Profile | null;
}

export function Chat({ roomId, userProfile }: ChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [senderNames, setSenderNames] = useState<Record<string, string>>({});
    const namesRef = useRef<Record<string, string>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    // Keep ref in sync with state
    useEffect(() => {
        namesRef.current = senderNames;
    }, [senderNames]);

    // Resolve a sender name using ref (stable, no stale closure)
    const resolveSenderName = useCallback(async (senderId: string): Promise<string> => {
        if (namesRef.current[senderId]) return namesRef.current[senderId];
        if (senderId === userProfile?.id) {
            const name = userProfile?.name || 'You';
            setSenderNames(prev => ({ ...prev, [senderId]: name }));
            return name;
        }

        try {
            const { data } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', senderId)
                .single();
            const name = data?.name || 'Unknown';
            setSenderNames(prev => ({ ...prev, [senderId]: name }));
            return name;
        } catch {
            return 'Unknown';
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
            // Resolve all unique sender names
            const uniqueSenderIds = [...new Set(data.map(m => m.sender_id))];
            const nameMap: Record<string, string> = {};

            for (const id of uniqueSenderIds) {
                if (id === userProfile?.id) {
                    nameMap[id] = userProfile?.name || 'You';
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', id)
                        .single();
                    nameMap[id] = profile?.name || 'Unknown';
                }
            }

            setSenderNames(prev => ({ ...prev, ...nameMap }));
            setMessages(data.map(m => ({
                ...m,
                sender_name: nameMap[m.sender_id] || 'Unknown'
            })));
        }
    }, [roomId, userProfile]);

    useEffect(() => {
        fetchMessages();

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
                    const name = await resolveSenderName(newMsg.sender_id);
                    newMsg.sender_name = name;
                    setMessages((prev) => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, fetchMessages, resolveSenderName]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !userProfile) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([
                    {
                        room_id: roomId,
                        sender_id: userProfile.id,
                        text: newMessage.trim(),
                    }
                ]);

            if (error) throw error;
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
            'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
            'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500'
        ];
        const hash = senderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div className="flex flex-col h-[500px] bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Live Chat</h3>
                        <span className="text-[10px] text-gray-500">{messages.length} messages</span>
                    </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Real-time
                </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <MessageCircle className="w-10 h-10 mb-3 opacity-15" />
                        <p className="text-sm font-semibold text-gray-500">No messages yet</p>
                        <p className="text-xs text-gray-600 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const own = isOwnMessage(msg.sender_id);
                        const senderName = msg.sender_name || senderNames[msg.sender_id] || 'Unknown';

                        return (
                            <div
                                key={msg.message_id}
                                className={`flex gap-2.5 ${own ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Other user's avatar */}
                                {!own && (
                                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.sender_id)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        <span className="text-white text-xs font-bold">
                                            {senderName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                <div className={`max-w-[75%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {/* Sender name (not for own messages) */}
                                    {!own && (
                                        <span className="text-[11px] text-gray-500 font-semibold mb-1 ml-1">{senderName}</span>
                                    )}

                                    {/* Message bubble */}
                                    <div className={`px-4 py-2.5 text-sm leading-relaxed ${own
                                        ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                                        : 'bg-white/[0.06] text-gray-200 rounded-2xl rounded-bl-md border border-white/[0.04]'
                                        }`}>
                                        {msg.text}
                                    </div>

                                    {/* Timestamp */}
                                    <span className={`text-[10px] text-gray-600 mt-1 flex items-center gap-1 ${own ? 'mr-1' : 'ml-1'}`}>
                                        <Clock className="w-2.5 h-2.5" />
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
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/[0.06] bg-white/[0.03] flex gap-2">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 outline-none transition-all placeholder:text-gray-600"
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-90"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </form>
        </div>
    );
}
