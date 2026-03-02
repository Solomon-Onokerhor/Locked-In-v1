import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import RoomPageClient from './RoomPageClient';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    const { data: room } = await supabase
        .from('rooms')
        .select('title, description, image_url, course_code')
        .eq('room_id', id)
        .single();

    if (!room) {
        return {
            title: 'Room Not Found | Locked In',
        };
    }

    const title = `${room.title} ${room.course_code ? `(${room.course_code})` : ''} | Locked In.`;
    const description = room.description || 'Lock in to this study session and level up together.';
    const imageUrl = room.image_url || 'https://lockedin.vercel.app/og-image.png'; // Fallback to a default OG image if needed

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: room.title,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    return <RoomPageClient roomId={id} />;
}
