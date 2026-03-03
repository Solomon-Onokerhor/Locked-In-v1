'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Resource } from '@/types';
import {
    Library, FileText, Video, Download, ThumbsUp, ThumbsDown,
    Search, Plus, ShieldCheck, Share2
} from 'lucide-react';

export default function ResourcesClient() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();
    const [resources, setResources] = useState<Resource[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showUpload, setShowUpload] = useState(false);

    // Upload form
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploadUrl, setUploadUrl] = useState('');
    const [uploadThumbnailUrl, setUploadThumbnailUrl] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [uploadType, setUploadType] = useState<'PDF' | 'PPT' | 'DOCX' | 'Video'>('PDF');
    const [uploading, setUploading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !session) router.push('/auth');
    }, [loading, session, router]);

    useEffect(() => {
        if (session) {
            fetchResources();
            fetchUserVotes();
        }
    }, [session]);

    const fetchResources = async () => {
        const { data } = await supabase
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setResources(data);
    };

    const fetchUserVotes = async () => {
        if (!session) return;
        const { data } = await supabase
            .from('resource_votes')
            .select('resource_id, vote_type')
            .eq('user_id', session.user.id);

        if (data) {
            const voteMap: Record<string, 'up' | 'down'> = {};
            data.forEach(v => { voteMap[v.resource_id] = v.vote_type; });
            setUserVotes(voteMap);
        }
    };

    const handleVote = async (resourceId: string, type: 'up' | 'down') => {
        if (!session) return;

        // Optimistic UI update
        const currentVote = userVotes[resourceId];
        let upDelta = 0;
        let downDelta = 0;

        if (!currentVote) {
            // New vote
            if (type === 'up') upDelta = 1; else downDelta = 1;
            setUserVotes(prev => ({ ...prev, [resourceId]: type }));
        } else if (currentVote === type) {
            // Remove vote
            if (type === 'up') upDelta = -1; else downDelta = -1;
            const newVotes = { ...userVotes };
            delete newVotes[resourceId];
            setUserVotes(newVotes);
        } else {
            // Swap vote
            if (type === 'up') { upDelta = 1; downDelta = -1; }
            else { upDelta = -1; downDelta = 1; }
            setUserVotes(prev => ({ ...prev, [resourceId]: type }));
        }

        setResources((prev) =>
            prev.map((r) =>
                r.resource_id === resourceId
                    ? { ...r, thumbs_up: r.thumbs_up + upDelta, thumbs_down: r.thumbs_down + downDelta }
                    : r
            )
        );

        // Server update
        await supabase.rpc('toggle_resource_vote', { p_resource_id: resourceId, p_vote_type: type });
    };

    const handleDownload = async (resourceId: string) => {
        if (!session) return;

        // 1. Optimistic UI update
        setResources((prev) =>
            prev.map((r) =>
                r.resource_id === resourceId ? { ...r, download_count: (r.download_count || 0) + 1 } : r
            )
        );

        // 2. Server update (background)
        try {
            const { error } = await supabase.rpc('record_resource_download', { p_resource_id: resourceId });
            if (error) throw error;
        } catch (err) {
            console.error('Failed to record download:', err);
        }
    };

    const handleDirectDownload = async (resource: Resource) => {
        if (downloadingId) return;
        setDownloadingId(resource.resource_id);

        try {
            // Record download analytics
            await handleDownload(resource.resource_id);

            // Fetch the file as a blob to control the filename
            const response = await fetch(resource.file_url);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // Determine extension
            const extMap: Record<string, string> = {
                'PDF': '.pdf',
                'PPT': '.pptx',
                'DOCX': '.docx',
                'Video': '.mp4'
            };
            const ext = extMap[resource.resource_type] || '';

            // Sanitize filename
            const fileName = `${resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}${ext}`;

            // Trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download file. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setUploading(true);

        try {
            let finalThumbnailUrl = uploadThumbnailUrl;

            // If a file is selected, upload it first
            if (thumbnailFile) {
                const fileExt = thumbnailFile.name.split('.').pop();
                const fileName = `${Date.now()}_thumb_${Math.random().toString(36).slice(2)}.${fileExt}`;
                const filePath = `resources/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('room_thumbnails')
                    .upload(filePath, thumbnailFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('room_thumbnails')
                    .getPublicUrl(filePath);

                finalThumbnailUrl = publicUrl;
            }

            const { error } = await supabase.from('resources').insert([{
                title: uploadTitle,
                description: uploadDesc,
                file_url: uploadUrl,
                thumbnail_url: finalThumbnailUrl,
                resource_type: uploadType,
                uploaded_by: session.user.id,
                tags: [],
                thumbs_up: 0,
                thumbs_down: 0,
            }]);
            if (error) throw error;
            setShowUpload(false);
            setUploadTitle('');
            setUploadDesc('');
            setUploadUrl('');
            setUploadThumbnailUrl('');
            setThumbnailFile(null);
            setThumbnailPreview(null);
            await fetchResources();
        } catch (err) {
            console.error('Error uploading resource:', err);
        } finally {
            setUploading(false);
        }
    };

    const filteredResources = resources.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isAdmin = profile?.role === 'admin' || profile?.role === 'room_creator';

    const getIcon = (type: string) => {
        switch (type) {
            case 'Video': return <Video className="w-5 h-5 text-purple-400" />;
            default: return <FileText className="w-5 h-5 text-blue-400" />;
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
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <Library className="w-8 h-8 text-brand-accent" /> Free Resources
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">Download study materials shared by the community</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="bg-brand-accent hover:bg-brand-accent-hover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-accent/20 transition-all"
                        >
                            <Plus className="w-5 h-5" /> Upload Resource
                        </button>
                    )}
                </div>

                {/* Upload Form */}
                {showUpload && isAdmin && (
                    <div className="glass-card p-8 mb-8 animate-fade-in-up">
                        <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-accent" /> Upload New Resource
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" required placeholder="Resource title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                                />
                                <select value={uploadType} onChange={(e) => setUploadType(e.target.value as 'PDF' | 'PPT' | 'DOCX' | 'Video')}
                                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all text-gray-300"
                                >
                                    <option value="PDF">PDF</option>
                                    <option value="PPT">PPT</option>
                                    <option value="DOCX">DOCX</option>
                                    <option value="Video">Video</option>
                                </select>
                            </div>
                            <textarea rows={2} placeholder="Description" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="url" required placeholder="File URL (e.g., Google Drive link)" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                                />
                                <div className="flex gap-2">
                                    <input type="url" placeholder="Thumbnail URL" value={uploadThumbnailUrl} onChange={(e) => setUploadThumbnailUrl(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                                    />
                                    <label className="cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 flex items-center justify-center hover:bg-white/10 transition-all">
                                        <Plus className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setThumbnailFile(file);
                                                    setThumbnailPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {thumbnailPreview && (
                                <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-white/10">
                                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                        className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500"
                                    >
                                        <ShieldCheck className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <button type="submit" disabled={uploading}
                                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-md mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                    />
                </div>

                {/* Resource Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredResources.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center py-20 text-gray-600">
                            <Library className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-bold">No resources yet</p>
                        </div>
                    ) : (
                        filteredResources.map((resource) => (
                            <div key={resource.resource_id} className="glass-card flex flex-col group overflow-hidden">
                                {resource.thumbnail_url ? (
                                    <div className="relative h-48 md:h-60 border-b border-white/5 bg-[#0a0f1e] overflow-hidden flex items-center justify-center p-2">
                                        <img
                                            src={resource.thumbnail_url}
                                            alt={resource.title}
                                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105 shadow-2xl"
                                        />
                                        <div className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-xl z-10">
                                            {getIcon(resource.resource_type)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-24 flex items-center px-6 border-b border-white/5 bg-white/5">
                                        <div className="flex items-center gap-3">
                                            {getIcon(resource.resource_type)}
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{resource.resource_type}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-lg font-extrabold text-white mb-1 leading-tight group-hover:text-brand-accent transition-colors">{resource.title}</h3>
                                    <p className="text-xs text-gray-500 mb-6 line-clamp-2 font-medium leading-relaxed">{resource.description || 'No description provided for library resource.'}</p>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleVote(resource.resource_id, 'up')}
                                                className={`flex items-center gap-1.5 transition-all text-sm ${userVotes[resource.resource_id] === 'up'
                                                    ? 'text-green-400 font-bold scale-110'
                                                    : 'text-gray-500 hover:text-green-400'
                                                    }`}
                                            >
                                                <ThumbsUp className={`w-4 h-4 ${userVotes[resource.resource_id] === 'up' ? 'fill-green-400/20' : ''}`} /> {resource.thumbs_up}
                                            </button>
                                            <button onClick={() => handleVote(resource.resource_id, 'down')}
                                                className={`flex items-center gap-1.5 transition-all text-sm ${userVotes[resource.resource_id] === 'down'
                                                    ? 'text-red-400 font-bold scale-110'
                                                    : 'text-gray-500 hover:text-red-400'
                                                    }`}
                                            >
                                                <ThumbsDown className={`w-4 h-4 ${userVotes[resource.resource_id] === 'down' ? 'fill-red-400/20' : ''}`} /> {resource.thumbs_down}
                                            </button>
                                            <div className="flex items-center gap-1.5 text-gray-500 text-sm ml-1 border-l border-white/10 pl-4">
                                                <Download className="w-3.5 h-3.5" />
                                                <span className="font-medium">{resource.download_count || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`https://wa.me/?text=${encodeURIComponent(`🔥 Check out this study resource on Locked In!\n\n📚 Resource: ${resource.title}\n🔗 Link: ${window.location.origin}/resources?id=${resource.resource_id}\n\nLevel up your grades here! 🏔️`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all border border-transparent hover:border-emerald-400/20"
                                                title="Share to WhatsApp"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDirectDownload(resource)}
                                                disabled={!!downloadingId}
                                                className="flex items-center gap-2 bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all border border-brand-accent/20 hover:border-brand-accent shadow-sm disabled:opacity-50"
                                            >
                                                {downloadingId === resource.resource_id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
                                                ) : (
                                                    <Download className="w-3.5 h-3.5" />
                                                )}
                                                {downloadingId === resource.resource_id ? 'WAIT..' : 'GET'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div >
            </main >
        </div >
    );
}
