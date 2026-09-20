import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { upsertProfileVector } from '@/lib/vector';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (adminError || adminProfile?.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id');
    if (error) throw error;

    let successCount = 0;
    let failCount = 0;

    for (const profile of profiles || []) {
      try {
        await upsertProfileVector(profile.id);
        successCount++;
        // Add a small delay to avoid hitting Gemini rate limits on the free tier
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error('Failed to backfill vector for', profile.id, err);
        failCount++;
      }
    }

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
