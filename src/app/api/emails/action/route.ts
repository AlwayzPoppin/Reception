import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { archiveMessage, deleteMessage, blockSender, unsubscribeFromSender } from '@/lib/gmail';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { messageId, action } = await req.json();

        if (action === 'archive') {
            await archiveMessage(session.accessToken, messageId);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            await deleteMessage(session.accessToken, messageId);
            return NextResponse.json({ success: true });
        }

        if (action === 'block') {
            // Requires 'sender' in body
            const { sender } = await req.json();
            await blockSender(session.accessToken, sender);
            return NextResponse.json({ success: true, message: 'Sender blocked and added to trash filter' });
        }

        if (action === 'unsubscribe') {
            // Requires 'unsubLink' in body
            const { unsubLink } = await req.json();
            const result = await unsubscribeFromSender(session.accessToken, unsubLink);
            return NextResponse.json({ success: true, result });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    } catch (error: any) {
        console.error('Action Route Error:', error);
        return NextResponse.json({
            error: error.message,
            details: error.response?.data || error.stack
        }, { status: 500 });
    }
}
