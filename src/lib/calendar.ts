import { google } from 'googleapis';

// Get Google Calendar client with access token
export function getCalendarClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
}

// Check availability for a specific date
export async function checkCalendarAvailability(accessToken: string, date: string) {
    const calendar = getCalendarClient(accessToken);

    // Fetch the calendar's primary timezone to ensure accuracy
    const { data: settings } = await calendar.settings.get({ setting: 'timezone' });
    const timeZone = settings.value || 'UTC';

    // Parse date string to get day bounds
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    try {
        // Get busy times from calendar
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                items: [{ id: 'primary' }],
            },
        });

        const busySlots = response.data.calendars?.primary?.busy || [];

        // Generate available 30-minute slots
        const availableSlots: string[] = [];
        const slotDuration = 30; // minutes

        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const slotStart = new Date(targetDate);
                slotStart.setHours(hour, minute, 0, 0);

                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

                // Check if slot overlaps with any busy period
                const isAvailable = !busySlots.some(busy => {
                    const busyStart = new Date(busy.start!);
                    const busyEnd = new Date(busy.end!);
                    return slotStart < busyEnd && slotEnd > busyStart;
                });

                if (isAvailable) {
                    const timeStr = slotStart.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    availableSlots.push(timeStr);
                }
            }
        }

        return {
            availableSlots,
            date,
            success: true
        };
    } catch (error: any) {
        console.error('Calendar availability error:', error);
        return {
            availableSlots: [],
            date,
            success: false,
            error: error.message
        };
    }
}

// Book an appointment by creating a calendar event
// Book an appointment by creating a calendar event
export async function bookCalendarAppointment(
    accessToken: string,
    name: string,
    isoDateTime: string,
    reason: string
) {
    const calendar = getCalendarClient(accessToken);
    const startTime = new Date(isoDateTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    try {
        const { data: settings } = await calendar.settings.get({ setting: 'timezone' });
        const timeZone = settings.value || 'UTC';

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `Meeting with ${name}`,
                description: `Purpose: ${reason}\n\nBooked via Reception AI`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone,
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone,
                },
            },
        });

        return {
            success: true,
            message: `✅ Confirmed: Appointment for ${name} at ${startTime.toLocaleTimeString()} for "${reason}".`,
            eventId: response.data.id,
            eventLink: response.data.htmlLink,
        };
    } catch (error: any) {
        console.error('Calendar booking error:', error);
        return {
            success: false,
            message: `Failed to book appointment: ${error.message}`,
        };
    }
}
