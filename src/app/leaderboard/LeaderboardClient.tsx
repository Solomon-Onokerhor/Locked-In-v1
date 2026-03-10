'use client';

import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Trophy, Medal, Building2, Flame, User, Check } from 'lucide-react';

export function LeaderboardClient() {
    const { session, loading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'students' | 'faculties'>('students');
    const [topStudents, setTopStudents] = useState<Profile[]>([]);
    const [topFaculties, setTopFaculties] = useState<{ faculty: string; total_streak: number; active_students: number }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !session) {
            router.push('/auth');
        } else if (session) {
            fetchLeaderboards();
        }
    }, [session, loading, router]);

    const fetchLeaderboards = async () => {
        setIsLoadingData(true);
        try {
            // Fetch Top Students (by current_streak)
            const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('*')
                .order('current_streak', { ascending: false })
                .limit(50);

            if (studentsError) throw studentsError;
            setTopStudents(studentsData as Profile[]);

            // Fetch Top Faculties 
            // We use a query to aggregate streaks by faculty manually since we don't have a view
            const { data: allProfiles, error: allProfilesError } = await supabase
                .from('profiles')
                .select('faculty, current_streak')
                .not('faculty', 'is', null)
                .not('faculty', 'eq', '')
                .gt('current_streak', 0);

            if (allProfilesError) throw allProfilesError;

            if (allProfiles) {
                const facultyMap: Record<string, { total_streak: number; active_students: number }> = {};
                allProfiles.forEach(p => {
                    const fac = p.faculty || 'Unknown Faculty';
                    if (!facultyMap[fac]) {
                        facultyMap[fac] = { total_streak: 0, active_students: 0 };
                    }
                    facultyMap[fac].total_streak += p.current_streak;
                    facultyMap[fac].active_students += 1;
                });

                const facultiesArray = Object.keys(facultyMap).map(fac => ({
                    faculty: fac,
                    total_streak: facultyMap[fac].total_streak,
                    active_students: facultyMap[fac].active_students
                }));

                // Sort by total streak
                facultiesArray.sort((a, b) => b.total_streak - a.total_streak);
                setTopFaculties(facultiesArray);
            }
        } catch (err) {
            console.error('Error fetching leaderboards:', err);
        } finally {
            setIsLoadingData(false);
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

            <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-[100px] opacity-30"></div>
            </div>

            <main className="px-4 pt-20 pb-24 md:px-8 md:pt-8 md:pb-8 md:ml-72 relative z-10">
                <header className="mb-6 md:mb-10 mt-2 md:mt-0" data-tour="leaderboard">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-400" />
                        Campus Leaderboards
                    </h2>
                    <p className="text-gray-500 text-sm md:text-lg mt-1">
                        Compete with your mates. Represent your Faculty.
                    </p>
                </header>

                <div className="flex bg-white/[0.04] border border-white/[0.06] p-1 rounded-full w-fit mb-8">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-6 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeTab === 'students'
                            ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Top Lockers
                    </button>
                    <button
                        onClick={() => setActiveTab('faculties')}
                        className={`px-6 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${activeTab === 'faculties'
                            ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        Top Faculties
                    </button>
                </div>

                <section className="animate-fade-in-up max-w-3xl">
                    {isLoadingData ? (
                        <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500" /></div>
                    ) : activeTab === 'students' ? (
                        <div className="flex flex-col gap-3">
                            {topStudents.length === 0 ? (
                                <div className="text-center py-10 glass-card rounded-2xl border border-white/5">
                                    <p className="text-gray-400">No active students found. Check back later!</p>
                                </div>
                            ) : (
                                topStudents.map((student, index) => (
                                    <div key={student.id} className={`glass-card p-4 rounded-2xl border flex items-center justify-between transition-colors ${index === 0 ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                                        index === 1 ? 'bg-gray-300/5 border-gray-400/20' :
                                            index === 2 ? 'bg-amber-700/5 border-amber-700/20' :
                                                'border-white/5 hover:bg-white/[0.02]'
                                        }`}>
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 font-bold text-gray-400 text-center flex-shrink-0">
                                                {index === 0 ? <Medal className="w-7 h-7 text-amber-400 mx-auto drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> :
                                                    index === 1 ? <Medal className="w-6 h-6 text-gray-300 mx-auto" /> :
                                                        index === 2 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" /> :
                                                            `#${index + 1}`}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-brand-accent flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className={`font-bold truncate ${index === 0 ? 'text-amber-400 text-lg' : 'text-white'}`}>
                                                        {student.name}
                                                    </p>
                                                    {student.is_verified && (
                                                        <div className="bg-blue-500 rounded-full p-0.5 shrink-0">
                                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    {student.faculty || 'Unknown Faculty'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg shrink-0">
                                            <Flame className={`w-4 h-4 ${student.current_streak > 3 ? 'text-amber-500' : 'text-gray-400'}`} />
                                            <span className="font-bold text-white">{student.current_streak}</span>
                                            <span className="text-xs text-gray-500">Days</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {topFaculties.length === 0 ? (
                                <div className="text-center py-10 glass-card rounded-2xl border border-white/5">
                                    <p className="text-gray-400">No active faculties found. Start locking in to represent your department!</p>
                                </div>
                            ) : (
                                topFaculties.map((fac, index) => (
                                    <div key={fac.faculty} className={`glass-card p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${index === 0 ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] md:scale-[1.02]' :
                                        'border-white/5 hover:bg-white/[0.04]'
                                        }`}>
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-black text-2xl shrink-0">
                                                {index === 0 ? '👑' : `#${index + 1}`}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className={`font-black uppercase tracking-tight line-clamp-2 leading-tight ${index === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 text-xl' : 'text-white text-lg'
                                                    }`}>
                                                    {fac.faculty}
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5" />
                                                    {fac.active_students} Highly Active Student{fac.active_students !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-black/20 self-start md:self-auto px-5 py-3 rounded-xl border border-white/5 shrink-0">
                                            <div className="bg-amber-500/20 p-2 rounded-full">
                                                <Flame className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <div className="font-black text-2xl text-white leading-none">{fac.total_streak}</div>
                                                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Total Score</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
