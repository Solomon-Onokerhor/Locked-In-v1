# Antigravity MVP Product Specification: Study + Skill Rooms Web App

## 1. Product Overview
**Goal:** Build a secure, campus-focused study and skill room platform where students can join free or paid sessions, communicate in real-time, attend online or in-person rooms, and access curated free resources.  

**Key Differentiators:**  
- Verified student sign-up only  
- Free + paid room options (platform takes commission on paid rooms)  
- Secure online links for paid sessions  
- Real-time chat per room  
- Attendance confirmation and room tracking  
- Curated free resources with simple rating system (thumbs up / down)  
- Skill rooms for any topic (AI, Graphics, PPT, etc.)  

---

## 2. User Types

| User Type | Permissions |
|-----------|------------|
| Student | Create/join rooms, participate in chat, attend sessions, access free resources |
| Room Creator (Student) | Create rooms (study/skill), set free or paid, manage session, upload curated free resources |
| Admin | Moderate rooms, approve/reject sessions (optional MVP), upload curated free resources |

---

## 3. Features

### 3.1 Authentication
- Verified student email required (Supabase Auth)  
- Stores user info:
  - `name`  
  - `email`  
  - `faculty`  
  - `courses` (array)  
  - `role` (student / room_creator)  
  - `joined_rooms` (array of room IDs)  

---

### 3.2 Room Types
- **Study Room:** Course-based, academic-focused  
- **Skill Room:** Any skill/topic anyone wants to teach  

### 3.3 Room Fields
| Field | Type | Notes |
|-------|------|------|
| room_id | UUID | Primary key |
| room_type | Enum | Study / Skill |
| title | String | Short descriptive title |
| description | String | Optional longer info |
| created_by | user_id | Room creator |
| date_time | Timestamp | Session schedule |
| location | String | Physical location or online link placeholder |
| max_members | Integer | Max participants allowed |
| is_paid | Boolean | Free or Paid |
| price | Float | Only if paid |
| commission_rate | Float | Platform percentage, default 10% |
| status | Enum | active / archived |
| tags | Array | Skill or course tags |

---

### 3.4 Room Members Table
| Field | Type | Notes |
|-------|------|------|
| room_id | UUID | Foreign key |
| user_id | UUID | Member ID |
| role_in_room | Enum | member / creator / co-host |
| attendance_confirmed | Boolean | True if attended |
| token | String | Unique per-user link for paid online sessions |
| has_access_to_resources | Boolean | True if allowed to download room resources |

---

### 3.5 Chat Table
| Field | Type | Notes |
|-------|------|------|
| message_id | UUID | Primary key |
| room_id | UUID | Foreign key |
| sender_id | UUID | User who sent message |
| text | String | Message content |
| timestamp | Timestamp | Auto-generated |

---

### 3.6 Transactions Table (Paid Rooms)
| Field | Type | Notes |
|-------|------|------|
| transaction_id | UUID | Primary key |
| room_id | UUID | Foreign key |
| user_id | UUID | Paying member |
| amount | Float | Total paid |
| commission | Float | Amount earned by platform |
| status | Enum | paid / failed / refunded |
| timestamp | Timestamp | Payment date/time |

---

### 3.7 Free Resources Table
| Field | Type | Notes |
|-------|------|------|
| resource_id | UUID | Primary key |
| title | String | Name of the resource |
| description | String | Short summary |
| file_url | String | Supabase hosted file URL |
| type | Enum | PDF / PPT / DOCX / Video link |
| uploaded_by | String | admin or room_creator |
| tags | Array | Topics / courses |
| thumbs_up | Integer | Number of positive votes |
| thumbs_down | Integer | Number of negative votes |

**Rules:**  
- Only verified students can download  
- Only admins or room creators can upload for MVP  
- Simple thumbs up/down rating  

---

## 4. Logic / Rules

1. Any verified student can join any room, including room creators.  
2. Free rooms → join immediately, chat unlocks automatically.  
3. Paid rooms → integrate with **Paystack**; platform commission automatically calculated.  
4. Only paying members can access chat and session links.  
5. Online paid rooms use **per-user unique tokens** stored in Room Members table; links validated on access.  
6. Attendance confirmation optional but recommended; creators/co-hosts auto-marked as attended.  
7. Rooms auto-archive after session ends.  
8. Maximum members enforced.  
9. Free resources accessible to all verified users; only uploadable by creators/admins.  
10. Thumbs up/down rating allowed for each resource; no complex ranking yet.  

---

## 5. UI / UX Flow

### 5.1 Dashboard
- Tabs: Study Rooms | Skill Rooms | Your Rooms | Free Resources  
- Featured Rooms: highlight trending / premium paid rooms  
- Search bar: by topic, course, or instructor  

### 5.2 Room Page
- Room info: title, type, description, date/time, location/meeting link (secure)  
- Join / Leave button  
- Chat area (text-only MVP)  
- Confirm attendance button (optional)  

### 5.3 Create Room Flow
1. Select Room Type (Study / Skill)  
2. Enter title + description  
3. Enter date/time  
4. Enter location / virtual meeting placeholder  
5. Max members  
6. Free / Paid toggle + price input if paid  
7. Publish → notify followers/interested users  

### 5.4 Paid Room Flow
1. Student clicks “Join Paid Room”  
2. Redirect to **Paystack** payment gateway  
3. On success:  
   - Update Transactions table  
   - Add user to Room Members  
   - Generate unique secure link/token for online session  
4. Only paying users see chat and session link  

### 5.5 Free Resources Flow
1. Admin / Room Creator uploads resource  
2. Verified users see resources list  
3. Users download files  
4. Users vote thumbs up/down  

---

## 6. Security Requirements
- **Supabase RLS:** enforce that only members can read room data and chat  
- Paid session links: unique per-user tokens, validated on access  
- Free resources downloadable only by verified users  
- Chat only visible to room members  
- Room creators do not need to pay for their own paid rooms  

---

## 7. Success Metrics (MVP Phase)
- Rooms created per week  
- Paid room transactions & commission earned  
- Active users / daily logins  
- Attendance confirmations  
- Chat activity per room  
- Free resources downloads + ratings  

---

## 8. Implementation Notes
- **Supabase** → real-time DB, authentication, RLS, chat, storage  
- **Paystack** → payments for paid rooms, commission logic  
- Online session links → per-user token, validated on access  
- Focus on **security, usability, verified users, and paid room flow** first  
- Free resources → only uploadable by creators/admins, simple rating  
- UI → minimal, clean, functional  

---

End of Product Specification
