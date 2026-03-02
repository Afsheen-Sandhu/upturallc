export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const { to, cc, subject, html, type } = req.body;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SENDER = process.env.RESEND_SENDER || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY environment variable");
        return res.status(500).json({ success: false, message: "Configuration error." });
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
                to: Array.isArray(to) ? to : [to],
                cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
                subject: subject,
                html: html,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, id: data.id });
        } else {
            console.error("Resend API Error:", data);
            return res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}
