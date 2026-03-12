import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create a Room — Host a Study or Skill Session | Locked In',
    description: 'Host a virtual or in-person study group or skill-building session for UMaT students. Set the time, location, and invite your classmates.',
};

export default function CreateRoomLayout({ children }: { children: React.ReactNode }) {
    return children;
}
