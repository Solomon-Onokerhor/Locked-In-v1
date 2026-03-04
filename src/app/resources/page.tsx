import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import ResourcesClient from './ResourcesClient';
import type { Resource } from '@/types';

type Props = {
    searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await searchParams;
    if (!id) {
        return {
            title: 'Resources | Locked In',
            description: 'Download high-quality study materials and resources shared by the community.',
        };
    }

    const { data: resource } = await supabase
        .from('resources')
        .select('*')
        .eq('resource_id', id)
        .single();

    if (!resource) {
        return {
            title: 'Resources | Locked In',
            description: 'Study resource not found.',
        };
    }

    return {
        title: `${resource.title} | Locked In Resources`,
        description: resource.description || 'Check out this study resource on Locked In!',
        openGraph: {
            title: resource.title,
            description: resource.description || 'Study resource preview',
            images: resource.thumbnail_url ? [resource.thumbnail_url] : [],
            type: 'website',
            siteName: 'Locked In',
        },
        twitter: {
            card: 'summary_large_image',
            title: resource.title,
            description: resource.description || 'Study resource preview',
            images: resource.thumbnail_url ? [resource.thumbnail_url] : [],
        },
    };
}

export default async function ResourcesPage() {
    // Pre-fetch resources on the server
    const { data } = await supabaseServer
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

    const initialResources = (data as Resource[]) || [];

    return <ResourcesClient initialResources={initialResources} />;
}
