export async function sendEmail({ to, subject, html }) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SENDER = process.env.RESEND_SENDER || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
        console.error("[Email] Missing RESEND_API_KEY environment variable");
        return false;
    }

    // Ensure to is an array
    const recipients = Array.isArray(to) ? to : [to];
    const validRecipients = recipients.filter(email => email && typeof email === 'string' && email.trim() !== '');

    if (validRecipients.length === 0) {
        console.error("[Email] No valid recipients provided");
        return false;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `Uptura <${SENDER}>`,
                to: validRecipients,
                subject: subject,
                html: html,
            }),
        });

        if (response.ok) {
            await response.json();
            return true;
        } else {
            const data = await response.json();
            console.error("[Email] Resend API Error:", JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        console.error("[Email] Fetch Exception:", error);
        return false;
    }
}
