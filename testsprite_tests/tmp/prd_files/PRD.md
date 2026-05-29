# Product Requirement Document (PRD)
## Locked In: Gamified Study + Skill Rooms Platform

**Author:** Product & Architecture Team  
**Status:** Draft  
**Target Release:** MVP Phase  
**Tech Stack:** Next.js 16 (PWA), Supabase, React 19, Tailwind CSS v4, Paystack, Clerk

---

## 1. Executive Summary & Product Vision

### 1.1 Problem Statement
University students often struggle with maintaining focus, building consistent study habits, and finding peer-led academic or skill-based support. Additionally, peer tutors lack a secure, unified platform to host study sessions, charge for premium classes, share resources, and build credibility.

### 1.2 Solution
**Locked In** is a gamified study and skill-building platform where verified university students can join collaborative rooms, track deep work sessions using a persistent focus timer, earn streaks, and compete on leaderboards. It bridges the gap between study groups and peer tutoring by allowing room creators to host free or paid sessions integrated with Paystack, complete with real-time chat, unique secure meeting tokens, and a curated learning resources library.

### 1.3 Key Differentiators
- **Verified Student Access:** Access restricted to verified university emails.
- **Deep Work Focus Engine:** Persistent Picture-in-Picture (PiP) focus timer and gamified points/streak engine.
- **Unified Room Ecosystem:** Combines free study groups and monetized peer-led skill rooms.
- **Secure Paid Session Links:** Token-based validation to prevent unauthorized link sharing for paid rooms.
- **Strict Black & White Design:** A focused, high-contrast, distraction-free aesthetic.

---

## 2. User Roles & Permissions

| User Type | Core Permissions | Key Use Cases |
| :--- | :--- | :--- |
| **Student (Learner)** | Join free rooms, pay to join paid rooms, participate in room chats, track focus sessions, earn points/streaks, access free resources. | Joins a course study group to prep for exams; starts focus timer to track daily studying; reviews PDFs from the resources library. |
| **Room Creator** | Create study/skill rooms (free or paid), set dates/times, manage session links, upload resource attachments, co-host sessions. | A senior student hosting a paid coding crash course (charging via Paystack) or a free group study session for calculus. |
| **Admin** | Moderate rooms, review/approve/reject sessions, upload/delete curated resources, manage user roles, view stats. | Moderating inappropriate chat rooms; uploading official past questions or course resources. |

---

## 3. Core Functional Requirements & Feature Specification

### 3.1 Authentication & Profile Sync
- **Clerk & Supabase Integration:** Authentication handled securely, mapped to Supabase profiles.
- **Verified Badge System:** Auto-awards badges to verified university student accounts.
- **Security Safeguards:** Implement role-escalation prevention triggers to block unauthorized profile updates.
- **Profile Fields:**
  - `id` (UUID, maps to Clerk ID)
  - `name` (String)
  - `email` (String, verified student email)
  - `faculty` (String)
  - `courses` (Array of Strings)
  - `role` (student / room_creator / admin)
  - `points` / `focus_score` (Integer)
  - `current_streak` / `max_streak` (Integer)

### 3.2 Study & Skill Rooms
- **Study Rooms:** Course-code targeted, academic focus (e.g., *ELNG 381 Study Group*).
- **Skill Rooms:** Open-topic skills (e.g., *Intro to Figma*, *Resume & PPT Writing*, *AI Prompt Engineering*).
- **Attributes:** Free vs. Paid (toggled by the creator).
- **Room Lifecycle:** Rooms are automatically archived after the scheduled end time. Max membership caps are strictly enforced on sign-up.

### 3.3 Paid Room Checkout & Transactions
- **Paystack Integration:** Students pay to join paid rooms directly via the Paystack gateway redirect.
- **Platform Commission:** Automatically deducts a **10% commission** (configurable) on all paid room transactions.
- **Direct Checkout Flow:**
  1. Student clicks "Join Paid Room".
  2. Redirection to Paystack checkout.
  3. Webhook catches success → writes to `transactions` table → adds user to `room_members` table with access.

### 3.4 Secure Online Meeting Links
- **Preventing Leakage:** Paid online rooms must hide the final Zoom/Meet link.
- **Token Routing:** On successful payment, the backend generates a unique secure token mapped to the user in `room_members`.
- **Validation:** When clicking "Join Session", a middleware/route validates the token against the user and room before redirecting them to the live meeting URL.

### 3.5 Real-Time Room Chat
- **Supabase Realtime:** Low-latency chat rooms active for participants.
- **Access Guarding:** Chat read/write is strictly protected via Row Level Security (RLS) policies. Only approved members of that specific room can view or send messages.

### 3.6 Focus Timer & Gamification Engine
- **Persistent Focus Timer:** Global Picture-in-Picture (PiP) React context. The timer remains active and visible even while navigating across pages or when running in the background.
- **Streaks System:** Tracks daily consecutive study/focus sessions. Automatically calculates and resets streaks at midnight based on activity.
- **Focus Score RPC:** Triggers points/score recalculations based on focus duration, room attendance, and peer verification.
- **Anti-Scraping / Security:** Focus tracking is protected against spoofing/tampering.

### 3.7 Curated Free Resources
- **Resource Repository:** Centralized download library for PDFs, PPTs, templates, and video links.
- **Upload Restrictions:** Only Admins or verified Room Creators can upload files.
- **Engagement (Feedback):** Simple binary rating system (Thumbs Up / Thumbs Down) for content quality check.

---

## 4. Database Schema (Supabase)

### 4.1 `profiles` Table
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    faculty TEXT,
    courses TEXT[],
    role TEXT DEFAULT 'student',
    points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.2 `rooms` Table
```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type TEXT NOT NULL, -- 'study' or 'skill'
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT DEFAULT 60,
    location TEXT, -- 'Physical location' or 'Secure meeting link'
    max_members INT DEFAULT 20,
    is_paid BOOLEAN DEFAULT FALSE,
    price DECIMAL(10, 2) DEFAULT 0.00,
    commission_rate DECIMAL(5, 2) DEFAULT 0.10,
    status TEXT DEFAULT 'active', -- 'active' or 'archived'
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.3 `room_members` Table
```sql
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_room TEXT DEFAULT 'member', -- 'member', 'creator', 'co-host'
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    secure_token TEXT UNIQUE,
    has_access_to_resources BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, user_id)
);
```

### 4.4 `chats` Table
```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.5 `transactions` Table
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL, -- 'paid', 'failed', 'refunded'
    paystack_reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4.6 `free_resources` Table
```sql
CREATE TABLE free_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'PDF', 'PPT', 'DOCX', 'Video'
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    tags TEXT[],
    thumbs_up INT DEFAULT 0,
    thumbs_down INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 5. Security & Row Level Security (RLS)

- **Anti-Scraping Policies:** Limit profile reading. Users can only view full stats of other students via the public leaderboard, preventing unauthorized database scanning.
- **Escalation Guards:** Triggers preventing users from setting their `role` column to 'admin' or modifying point tallies directly via client-side operations.
- **Chat Access Control:**
  ```sql
  CREATE POLICY "Allow chat read for room members only" 
  ON chats FOR SELECT 
  USING (
      EXISTS (
          SELECT 1 FROM room_members 
          WHERE room_members.room_id = chats.room_id 
          AND room_members.user_id = auth.uid()
      )
  );
  ```

---

## 6. UI & Design System

### 6.1 Contrast Black & White Aesthetic
The platform utilizes a strictly curated Black & White design system (vibrant grays, clean borders, high-contrast states) to promote absolute focus.
- **Theme Color Palette:** Pure White (#FFFFFF), Deep Focus Black (#0B0B0B), and Neutral Grays (Scale: #1C1C1C to #F5F5F5).
- **Typography:** Outfit / Inter, modern sans-serif fonts optimized for text readability during long study sessions.

### 6.2 Key Views
1. **Focus Dashboard:** Displays active streaks, points, leaderboards, quick access to joined study groups, and the global PiP Timer toggle.
2. **Room Details & Live Chat:** Split interface displaying room status, calendar details, meeting join triggers, and the live chat pane.
3. **Paystack Gate Drawer:** Slide-over modal presenting room pricing, terms, platform commission notification, and payment action buttons.
4. **Resources Hub:** Cards categorized by tags/courses with files, download stats, and interactive thumbs up/down rating items.

---

## 7. Metrics & Analytics

- **Engagement KPIs:** Daily Active Users (DAU), Weekly Active Users (WAU), total focus hours clocked.
- **Financial KPIs:** Total transaction volume (GMV), net platform commission generated.
- **Retention metrics:** Focus session completion rate, daily/weekly streak retainment.
- **Quality KPIs:** Average rating scores of curated resources.
