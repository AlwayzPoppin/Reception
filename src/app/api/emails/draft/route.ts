import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateReplyDraft, refineReplyDraft } from '@/lib/ai';
import { createDraft, sendEmail } from '@/lib/gmail';

// Drafting & Reply API Route
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { emailId, from, subject, content, action, draftText, feedback, previousDraft, toneContext, userName } = body;

        if (action === 'generate') {
            const result = await generateReplyDraft(content, subject, from, toneContext, userName);
            return NextResponse.json({ draftText: result });
        }

        if (action === 'create') {
            const result = await createDraft(session.accessToken, from, `Re: ${subject}`, draftText);
            return NextResponse.json({ success: true, draftId: result.id });
        }

        if (action === 'refine') {
            console.log(`Refining draft for ${emailId}. Feedback: ${feedback}`);
            console.log(`Previous Draft length: ${previousDraft?.length}, Content length: ${content?.length}`);
            const result = await refineReplyDraft(previousDraft, feedback, content, toneContext, userName);
            return NextResponse.json({ draftText: result });
        }

        if (action === 'send') {
            await sendEmail(session.accessToken, from, `Re: ${subject}`, draftText);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    } catch (error: any) {
        console.error('Draft API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
