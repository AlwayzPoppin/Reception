import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchTrashedEmails } from '@/lib/gmail';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const trashedEmails = await fetchTrashedEmails(session.accessToken, 20);

        // Map to UI format
        const mapped = trashedEmails.map(e => ({
            id: e.id,
            originalSubject: e.subject,
            summary: e.snippet,
            from: e.from,
            date: e.date,
            category: 'Trash'
        }));

        return NextResponse.json(mapped);
    } catch (error: any) {
        console.error('Trash API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
