// Full Supabase mock — all calls return realistic data shapes immediately
// so the production components render fully without any network calls.

const mockStudents = [
  { id: '1', name: 'Kwame Asante', faculty: 'FOE', focus_score: 1820, current_streak: 14 },
  { id: '2', name: 'Abena Mensah', faculty: 'FBS', focus_score: 1640, current_streak: 11 },
  { id: '3', name: 'Kofi Boateng', faculty: 'FMHS', focus_score: 1410, current_streak: 9 },
  { id: '4', name: 'Ama Darko', faculty: 'FOE', focus_score: 1290, current_streak: 7 },
  { id: '5', name: 'Solomon Osei', faculty: 'FBS', focus_score: 1100, current_streak: 6 },
  { id: '6', name: 'Efua Nyarko', faculty: 'FMHS', focus_score: 980, current_streak: 5 },
  { id: '7', name: 'Yaw Amponsah', faculty: 'FOE', focus_score: 870, current_streak: 4 },
  { id: '8', name: 'Akua Sarpong', faculty: 'FBS', focus_score: 760, current_streak: 3 },
];

const mockRooms = [
  { room_id: 'room-1', title: 'DCIT 301 — Algorithms Deep Dive', room_type: 'Study', course_code: 'DCIT 301', date_time: new Date(Date.now() + 3600000).toISOString(), duration_minutes: 90, max_members: 8, created_by: 'user1', description: 'Tackling graph traversal problems together.', image_url: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?q=80&w=600&auto=format&fit=crop', meeting_platform: null, meeting_link: null, status: 'approved' },
  { room_id: 'room-2', title: 'AI & Machine Learning Crash Course', room_type: 'Skill', course_code: null, date_time: new Date(Date.now() + 7200000).toISOString(), duration_minutes: 120, max_members: 12, created_by: 'user2', description: 'Free session on ML fundamentals.', image_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=600&auto=format&fit=crop', meeting_platform: 'Zoom', meeting_link: null, status: 'approved' },
  { room_id: 'room-3', title: 'Thermodynamics Revision', room_type: 'Study', course_code: 'ME 202', date_time: new Date(Date.now() + 10800000).toISOString(), duration_minutes: 60, max_members: 6, created_by: 'user3', description: 'Working through past papers.', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop', meeting_platform: null, meeting_link: null, status: 'approved' },
];

const mockFaculties = [
  { faculty: 'Faculty of Engineering', total_streak: 48200, active_students: 42 },
  { faculty: 'Faculty of Business', total_streak: 36900, active_students: 31 },
  { faculty: 'Faculty of Medicine', total_streak: 29400, active_students: 28 },
  { faculty: 'Faculty of Sciences', total_streak: 22100, active_students: 20 },
  { faculty: 'Faculty of Social Sciences', total_streak: 14700, active_students: 14 },
];

const createMockQuery = (data: any) => ({
  select: (_cols?: string) => createMockQuery(data),
  eq: (_col: string, _val: any) => createMockQuery(data),
  neq: (_col: string, _val: any) => createMockQuery(data),
  or: (_filter: string) => createMockQuery(data),
  in: (_col: string, _vals: any[]) => createMockQuery(data),
  not: (_col: string, _op: string, _val: any) => createMockQuery(data),
  order: (_col: string, _opts?: any) => createMockQuery(data),
  limit: (_n: number) => createMockQuery(data),
  gt: (_col: string, _val: any) => createMockQuery(data),
  then: (resolve: (v: { data: any; error: null; count?: number }) => void) => {
    resolve({ data, error: null, count: Array.isArray(data) ? data.length : 0 });
  },
});

export const supabase = {
  from: (table: string) => {
    if (table === 'profiles') return createMockQuery(mockStudents);
    if (table === 'rooms') return createMockQuery(mockRooms);
    if (table === 'room_members') return createMockQuery([]);
    if (table === 'solo_sessions') return createMockQuery([]);
    if (table === 'buddy_connections') return createMockQuery([]);
    return createMockQuery([]);
  },
  rpc: (fn: string) => {
    if (fn === 'get_weekly_leaderboard') {
      return Promise.resolve({ data: mockStudents, error: null });
    }
    if (fn === 'get_weekly_faculty_leaderboard') {
      return Promise.resolve({ data: mockFaculties, error: null });
    }
    return Promise.resolve({ data: [], error: null });
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
};
