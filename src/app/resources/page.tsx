'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Resource } from '@/types';
import {
    Library, FileText, Video, Download, ThumbsUp, ThumbsDown,
    Search, Plus, ShieldCheck
} from 'lucide-react';

export default function ResourcesPage() {
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
    const [uploadType, setUploadType] = useState<'PDF' | 'PPT' | 'DOCX' | 'Video'>('PDF');
    const [uploading, setUploading] = useState(false);

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

    const handleDownload = async (resourceId: string, url: string) => {
        if (!session) return;

        // Optimistic update
        setResources((prev) =>
            prev.map((r) =>
                r.resource_id === resourceId ? { ...r, download_count: (r.download_count || 0) + 1 } : r
            )
        );

        // Server update
        await supabase.rpc('record_resource_download', { p_resource_id: resourceId });

        // Open file strictly after recording starts
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setUploading(true);

        try {
            const { error } = await supabase.from('resources').insert([{
                title: uploadTitle,
                description: uploadDesc,
                file_url: uploadUrl,
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
            await fetchResources();
        } catch {
            console.error('Error uploading resource');
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
                            <input type="url" required placeholder="File URL (e.g., Google Drive link)" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-gray-600"
                            />
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
                            <div key={resource.resource_id} className="glass-card p-6 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getIcon(resource.resource_type)}
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{resource.resource_type}</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-extrabold text-white mb-2">{resource.title}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{resource.description || 'No description.'}</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleVote(resource.resource_id, 'up')}
                                            className={`flex items-center gap-1 transition-colors text-sm ${userVotes[resource.resource_id] === 'up'
                                                    ? 'text-green-400 font-bold'
                                                    : 'text-gray-400 hover:text-green-400'
                                                }`}
                                        >
                                            <ThumbsUp className={`w-4 h-4 ${userVotes[resource.resource_id] === 'up' ? 'fill-green-400/20' : ''}`} /> {resource.thumbs_up}
                                        </button>
                                        <button onClick={() => handleVote(resource.resource_id, 'down')}
                                            className={`flex items-center gap-1 transition-colors text-sm ${userVotes[resource.resource_id] === 'down'
                                                    ? 'text-red-400 font-bold'
                                                    : 'text-gray-400 hover:text-red-400'
                                                }`}
                                        >
                                            <ThumbsDown className={`w-4 h-4 ${userVotes[resource.resource_id] === 'down' ? 'fill-red-400/20' : ''}`} /> {resource.thumbs_down}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            {resource.download_count || 0} Downloads
                                        </span>
                                        <button onClick={() => handleDownload(resource.resource_id, resource.file_url)}
                                            className="flex items-center gap-2 text-brand-accent hover:text-brand-accent-hover text-sm font-bold transition-colors"
                                        >
                                            <Download className="w-4 h-4" /> Get
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
