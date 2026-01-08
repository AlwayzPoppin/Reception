import { google } from 'googleapis';

export async function getGmailClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.gmail({ version: 'v1', auth });
}

export async function fetchLatestEmails(accessToken: string, maxResults = 5) {
    const gmail = await getGmailClient(accessToken);

    const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'is:inbox'
    });

    const messages = response.data.messages || [];

    const emailDetails = await Promise.all(
        messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
            });

            const headers = detail.data.payload?.headers;
            const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers?.find(h => h.name === 'Date')?.value || '';

            // Basic snippet or body extraction
            const snippet = detail.data.snippet || '';

            const unsubHeader = headers?.find(h => h.name === 'List-Unsubscribe')?.value;
            const unsubLink = unsubHeader ? unsubHeader.replace(/^<|>$/g, '').split(',')[0].trim() : undefined;

            return {
                id: msg.id,
                subject,
                from,
                date,
                snippet,
                body: detail.data.payload?.parts?.[0]?.body?.data || detail.data.snippet,
                unsubLink
            };
        })
    );

    return emailDetails;
}

export async function createDraft(accessToken: string, to: string, subject: string, content: string) {
    const gmail = await getGmailClient(accessToken);

    // RFC 2822 format for email
    const str = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        content
    ].join("\n");

    const encodedMail = Buffer.from(str).toString("base64url");

    const res = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
            message: {
                raw: encodedMail
            }
        }
    });

    return res.data;
}

export async function archiveMessage(accessToken: string, messageId: string) {
    const gmail = await getGmailClient(accessToken);

    return gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
            ids: [messageId],
            removeLabelIds: ['INBOX']
        }
    });
}

export async function deleteMessage(accessToken: string, messageId: string) {
    const gmail = await getGmailClient(accessToken);

    return gmail.users.messages.trash({
        userId: 'me',
        id: messageId
    });
}

// Fetch emails from Gmail's spam folder
export async function fetchSpamEmails(accessToken: string, maxResults = 10) {
    const gmail = await getGmailClient(accessToken);

    const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: ['SPAM']
    });

    const messages = response.data.messages || [];

    const emailDetails = await Promise.all(
        messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
            });

            const headers = detail.data.payload?.headers;
            const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers?.find(h => h.name === 'Date')?.value || '';
            const snippet = detail.data.snippet || '';

            const unsubHeader = headers?.find(h => h.name === 'List-Unsubscribe')?.value;
            const unsubLink = unsubHeader ? unsubHeader.replace(/^<|>$/g, '').split(',')[0].trim() : undefined;

            return {
                id: msg.id,
                subject,
                from,
                date,
                snippet,
                unsubLink
            };
        })
    );

    return emailDetails;
}

export async function fetchTrashedEmails(accessToken: string, maxResults = 10) {
    const gmail = await getGmailClient(accessToken);

    const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        labelIds: ['TRASH']
    });

    const messages = response.data.messages || [];

    const emailDetails = await Promise.all(
        messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
            });

            const headers = detail.data.payload?.headers;
            const subject = headers?.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers?.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers?.find(h => h.name === 'Date')?.value || '';
            const snippet = detail.data.snippet || '';

            return {
                id: msg.id,
                subject,
                from,
                date,
                snippet
            };
        })
    );

    return emailDetails;
}

// Move email out of spam back to inbox
export async function unspamMessage(accessToken: string, messageId: string) {
    const gmail = await getGmailClient(accessToken);


    return gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
            removeLabelIds: ['SPAM'],
            addLabelIds: ['INBOX']
        }
    });
}

// Block sender by creating a filter that sends their emails to trash
export async function blockSender(accessToken: string, sender: string) {
    const gmail = await getGmailClient(accessToken);

    // Extract email address from format "Name <email@example.com>" if needed
    const emailMatch = sender.match(/<(.+)>/);
    const emailAddress = emailMatch ? emailMatch[1] : sender;

    return gmail.users.settings.filters.create({
        userId: 'me',
        requestBody: {
            criteria: {
                from: emailAddress
            },
            action: {
                removeLabelIds: ['INBOX'],
                addLabelIds: ['TRASH']
            }
        }
    });
}

// Unsubscribe logic
export async function unsubscribeFromSender(accessToken: string, unsubLink: string) {
    if (unsubLink.startsWith('mailto:')) {
        const gmail = await getGmailClient(accessToken);
        const match = unsubLink.match(/^mailto:([^?]+)(\?subject=(.*))?/);
        if (!match) throw new Error('Invalid mailto link');

        const to = match[1];
        const subject = match[3] || 'Unsubscribe';
        const content = 'Please unsubscribe me from this list.';

        // Create raw email
        const str = [
            `To: ${to}`,
            `Subject: ${subject}`,
            "",
            content
        ].join("\n");
        const encodedMail = Buffer.from(str).toString("base64url");

        return gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMail
            }
        });
    } else if (unsubLink.startsWith('http')) {
        // For http links, we might just return the link to the frontend to open, 
        // OR primarily try to fetch it if it's a direct action link.
        // For safety, let's just return the link url so the frontend can confirm/open it.
        // But the user asked for "AI can unsubscribe for you". 
        // Simple fetch often works for one-click unsubs.
        try {
            const res = await fetch(unsubLink);
            return { success: res.ok, type: 'http' };
        } catch (e) {
            return { success: false, url: unsubLink, type: 'http_failed' };
        }
    }
    throw new Error('Unknown unsubscribe format');
}

// Send email directly
export async function sendEmail(accessToken: string, to: string, subject: string, content: string) {
    const gmail = await getGmailClient(accessToken);

    const str = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        content
    ].join("\n");

    const encodedMail = Buffer.from(str).toString("base64url");

    return gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMail
        }
    });
}
