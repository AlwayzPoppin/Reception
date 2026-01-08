import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: Request) {
    // Early exit if Supabase is not configured
    if (!isSupabaseConfigured) {
        console.log('All-emails endpoint skipped: Supabase not configured');
        return NextResponse.json([]);
    }

    try {
        const { emails } = await req.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            console.warn('All-emails endpoint: No emails provided in request body');
            return NextResponse.json([]);
        }

        console.log(`fetching aggregated emails for: ${emails.join(', ')}`);

        // Fetch cached emails for all provided accounts in one go
        if (!supabase) {
            return NextResponse.json([]);
        }
        const { data, error } = await supabase
            .from('cached_emails')
            .select('*')
            .in('user_email', emails)
            .order('date', { ascending: false })
            .limit(50); // Show most recent 50 across all accounts

        if (error) {
            console.error('Supabase fetch error in all-emails:', error);
            return NextResponse.json([]);
        }

        if (!data || data.length === 0) {
            console.log('No cached emails found in Supabase for these accounts.');
        }

        // Map back to UI legacy names for consistency
        const results = (data || []).map(e => ({
            ...e,
            originalSubject: e.original_subject,
            from: e.from_address,
            unsubLink: e.unsub_link
        }));

        return NextResponse.json(results);
    } catch (err: any) {
        console.error('Unified API Critical Error:', err);
        return NextResponse.json([]);
    }
}
