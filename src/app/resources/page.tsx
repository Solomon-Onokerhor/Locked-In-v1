import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabaseServer';
import ResourcesClient from './ResourcesClient';
import type { Resource } from '@/types';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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
            title: 'Study Resources - UMaT Notes & Materials | Locked In',
            description: 'Download high-quality study materials, past questions, and resources shared by UMaT engineering and science students in Tarkwa.',
            keywords: ['UMaT study materials', 'UMaT past questions', 'Tarkwa study resources', 'engineering notes Ghana'],
        };
    }

    const supabaseServer = await getSupabaseServer();

    // Cache metadata for 1 hour to save hits for shared links
    let resource: any = await redis.get(`cache:resource_meta:${id}`);
    if (!resource) {
        const { data } = await supabaseServer
            .from('resources')
            .select('*')
            .eq('resource_id', id)
            .single();
        resource = data;
        if (resource) {
            await redis.set(`cache:resource_meta:${id}`, resource, { ex: 60 * 60 });
        }
    }

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
    let initialResources: Resource[] = [];
    try {
        const cachedResources = await redis.get<Resource[]>('cache:resources:all');
        if (cachedResources) {
            initialResources = cachedResources;
        } else {
            const supabaseServer = await getSupabaseServer();
            // Pre-fetch resources on the server
            const { data } = await supabaseServer
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });

            initialResources = (data as Resource[]) || [];
            
            if (initialResources.length > 0) {
                // Cache for 5 minutes
                await redis.set('cache:resources:all', initialResources, { ex: 300 });
            }
        }
    } catch (e) {
        console.error('[ResourcesPage] fetch error:', e);
    }

    return <ResourcesClient initialResources={initialResources} />;
}
