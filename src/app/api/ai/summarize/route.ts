import { NextResponse } from 'next/server';
import { summarizeEmail } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { content, subject } = await req.json();
        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const summary = await summarizeEmail(content, subject || 'No Subject');
        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 });
    }
}
