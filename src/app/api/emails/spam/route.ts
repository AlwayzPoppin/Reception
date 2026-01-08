import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchSpamEmails, unspamMessage, deleteMessage } from '@/lib/gmail';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const spamEmails = await fetchSpamEmails(session.accessToken, 10);

        // Transform to match Email interface with spam category
        const emails = spamEmails.map(email => ({
            id: email.id,
            originalSubject: email.subject,
            summary: email.snippet,
            category: 'spam' as const,
            from: email.from,
            date: email.date,
            unsubLink: email.unsubLink
        }));

        return NextResponse.json(emails);
    } catch (error: any) {
        console.error('Error fetching spam:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { action, emailId } = await req.json();

        if (action === 'unspam') {
            await unspamMessage(session.accessToken, emailId);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            await deleteMessage(session.accessToken, emailId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Spam action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
