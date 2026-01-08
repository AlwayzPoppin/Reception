import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/emails/cached
 * Returns cached emails for the authenticated user.
 * This endpoint does NOT call Gmail - it's designed for instant UI population.
 */
export async function GET() {
    // Early exit if Supabase is not configured
    if (!isSupabaseConfigured) {
        console.log('Cache endpoint skipped: Supabase not configured');
        return NextResponse.json([]);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userEmail = session.user.email;

        if (!supabase) {
            return NextResponse.json([]);
        }
        const { data: cachedEmails, error } = await supabase
            .from('cached_emails')
            .select('*')
            .eq('user_email', userEmail)
            .order('date', { ascending: false })
            .limit(25);

        if (error) {
            console.error('Cache fetch error:', error);
            return NextResponse.json([]); // Return empty array instead of 500 for graceful degradation
        }

        // Map to UI-expected field names
        const results = (cachedEmails || []).map(e => ({
            id: e.id,
            user_email: e.user_email,
            originalSubject: e.original_subject,
            from: e.from_address,
            date: e.date,
            summary: e.summary,
            category: e.category,
            unsubLink: e.unsub_link
        }));

        return NextResponse.json(results);
    } catch (err: any) {
        console.error('Cache API Error:', err);
        return NextResponse.json([]); // Return empty array for graceful degradation
    }
}
