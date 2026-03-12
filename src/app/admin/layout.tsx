import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard — Locked In',
    description: 'Manage users, approve rooms, upload resources, and monitor platform activity on the Locked In admin dashboard.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children;
}
