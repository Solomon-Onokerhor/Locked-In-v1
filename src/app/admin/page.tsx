'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Room, Resource } from '@/types';
import {
    Shield, Users, BookOpen, MessageSquare, BarChart3,
    Trash2, Upload, FileText, Video, X, CheckCircle,
    AlertCircle, ChevronDown, Search, Home
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'rooms' | 'upload';

interface Stats {
    totalUsers: number;
    totalRooms: number;
    totalResources: number;
    totalMessages: number;
}

export default function AdminPage() {
    const { session, profile, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Stats
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalRooms: 0, totalResources: 0, totalMessages: 0 });

    // Users
    const [users, setUsers] = useState<Profile[]>([]);
    const [userSearch, setUserSearch] = useState('');

    // Rooms
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomSearch, setRoomSearch] = useState('');
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
    const [isDeletingRoom, setIsDeletingRoom] = useState(false);

    // Resources
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
    const [isDeletingResource, setIsDeletingResource] = useState(false);

    // Upload
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploadType, setUploadType] = useState<'PDF' | 'PPT' | 'DOCX' | 'Video'>('PDF');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [uploadError, setUploadError] = useState('');

    // Resources list
    const [resources, setResources] = useState<Resource[]>([]);

    // Auth guard
    useEffect(() => {
        if (!loading && !session) router.push('/auth');
        if (!loading && profile && profile.role !== 'admin') router.push('/');
    }, [loading, session, profile, router]);

    const fetchStats = useCallback(async () => {
        const [usersRes, roomsRes, resourcesRes, messagesRes] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('rooms').select('room_id', { count: 'exact', head: true }),
            supabase.from('resources').select('*', { count: 'exact', head: true }),
            supabase.from('messages').select('*', { count: 'exact', head: true }),
        ]);
        setStats({
            totalUsers: usersRes.count || 0,
            totalRooms: roomsRes.count || 0,
            totalResources: resourcesRes.count || 0,
            totalMessages: messagesRes.count || 0,
        });
    }, []);

    const fetchUsers = useCallback(async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
    }, []);

    const fetchRooms = useCallback(async () => {
        const { data } = await supabase
            .from('rooms')
            .select(`
                room_id, room_type, session_mode, title, description, 
                created_by, date_time, duration_minutes, physical_location, 
                location_note, max_members, is_paid, price, commission_rate, 
                status, tags, created_at
            `)
            .order('created_at', { ascending: false });
        if (data) setRooms(data as Room[]);
    }, []);

    const fetchResources = useCallback(async () => {
        const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
        if (data) setResources(data);
    }, []);

    useEffect(() => {
        if (profile?.role === 'admin') {
            fetchStats();
            fetchUsers();
            fetchRooms();
            fetchResources();
        }
    }, [profile, fetchStats, fetchUsers, fetchRooms, fetchResources]);

    // Role change
    const handleRoleChange = async (userId: string, newRole: string) => {
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        fetchUsers();
        fetchStats();
    };

    // Delete room
    const confirmDeleteRoom = async () => {
        if (!roomToDelete) return;
        setIsDeletingRoom(true);
        // Delete related data first
        await supabase.from('messages').delete().eq('room_id', roomToDelete);
        await supabase.from('room_members').delete().eq('room_id', roomToDelete);
        await supabase.from('transactions').delete().eq('room_id', roomToDelete);
        await supabase.from('rooms').delete().eq('room_id', roomToDelete);
        fetchRooms();
        fetchStats();
        setIsDeletingRoom(false);
        setRoomToDelete(null);
    };

    // Delete resource
    const confirmDeleteResource = async () => {
        if (!resourceToDelete) return;
        setIsDeletingResource(true);
        await supabase.from('resources').delete().eq('resource_id', resourceToDelete);
        fetchResources();
        fetchStats();
        setIsDeletingResource(false);
        setResourceToDelete(null);
    };

    // Upload resource
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !uploadTitle.trim() || !profile) return;

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        try {
            // Upload file to storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: storageError } = await supabase.storage
                .from('resources')
                .upload(filePath, selectedFile);

            if (storageError) throw storageError;

            // Get public URL
            const { data: urlData } = supabase.storage.from('resources').getPublicUrl(filePath);

            // Insert into resources table
            const { error: dbError } = await supabase.from('resources').insert([{
                title: uploadTitle.trim(),
                description: uploadDesc.trim() || null,
                file_url: urlData.publicUrl,
                resource_type: uploadType,
                uploaded_by: profile.id,
                tags: [],
            }]);

            if (dbError) throw dbError;

            setUploadSuccess(`"${uploadTitle}" uploaded successfully!`);
            setUploadTitle('');
            setUploadDesc('');
            setSelectedFile(null);
            setUploadType('PDF');
            fetchResources();
            fetchStats();

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Filter helpers
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredRooms = rooms.filter(r =>
        r.title.toLowerCase().includes(roomSearch.toLowerCase())
    );

    if (loading || !session || !profile || profile.role !== 'admin') {
        return (
            <div className="min-h-screen bg-brand-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
        { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { key: 'rooms', label: 'Rooms', icon: <Home className="w-4 h-4" /> },
        { key: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-brand-primary">
            <Sidebar />
            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72">
                {/* Admin Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
                            <p className="text-gray-500 text-sm">Platform management & resource uploads</p>
                        </div>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl mb-8 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.key
                                ? 'bg-white/[0.08] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-4 h-4 text-blue-400" />, color: 'bg-blue-500/10' },
                                { label: 'Rooms', value: stats.totalRooms, icon: <Home className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-500/10' },
                                { label: 'Resources', value: stats.totalResources, icon: <FileText className="w-4 h-4 text-amber-400" />, color: 'bg-amber-500/10' },
                                { label: 'Messages', value: stats.totalMessages, icon: <MessageSquare className="w-4 h-4 text-purple-400" />, color: 'bg-purple-500/10' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                                            {stat.icon}
                                        </div>
                                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Resources */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-amber-400" />
                                Recent Resources
                            </h3>
                            {resources.length === 0 ? (
                                <p className="text-gray-500 text-sm">No resources uploaded yet. Go to the Upload tab to add some.</p>
                            ) : (
                                <div className="space-y-3">
                                    {resources.slice(0, 5).map((res) => (
                                        <div key={res.resource_id} className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                            <div className="flex items-center gap-3">
                                                {res.resource_type === 'Video' ? (
                                                    <Video className="w-5 h-5 text-blue-400" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-amber-400" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{res.title}</p>
                                                    <p className="text-[11px] text-gray-500">{res.resource_type} • {new Date(res.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setResourceToDelete(res.resource_id)}
                                                className="text-gray-600 hover:text-red-400 transition-colors p-2"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ USERS TAB ═══ */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 text-white text-sm"
                            />
                        </div>

                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/[0.06]">
                                            <th className="text-left px-5 py-3.5 text-gray-500 font-semibold text-xs uppercase tracking-wider">Name</th>
                                            <th className="text-left px-5 py-3.5 text-gray-500 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                                            <th className="text-left px-5 py-3.5 text-gray-500 font-semibold text-xs uppercase tracking-wider">Role</th>
                                            <th className="text-left px-5 py-3.5 text-gray-500 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-blue-400 text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-semibold text-sm">{user.name}</p>
                                                            <p className="text-gray-600 text-[11px] md:hidden">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell">{user.email}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="relative">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            disabled={user.email === 'sonokerhor@gmail.com'}
                                                            className={`appearance-none bg-transparent border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer pr-7 outline-none transition-colors ${user.role === 'admin'
                                                                ? 'border-red-500/30 text-red-400'
                                                                : user.role === 'room_creator'
                                                                    ? 'border-amber-500/30 text-amber-400'
                                                                    : 'border-blue-500/30 text-blue-400'
                                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="room_creator">Creator</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredUsers.length === 0 && (
                                <p className="text-center text-gray-600 py-8 text-sm">No users found</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ ROOMS TAB ═══ */}
                {activeTab === 'rooms' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 text-white text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredRooms.map((room) => (
                                <div key={room.room_id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${room.room_type === 'Study'
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                    {room.room_type}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${room.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-gray-500/10 text-gray-400'
                                                    }`}>
                                                    {room.status}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-bold truncate">{room.title}</h4>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {new Date(room.date_time).toLocaleString()} • Max {room.max_members}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setRoomToDelete(room.room_id)}
                                            className="text-gray-600 hover:text-red-400 transition-colors p-2 ml-2 flex-shrink-0"
                                            title="Delete Room"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {room.description && (
                                        <p className="text-gray-500 text-xs line-clamp-2">{room.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {filteredRooms.length === 0 && (
                            <p className="text-center text-gray-600 py-8 text-sm">No rooms found</p>
                        )}
                    </div>
                )}

                {/* ═══ UPLOAD TAB ═══ */}
                {activeTab === 'upload' && (
                    <div className="max-w-2xl space-y-6">
                        {/* Upload Form */}
                        <form onSubmit={handleUpload} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-400" />
                                Upload Resource
                            </h3>

                            {uploadSuccess && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {uploadSuccess}
                                </div>
                            )}
                            {uploadError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Title *</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Calculus Lecture Notes"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Description</label>
                                <textarea
                                    value={uploadDesc}
                                    onChange={(e) => setUploadDesc(e.target.value)}
                                    placeholder="Brief description of the resource..."
                                    rows={3}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Type *</label>
                                    <div className="relative">
                                        <select
                                            value={uploadType}
                                            onChange={(e) => setUploadType(e.target.value as 'PDF' | 'PPT' | 'DOCX' | 'Video')}
                                            className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/40 outline-none transition-all cursor-pointer pr-8"
                                        >
                                            <option value="PDF">PDF</option>
                                            <option value="PPT">PPT</option>
                                            <option value="DOCX">DOCX</option>
                                            <option value="Video">Video</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">File *</label>
                                    <label
                                        htmlFor="file-upload"
                                        className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] border-dashed rounded-xl px-4 py-3 text-sm cursor-pointer hover:border-blue-500/30 transition-colors"
                                    >
                                        <Upload className="w-4 h-4 text-gray-500" />
                                        <span className={selectedFile ? 'text-white' : 'text-gray-600'}>
                                            {selectedFile ? selectedFile.name : 'Choose file'}
                                        </span>
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.webm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !uploadTitle.trim() || !selectedFile}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Resource
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Existing Resources */}
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-amber-400" />
                                Uploaded Resources ({resources.length})
                            </h3>
                            {resources.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-6">No resources yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {resources.map((res) => (
                                        <div key={res.resource_id} className="flex items-center justify-between py-3 px-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {res.resource_type === 'Video' ? (
                                                    <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{res.title}</p>
                                                    <p className="text-[11px] text-gray-500">{res.resource_type} • 👍 {res.thumbs_up} 👎 {res.thumbs_down}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setResourceToDelete(res.resource_id)}
                                                className="text-gray-600 hover:text-red-400 transition-colors p-2 flex-shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Room Delete Confirmation Modal */}
            {roomToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0d1224]/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#12182b] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-xl font-extrabold text-white mb-2">Delete Room</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Are you sure you want to delete this room? This action cannot be undone and will permanently erase all associated messages and history.
                            </p>
                        </div>
                        <div className="flex bg-white/[0.02] border-t border-white/5 p-4 gap-3">
                            <button
                                onClick={() => setRoomToDelete(null)}
                                disabled={isDeletingRoom}
                                className="flex-1 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteRoom}
                                disabled={isDeletingRoom}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 shadow-lg shadow-red-500/20 active:scale-[0.98]"
                            >
                                {isDeletingRoom ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Room
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Delete Confirmation Modal */}
            {resourceToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0d1224]/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#12182b] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-xl font-extrabold text-white mb-2">Delete Resource</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Are you sure you want to delete this resource? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex bg-white/[0.02] border-t border-white/5 p-4 gap-3">
                            <button
                                onClick={() => setResourceToDelete(null)}
                                disabled={isDeletingResource}
                                className="flex-1 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteResource}
                                disabled={isDeletingResource}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 shadow-lg shadow-red-500/20 active:scale-[0.98]"
                            >
                                {isDeletingResource ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Resource
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
