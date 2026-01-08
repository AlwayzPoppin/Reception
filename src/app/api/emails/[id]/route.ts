import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGmailClient } from '@/lib/gmail';

/**
 * GET /api/emails/[id]
 * Fetches the full original email content by ID from Gmail.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const gmail = await getGmailClient(session.accessToken);

        const detail = await gmail.users.messages.get({
            userId: 'me',
            id: id,
            format: 'full'
        });

        const headers = detail.data.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers?.find(h => h.name === 'Date')?.value || '';

        // Decode the email body
        let body = '';
        const parts = detail.data.payload?.parts;

        if (parts) {
            // Multipart email - look for text/plain or text/html
            const textPart = parts.find(p => p.mimeType === 'text/plain');
            const htmlPart = parts.find(p => p.mimeType === 'text/html');

            const targetPart = textPart || htmlPart;
            if (targetPart?.body?.data) {
                body = Buffer.from(targetPart.body.data, 'base64').toString('utf-8');
            }
        } else if (detail.data.payload?.body?.data) {
            // Single-part email
            body = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8');
        }

        // Fallback to snippet if no body found
        if (!body) {
            body = detail.data.snippet || '';
        }

        return NextResponse.json({
            id,
            subject,
            from,
            date,
            body,
            snippet: detail.data.snippet
        });
    } catch (error: any) {
        console.error('Error fetching email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
