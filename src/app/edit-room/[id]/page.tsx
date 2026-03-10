'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';
import { BookOpen, Zap, Calendar, MapPin, Users, DollarSign, Save, Video, Clock, Image, Trash2, Share2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = use(params);
    const { session, profile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [roomType, setRoomType] = useState<'Study' | 'Skill'>('Study');
    const [sessionMode, setSessionMode] = useState<'virtual' | 'in_person'>('virtual');
    const [dateTime, setDateTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [meetingLink, setMeetingLink] = useState('');
    const [physicalLocation, setPhysicalLocation] = useState('');
    const [locationNote, setLocationNote] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [maxMembers, setMaxMembers] = useState(10);
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState(0);
    const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !session) {
            router.push('/auth');
            return;
        }

        const fetchRoom = async () => {
            if (!roomId || !session) return;

            const { data: room, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('room_id', roomId)
                .single();

            if (error || !room) {
                setError('Room not found or you lack permission to edit it.');
                setLoading(false);
                return;
            }

            // Verify permission (creator or admin)
            const isAdmin = profile?.role === 'admin';
            const isCreator = room.created_by === session.user.id;

            if (!isAdmin && !isCreator) {
                setError('You do not have permission to edit this room.');
                setLoading(false);
                return;
            }

            // Populate state
            setTitle(room.title || '');
            setDescription(room.description || '');
            setRoomType(room.room_type as 'Study' | 'Skill');
            setSessionMode(room.session_mode as 'virtual' | 'in_person');
            setDateTime(room.date_time ? new Date(room.date_time).toISOString().slice(0, 16) : '');
            setDurationMinutes(room.duration_minutes || 60);
            setMeetingLink(room.meeting_link || '');
            setPhysicalLocation(room.physical_location || '');
            setLocationNote(room.location_note || '');
            setCourseCode(room.course_code || '');
            setMaxMembers(room.max_members || 10);
            setIsPaid(room.is_paid || false);
            setPrice(room.price || 0);
            setWhatsappGroupLink(room.whatsapp_group_link || '');
            setCurrentImageUrl(room.image_url);
            if (room.image_url) {
                setThumbnailPreview(room.image_url);
            }

            setLoading(false);
        };

        if (session && profile) {
            fetchRoom();
        }
    }, [roomId, session, profile, authLoading, router]);

    const handleUpdateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setUpdating(true);
        setError(null);

        try {
            // --- INPUT VALIDATION ---
            if (title.length < 5 || title.length > 100) {
                throw new Error('Title must be between 5 and 100 characters');
            }
            if (description && description.length > 1000) {
                throw new Error('Description cannot exceed 1000 characters');
            }

            const selectedDate = new Date(dateTime).getTime();
            if (selectedDate < Date.now()) {
                throw new Error('Room date and time must be in the future.');
            }

            // Updated regex to allow query parameters (?, &, =, etc)
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .?&#=-]*)*\/?$/i;

            if (sessionMode === 'virtual' && (!meetingLink || !urlRegex.test(meetingLink))) {
                throw new Error('Please enter a valid meeting URL (e.g., Zoom/Google Meet)');
            }

            if (whatsappGroupLink && !urlRegex.test(whatsappGroupLink)) {
                throw new Error('Please enter a valid WhatsApp Group link');
            }
            // ------------------------

            let image_url = currentImageUrl;

            if (thumbnail) {
                const compressedThumbnail = await compressImage(thumbnail);
                const fileExt = 'jpg';
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('room_thumbnails')
                    .upload(filePath, compressedThumbnail);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('room_thumbnails')
                    .getPublicUrl(filePath);

                image_url = publicUrl;
            }

            const { error: roomError } = await supabase
                .from('rooms')
                .update({
                    room_type: roomType,
                    title,
                    description,
                    image_url,
                    date_time: dateTime,
                    duration_minutes: durationMinutes,
                    session_mode: sessionMode,
                    meeting_link: sessionMode === 'virtual' ? meetingLink : null,
                    physical_location: sessionMode === 'in_person' ? physicalLocation : null,
                    location_note: sessionMode === 'in_person' ? locationNote : null,
                    max_members: maxMembers,
                    course_code: roomType === 'Study' ? courseCode : null,
                    whatsapp_group_link: whatsappGroupLink || null,
                })
                .eq('room_id', roomId);

            if (roomError) throw roomError;

            // Success redirect
            router.push(`/room/${roomId}`);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update room');
            setUpdating(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    if (error && !title) {
        return (
            <div className="min-h-screen bg-brand-primary">
                <Sidebar />
                <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 flex flex-col items-center mt-20">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Editor Error</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link href={`/room/${roomId}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                        Go Back
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-primary">
            <Sidebar />
            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72">
                <div className="max-w-2xl mx-auto">
                    <Link href={`/room/${roomId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Cancel Editing
                    </Link>

                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Edit Room</h1>
                    <p className="text-gray-500 font-medium mb-10">Update the details of your session</p>

                    <form onSubmit={handleUpdateRoom} className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Room Type */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Room Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['Study', 'Skill'] as const).map((type) => {
                                    const Icon = type === 'Study' ? BookOpen : Zap;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setRoomType(type)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${roomType === type
                                                ? 'border-brand-accent bg-brand-accent/10 text-white'
                                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-bold">{type} Room</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Title</label>
                            <input type="text" required placeholder="e.g., Calculus Study Group" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                            <textarea rows={3} placeholder="What will this session cover?" value={description} onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600 resize-none"
                            />
                        </div>

                        {/* Thumbnail Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Room Thumbnail</label>
                            <div className="flex items-center gap-4">
                                {thumbnailPreview && (
                                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 relative">
                                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setThumbnail(null);
                                                setThumbnailPreview(null);
                                                setCurrentImageUrl(null);
                                            }}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <label className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all">
                                        <Image className="w-6 h-6 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-400 font-medium">Click to upload new thumbnail</span>
                                        <span className="text-xs text-brand-accent mt-1">Image will be compressed for WhatsApp automatically</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setThumbnail(file);
                                                    setThumbnailPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Course Code (Only for Study) */}
                        {roomType === 'Study' && (
                            <div className="animate-fade-in-up">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Course Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., CP 151"
                                        value={courseCode}
                                        onChange={(e) => setCourseCode(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Session Mode */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Session Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSessionMode('virtual')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${sessionMode === 'virtual'
                                        ? 'border-blue-500/50 bg-blue-500/10 text-white'
                                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    <Video className={`w-5 h-5 ${sessionMode === 'virtual' ? 'text-blue-400' : ''}`} />
                                    <span className="font-bold">Virtual</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionMode('in_person')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${sessionMode === 'in_person'
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    <MapPin className={`w-5 h-5 ${sessionMode === 'in_person' ? 'text-emerald-400' : ''}`} />
                                    <span className="font-bold">In-Person</span>
                                </button>
                            </div>
                        </div>

                        {/* Date & Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Date & Time *
                                </label>
                                <input type="datetime-local" required value={dateTime} onChange={(e) => setDateTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Duration (mins) *
                                </label>
                                <input type="number" required min={15} step={15} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Location / Link Inputs */}
                        <div className="animate-fade-in-up">
                            {sessionMode === 'virtual' ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                        <Video className="w-3 h-3" /> Meeting Link (Zoom, Meet, etc) *
                                    </label>
                                    <input type="url" required placeholder="https://zoom.us/j/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                                    />
                                    <p className="text-[10px] text-gray-500">Links remain hidden securely until users lock in and the session is live.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Physical Location *
                                        </label>
                                        <input type="text" required placeholder="e.g. Library, Room 301" value={physicalLocation} onChange={(e) => setPhysicalLocation(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Location Note (Optional)</label>
                                        <input type="text" placeholder="e.g. Second floor near lab 3" value={locationNote} onChange={(e) => setLocationNote(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Capacity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Max Members
                                </label>
                                <input type="number" min={2} max={100} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1 text-emerald-400">
                                    <Share2 className="w-3 h-3 text-emerald-400" /> WhatsApp Group Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://chat.whatsapp.com/..."
                                    value={whatsappGroupLink}
                                    onChange={(e) => setWhatsappGroupLink(e.target.value)}
                                    className="w-full bg-white/5 border border-emerald-500/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={updating}
                            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {updating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Save className="w-5 h-5" /> Save Changes</>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
