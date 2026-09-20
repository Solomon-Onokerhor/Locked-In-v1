import { Index } from '@upstash/vector';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export async function upsertProfileVector(userId: string) {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, name, faculty, programme, level, courses')
        .eq('id', userId)
        .single();

    if (!profile) return;

    // Create a rich text representation of the user for semantic search
    const text = `${profile.name} is a student in the faculty of ${profile.faculty || 'unknown'}, studying ${profile.programme || 'general'} at level ${profile.level || 'unknown'}. ${profile.courses && profile.courses.length > 0 ? `They are taking courses: ${profile.courses.join(', ')}.` : ''}`;

    await index.upsert({
        id: profile.id,
        data: text,
        metadata: { name: profile.name, faculty: profile.faculty }
    });
}
