import { Index } from '@upstash/vector';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { GoogleGenAI } from '@google/genai';

export async function upsertProfileVector(userId: string) {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, name, faculty, programme, level, courses')
        .eq('id', userId)
        .single();

    if (!profile) return;

    // Create a rich text representation of the user for semantic search
    const text = `${profile.name} is a student in the faculty of ${profile.faculty || 'unknown'}, studying ${profile.programme || 'general'} at level ${profile.level || 'unknown'}. ${profile.courses && profile.courses.length > 0 ? `They are taking courses: ${profile.courses.join(', ')}.` : ''}`;

    // Generate embeddings using Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
        config: { outputDimensionality: 768 }
    });
    
    if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('Failed to generate embeddings');
    }

    const vector = response.embeddings[0].values as number[];
    const index = new Index({
        url: process.env.UPSTASH_VECTOR_REST_URL!,
        token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    await index.upsert({
        id: profile.id,
        vector,
        metadata: { name: profile.name, faculty: profile.faculty }
    });
}
