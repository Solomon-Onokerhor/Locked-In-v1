// CORE TYPES FOR LOCKED IN MVP

export type UserRole = 'student' | 'room_creator' | 'admin';
export type RoomType = 'Study' | 'Skill';
export type MemberRole = 'member' | 'creator' | 'co-host';
export type TransactionStatus = 'paid' | 'failed' | 'refunded';
export type ResourceType = 'PDF' | 'PPT' | 'DOCX' | 'Video';

export interface Profile {
    id: string;
    name: string;
    email: string;
    faculty?: string;
    level?: string; // used for Class/Level
    programme?: string;
    courses?: string[];
    role: UserRole;
    joined_rooms: string[];
    total_focus_time_minutes: number;
    study_buddies: number;
    current_streak: number;
    last_active_date: string;
    is_verified?: boolean;
    badge_label?: string;
    created_at: string;
}

export interface Room {
    room_id: string;
    room_type: RoomType;
    session_mode: 'virtual' | 'in_person';
    title: string;
    description?: string;
    image_url?: string;
    created_by: string;
    date_time: string;
    duration_minutes: number;
    meeting_link?: string;
    physical_location?: string;
    location_note?: string;
    max_members: number;
    is_paid: boolean;
    price: number;
    commission_rate: number;
    status: 'active' | 'pending' | 'rejected' | 'archived';
    tags: string[];
    faculty?: string;
    course_code?: string;
    created_at: string;
    whatsapp_group_link?: string | null;
}

export interface RoomMember {
    id: string;
    room_id: string;
    user_id: string;
    role_in_room: MemberRole;
    attendance_confirmed: boolean;
    token?: string;
    has_access_to_resources: boolean;
    joined_at: string;
}

export interface Message {
    message_id: string;
    room_id: string;
    sender_id: string;
    text: string;
    timestamp: string;
}

export interface Transaction {
    transaction_id: string;
    room_id: string;
    user_id: string;
    amount: number;
    commission: number;
    status: TransactionStatus;
    timestamp: string;
}

export interface Resource {
    resource_id: string;
    title: string;
    description?: string;
    file_url: string;
    resource_type: ResourceType;
    uploaded_by: string;
    tags: string[];
    thumbs_up: number;
    thumbs_down: number;
    download_count: number;
    thumbnail_url?: string;
    created_at: string;
}

export interface BuddyConnection {
    id: string;
    user_id: string;
    buddy_id: string;
    created_at: string;
}
