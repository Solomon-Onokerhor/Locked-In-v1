import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Edit Room — Locked In',
    description: 'Update the details of your study or skill-building room on Locked In.',
};

export default function EditRoomLayout({ children }: { children: React.ReactNode }) {
    return children;
}
