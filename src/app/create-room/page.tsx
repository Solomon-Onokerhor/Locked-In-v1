'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompression';
import { BookOpen, Zap, Calendar, MapPin, Users, DollarSign, PlusCircle, Video, Clock, Image, Trash2, Share2 } from 'lucide-react';

export default function CreateRoomPage() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();

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
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !session) router.push('/auth');
    }, [loading, session, router]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setCreating(true);
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

            let image_url = null;

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

            const { data: newRoom, error: roomError } = await supabase
                .from('rooms')
                .insert([{
                    room_type: roomType,
                    title,
                    description,
                    image_url,
                    created_by: session.user.id,
                    date_time: dateTime,
                    duration_minutes: durationMinutes,
                    session_mode: sessionMode,
                    meeting_link: sessionMode === 'virtual' ? meetingLink : null,
                    physical_location: sessionMode === 'in_person' ? physicalLocation : null,
                    location_note: sessionMode === 'in_person' ? locationNote : null,
                    max_members: maxMembers,
                    is_paid: false, // Force free for MVP
                    price: 0,
                    commission_rate: 0.1,
                    course_code: roomType === 'Study' ? courseCode : null,
                    whatsapp_group_link: whatsappGroupLink || null,
                    status: 'pending',
                }])
                .select()
                .single();

            if (roomError) throw roomError;

            // Auto-join as creator
            if (newRoom) {
                await supabase.from('room_members').insert([{
                    room_id: newRoom.room_id,
                    user_id: session.user.id,
                    role_in_room: 'creator',
                    has_access_to_resources: true,
                }]);

                // --- SUCCESS FLOW ---
                setSuccess(true);
                setCreating(false);
                // No redirect - session is pending admin approval
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setCreating(false); // Enable button on error
        }
    };

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
            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Host a Room</h1>
                    <p className="text-gray-500 font-medium mb-10">Create a study session or skill-building room for your campus</p>

                    <form onSubmit={handleCreateRoom} className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-8 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl text-center animate-fade-in mb-10">
                                <PlusCircle className="w-12 h-12 text-brand-accent mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Room Submitted!</h3>
                                <p className="text-gray-400 mb-6 font-medium">Your room is being vetted by an admin. It will go live once approved.</p>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="px-8 py-3 bg-brand-accent hover:bg-brand-accent/80 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-accent/20"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        )}

                        {!success && (
                            <>
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
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Room Thumbnail (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        {thumbnailPreview && (
                                            <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 relative">
                                                <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <label className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all">
                                                <Image className="w-6 h-6 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-400 font-medium">Click to upload thumbnail</span>
                                                <span className="text-xs text-gray-600 mt-1">Recommended size: 1200x630px</span>
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

                                {/* Pricing */}
                                <div className="space-y-4 opacity-50 relative">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="isPaid" disabled checked={false}
                                            className="w-5 h-5 rounded bg-white/5 border-white/10 text-brand-accent focus:ring-brand-accent cursor-not-allowed"
                                        />
                                        <label htmlFor="isPaid" className="text-sm font-bold text-gray-400 flex items-center gap-2 cursor-not-allowed">
                                            <DollarSign className="w-4 h-4" /> Paid Session
                                            <span className="bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded text-[10px] font-black uppercase">Coming Soon</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button type="submit" disabled={creating}
                                    className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><PlusCircle className="w-5 h-5" /> Create Room</>
                                    )}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </main >
        </div >
    );
}
