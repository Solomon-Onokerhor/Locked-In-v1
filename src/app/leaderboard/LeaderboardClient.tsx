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

    const totalFacultyPoints = topFaculties.reduce((sum, fac) => sum + fac.total_streak, 0);

    return (
        <div className="min-h-screen w-full bg-[#000000] text-slate-100 font-display flex flex-col md:flex-row overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto bg-[#000000] p-4 md:p-10 md:ml-[280px]">
                <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pt-16 md:pt-0 pb-10">
                    <header className="flex flex-col gap-6" data-tour="leaderboard">
                        <div>
                            <h1 className="text-white text-3xl md:text-[40px] font-black leading-tight tracking-tight mb-2">Leaderboard 🏆</h1>
                            <p className="text-lg text-gray-400">See who's putting in the most effort on campus</p>
                        </div>
                        <div className="flex border-b border-white/10 gap-4 md:gap-8">
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${activeTab === 'students' ? 'border-b-white text-white' : 'border-b-transparent text-gray-500 hover:text-white'}`}
                            >
                                <p className="text-sm font-bold tracking-wide uppercase">Top Lockers</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('faculties')}
                                className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${activeTab === 'faculties' ? 'border-b-white text-white' : 'border-b-transparent text-gray-500 hover:text-white'}`}
                            >
                                <p className="text-sm font-bold tracking-wide uppercase">Top Faculties</p>
                            </button>
                        </div>
                    </header>

                    <section className="animate-fade-in-up">
                        {isLoadingData ? (
                            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20" /></div>
                        ) : activeTab === 'students' ? (
                            <div className="flex flex-col gap-3">
                                {topStudents.length === 0 ? (
                                    <div className="text-center py-10 rounded-2xl border border-white/10 bg-[#111111]">
                                        <p className="text-gray-400">No active students found. Check back later!</p>
                                    </div>
                                ) : (
                                    topStudents.map((student, index) => {
                                        // Styling based on rank
                                        let rankClasses = "";
                                        let rankNumberClasses = "";
                                        let avatarClasses = "";
                                        let nameClasses = "";
                                        let scoreClasses = "";
                                        let flameClasses = "";

                                        if (index === 0) {
                                            rankClasses = "p-6 rounded-2xl bg-white/10 border border-white/20";
                                            rankNumberClasses = "w-12 h-12 bg-white text-black font-black text-xl rounded-full relative";
                                            avatarClasses = "w-14 h-14 border-2 border-white bg-white/20";
                                            nameClasses = "text-xl text-white";
                                            scoreClasses = "text-2xl text-white font-black";
                                            flameClasses = "w-5 h-5 text-white";
                                        } else if (index === 1 || index === 2) {
                                            rankClasses = "p-5 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors";
                                            rankNumberClasses = "w-12 h-12 text-slate-400 font-bold text-xl";
                                            avatarClasses = "w-12 h-12 bg-white/10";
                                            nameClasses = "text-lg text-white";
                                            scoreClasses = "text-xl text-white font-bold";
                                            flameClasses = "w-5 h-5 text-gray-300";
                                        } else {
                                            rankClasses = "p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all";
                                            rankNumberClasses = "w-12 h-12 text-slate-500 font-medium text-lg";
                                            avatarClasses = "w-10 h-10 bg-white/5";
                                            nameClasses = "text-base text-gray-100";
                                            scoreClasses = "text-lg text-gray-300 font-bold";
                                            flameClasses = "w-4 h-4 text-gray-400";
                                        }

                                        return (
                                            <div key={student.id} className={`flex items-center gap-4 md:gap-6 ${rankClasses}`}>
                                                <div className={`flex items-center justify-center shrink-0 ${rankNumberClasses}`}>
                                                    #{index + 1}
                                                </div>

                                                <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${avatarClasses}`}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h3 className={`font-bold truncate ${nameClasses}`}>
                                                            {student.name}
                                                        </h3>
                                                        {student.is_verified && (
                                                            <div className="bg-white/10 rounded-full p-0.5 shrink-0">
                                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className={`truncate mt-0.5 ${index === 0 ? 'text-sm text-gray-400' : 'text-xs md:text-sm text-gray-500'}`}>
                                                        {student.faculty || 'Unknown Faculty'}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className={`flex justify-end items-center gap-1.5 ${scoreClasses}`}>
                                                        <Flame className={flameClasses} />
                                                        {student.current_streak}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-8">
                                {topFaculties.length > 0 && (
                                    <div className="p-4 md:p-6 rounded-2xl border border-white/10 bg-[#111111] flex flex-col gap-4">
                                        <div>
                                            <p className="text-[#9da6b9] text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Total Faculty Points</p>
                                            <div className="flex items-end gap-3">
                                                <p className="text-white text-3xl md:text-4xl font-black leading-none">{totalFacultyPoints.toLocaleString()} <span className="text-lg md:text-xl text-[#9da6b9] font-bold">pts</span></p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 flex flex-col gap-3">
                                            {topFaculties.slice(0, 5).map((fac, idx) => {
                                                const percentage = totalFacultyPoints > 0 ? ((fac.total_streak / totalFacultyPoints) * 100).toFixed(0) : '0';
                                                
                                                // Dynamic opacity for the top 5
                                                const opacityValues = ['bg-white', 'bg-white/80', 'bg-white/60', 'bg-white/40', 'bg-white/20'];
                                                const barClass = opacityValues[idx] || 'bg-white/10';
                                                
                                                return (
                                                    <div key={`stat-${fac.faculty}`} className="flex items-center gap-2 md:gap-4">
                                                        <p className="text-white text-xs md:text-sm font-bold w-32 md:w-48 truncate" title={fac.faculty}>{fac.faculty}</p>
                                                        <div className="flex-1 h-3 bg-[#000000] rounded overflow-hidden">
                                                            <div className={`h-full ${barClass}`} style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                        <p className="text-[#9da6b9] text-xs font-bold w-10 md:w-12 text-right">{percentage}%</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex flex-col gap-3">
                                    <div className="hidden md:flex items-center px-6 py-3 text-[#9da6b9] text-xs font-bold uppercase tracking-wider">
                                        <div className="w-16">Rank</div>
                                        <div className="flex-1">Faculty</div>
                                        <div className="w-32 text-right">Members</div>
                                        <div className="w-40 text-right">Total Score</div>
                                    </div>
                                    
                                    {topFaculties.length === 0 ? (
                                        <div className="text-center py-10 rounded-2xl border border-white/10 bg-[#111111]">
                                            <p className="text-gray-400">No active faculties found. Start locking in to represent your department!</p>
                                        </div>
                                    ) : (
                                        topFaculties.map((fac, index) => {
                                            let rankTextClass = "";
                                            let iconBgClass = "";
                                            let iconTextClass = "";
                                            
                                            if (index === 0) {
                                                rankTextClass = "text-white";
                                                iconBgClass = "bg-white/10";
                                                iconTextClass = "text-white";
                                            } else if (index === 1) {
                                                rankTextClass = "text-white/80";
                                                iconBgClass = "bg-white/5";
                                                iconTextClass = "text-white/80";
                                            } else if (index === 2) {
                                                rankTextClass = "text-white/60";
                                                iconBgClass = "bg-white/5";
                                                iconTextClass = "text-white/60";
                                            } else {
                                                rankTextClass = "text-gray-500";
                                                iconBgClass = "bg-transparent";
                                                iconTextClass = "text-gray-500";
                                            }

                                            return (
                                                <div key={fac.faculty} className="flex flex-col md:flex-row md:items-center px-4 md:px-6 py-4 md:py-5 rounded-lg border border-white/10 bg-[#111111] hover:border-white/30 transition-colors gap-4 md:gap-0">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`w-10 md:w-16 text-xl md:text-2xl font-black shrink-0 ${rankTextClass}`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center font-bold border border-white/10 shrink-0 ${iconBgClass} ${iconTextClass}`}>
                                                                {fac.faculty.charAt(0).toUpperCase()}
                                                            </div>
                                                            <p className={`font-bold line-clamp-2 ${index === 0 ? 'text-white text-base md:text-lg' : 'text-gray-300 text-sm md:text-base'}`}>
                                                                {fac.faculty}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between md:contents">
                                                        <div className="w-auto md:w-32 md:text-right text-[#9da6b9] font-medium flex items-center md:block gap-1">
                                                            {fac.active_students} <span className="text-xs">members</span>
                                                        </div>
                                                        <div className={`w-auto md:w-40 md:text-right font-bold text-base md:text-lg flex items-center justify-end gap-1.5 ${index === 0 ? 'text-white' : 'text-gray-300'}`}>
                                                            {fac.total_streak} <span className="text-sm text-[#9da6b9] font-normal">pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
