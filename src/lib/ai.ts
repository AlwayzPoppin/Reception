import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// AI Service for Interception & Drafting

export interface EmailSummary {
    id: string;
    originalSubject: string;
    summary: string;
    category: 'newsletter' | 'urgent' | 'promo' | 'social' | 'spam';
    confidence: number;
}

async function summarizeEmail(content: string, subject: string): Promise<EmailSummary> {
    console.log(`AI summarizing content (length: ${content.length})`);
    if (!process.env.OPENAI_API_KEY) {
        console.error('MISSING OPENAI_API_KEY');
        throw new Error('AI Provider key missing');
    }

    try {
        // Add a timeout to the AI call to prevent hangs
        const aiPromise = generateText({
            model: openai('gpt-4o-mini'),
            prompt: `Analyze and summarize this email. Subject: ${subject}\nContent: ${content}.

Categorize as one of: newsletter, urgent, promo, social, or spam.

Mark as SPAM if it shows signs of:
- Unsolicited marketing or phishing
- "Too good to be true" offers (free money, lottery wins)
- Suspicious sender or threatening language
- Requests for personal/financial information
- Unknown sender with generic greeting

Return format: Summary | Category`,
        });

        const timeoutPromise = new Promise<{ text: string }>((_, reject) =>
            setTimeout(() => reject(new Error('AI_TIMEOUT')), 8000)
        );

        const { text } = await Promise.race([aiPromise, timeoutPromise]) as { text: string };
        console.log('AI Response received');

        const [summary, categoryStr] = text.split('|').map(s => s.trim());
        const category = (['newsletter', 'urgent', 'promo', 'social', 'spam'].includes(categoryStr?.toLowerCase())
            ? categoryStr.toLowerCase()
            : 'social') as EmailSummary['category'];

        return {
            id: Math.random().toString(36).substring(7),
            originalSubject: subject,
            summary: summary || "Quick update from your inbox.",
            category,
            confidence: 0.9
        };
    } catch (err) {
        console.error('OpenAI Error:', err);
        throw err;
    }
}

async function generateReplyDraft(content: string, subject: string, from: string, toneContext?: string, userName?: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) throw new Error('AI Provider key missing');

    const tone = toneContext || '';
    const name = userName || 'the user';

    const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `You are ${name}'s AI email assistant. Write a reply to this email.
    
    ${tone}
    
    Email From: ${from}
    Subject: ${subject}
    Content Snippet: ${content}
    
    Goal: Acknowledge politely. If it's a purchase/promo, keep it very short. If it's person-to-person, be helpful.
    Only return the reply body text.`,
    });

    return text;
}

async function refineReplyDraft(previousDraft: string, feedback: string, originalContent: string, toneContext?: string, userName?: string): Promise<string> {
    console.log(`AI Refinement Requested. Feedback: "${feedback}"`);
    if (!process.env.OPENAI_API_KEY) throw new Error('AI Provider key missing');

    const tone = toneContext || '';
    const name = userName || 'the user';

    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: `You are ${name}'s AI email assistant. Refine this email draft based on the user's feedback.
    
    ${tone}
    
    Previous Draft: ${previousDraft}
    User Feedback: ${feedback}
    Original Email Content: ${originalContent}
    
    Goal: Update the draft to better reflect the feedback while matching the tone preferences above.
    Only return the new draft body text.`,
        });
        console.log('AI Refinement Completed');
        return text;
    } catch (err) {
        console.error('AI Refinement Error:', err);
        throw err;
    }
}

export { summarizeEmail, generateReplyDraft, refineReplyDraft };
