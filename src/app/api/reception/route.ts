import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkCalendarAvailability, bookCalendarAppointment } from '@/lib/calendar';

// This route handles the AI reception/scheduling logic
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { messages } = await req.json();
    const accessToken = session.accessToken;

    const result = await streamText({
        model: openai('gpt-4o'),
        messages,
        system: `You are a professional digital receptionist for ${session.user?.name || 'the user'}. 
Your goal is to assist guests with scheduling appointments and providing information.
Be polite, concise, and helpful.

When someone wants to schedule:
1. First ask what date they'd like (if not provided)
2. Check availability using the checkAvailability tool
3. Present the available slots clearly
4. When they choose a time, confirm their name and reason for the meeting
5. Use bookAppointment to finalize

Today's date is ${new Date().toLocaleDateString()}.`,
        tools: {
            checkAvailability: tool({
                description: 'Check Google Calendar for available time slots on a specific date',
                parameters: z.object({
                    date: z.string().describe('The ISO date string to check (YYYY-MM-DD format)'),
                }),
                // @ts-ignore
                execute: async ({ date }: { date: string }) => {
                    const result = await checkCalendarAvailability(accessToken, date);
                    if (!result.success) {
                        return {
                            error: 'Could not check calendar availability',
                            availableSlots: [],
                            date,
                        };
                    }
                    return result;
                },
            }),
            bookAppointment: tool({
                description: 'Book an appointment in the calendar',
                parameters: z.object({
                    name: z.string().describe('Guest name'),
                    isoDateTime: z.string().describe('The accurate ISO 8601 date-time string for the appointment start (e.g., 2023-10-27T14:00:00) calculated from the chosen slot.'),
                    reason: z.string().describe('Purpose of the visit'),
                }),
                // @ts-ignore
                execute: async ({ name, isoDateTime, reason }: { name: string; isoDateTime: string; reason: string }) => {
                    const result = await bookCalendarAppointment(accessToken, name, isoDateTime, reason);
                    return result;
                },
            }),
        },
    });

    return (result as any).toDataStreamResponse();
}
