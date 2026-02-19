export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: 'Method Not Allowed' });
    }

    try {
        const { message } = req.body;

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!OPENAI_API_KEY) {
            console.error("Missing OPENAI_API_KEY environment variable");
            return res.status(500).json({ reply: "Server configuration error (API Key missing)." });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant for Uptura, a premium digital agency specializing in Web Development, SEO, and AI Consultancy. Professional and concise." },
                    { role: "user", content: message }
                ],
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI Error:", data.error);
            return res.status(500).json({ reply: "OpenAI service error." });
        }

        const reply = data.choices[0].message.content.trim();
        res.status(200).json({ reply });

    } catch (error) {
        console.error("Serverless Error:", error);
        res.status(500).json({ reply: "Internal Server Error" });
    }
}
