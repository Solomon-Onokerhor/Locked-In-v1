import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Index } from '@upstash/vector';

const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

        // Query Upstash Vector
        const results = await index.query({
            data: query,
            topK: 20,
            includeMetadata: false
        });

        const userIds = results.map(r => r.id);

        if (userIds.length === 0) {
            return NextResponse.json({ profiles: [] });
        }

        // Fetch actual profiles from Supabase
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (error) {
            throw error;
        }

        // Maintain the vector search rank order
        const sortedProfiles = userIds.map(id => profiles.find(p => p.id === id)).filter(Boolean);

        return NextResponse.json({ profiles: sortedProfiles });
    } catch (e: any) {
        console.error('[Vector/search] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
