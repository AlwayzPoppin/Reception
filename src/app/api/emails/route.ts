import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchLatestEmails } from '@/lib/gmail';
import { summarizeEmail } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken || !session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized - No token or email' }, { status: 401 });
    }

    try {
        console.log('Fetching emails from Gmail...');
        const rawEmails = await fetchLatestEmails(session.accessToken, 10); // Fetch more now that we cache
        console.log(`DEBUG_API: Gmail returned ${rawEmails.length} messages`);
        const emailIds = rawEmails.map(e => e.id);
        const userEmail = session.user.email;

        // 1. Check which emails are already in the cache
        const { data: cachedEmails, error: dbError } = await supabase
            .from('cached_emails')
            .select('*')
            .in('id', emailIds)
            .eq('user_email', userEmail);

        if (dbError) {
            console.error('Database fetch error:', dbError);
        }

        const cachedIds = new Set(cachedEmails?.map(e => e.id) || []);
        const summarizedEmails: any[] = cachedEmails || [];

        // 2. Process only emails NOT in cache in chunks (concurrency limit = 5)
        const missingEmails = rawEmails.filter(e => !cachedIds.has(e.id));
        console.log(`Cache overview: ${cachedIds.size} hits, ${missingEmails.length} misses.`);

        const summarizedMissing: any[] = [];
        for (let i = 0; i < missingEmails.length; i += 5) {
            const chunk = missingEmails.slice(i, i + 5);
            const chunkResults = await Promise.all(chunk.map(async (email) => {
                console.log(`Summarizing NEW email: ${email.subject}`);
                try {
                    const summary = await summarizeEmail(email.snippet, email.subject);
                    const emailData = {
                        id: email.id,
                        user_email: userEmail,
                        original_subject: email.subject,
                        summary: summary.summary,
                        category: summary.category,
                        from_address: email.from,
                        date: email.date,
                        unsub_link: email.unsubLink
                    };

                    // Save to cache (async)
                    supabase.from('cached_emails').insert(emailData).then(({ error }) => {
                        if (error) console.error('Cache save error:', error);
                    });

                    return {
                        ...emailData,
                        originalSubject: email.subject,
                        from: email.from
                    };
                } catch (aiError: any) {
                    console.error(`AI Error for ${email.subject}:`, aiError);
                    return {
                        id: email.id,
                        original_subject: email.subject,
                        summary: email.snippet || "Summarization timed out.",
                        category: 'social',
                        from_address: email.from,
                        date: email.date
                    };
                }
            }));
            summarizedMissing.push(...chunkResults);
        }

        summarizedEmails.push(...summarizedMissing);

        // 3. Final cleanup for UI consistency
        const finalResult = summarizedEmails.map(e => ({
            ...e,
            id: e.id,
            user_email: e.user_email || userEmail,
            originalSubject: e.original_subject || e.originalSubject,
            from: e.from_address || e.from,
            date: e.date,
            summary: e.summary,
            category: e.category,
            unsubLink: e.unsub_link || e.unsubLink
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(finalResult);
    } catch (error: any) {
        console.error('CRITICAL API ERROR:', error);

        // Check for specific auth errors from Google API
        const errorMessage = error.message || '';
        if (errorMessage.includes('invalid authentication credentials') || error.code === 401) {
            return NextResponse.json({
                error: 'Unauthorized - Token expired or invalid',
                details: errorMessage
            }, { status: 401 });
        }

        return NextResponse.json({
            error: errorMessage || 'Unknown Error',
            details: "Rate limit reached or API failure."
        }, { status: 500 });
    }
}

