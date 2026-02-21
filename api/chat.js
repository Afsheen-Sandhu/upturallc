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
                    {
                        role: "system",
                        content: `You are TuraBot, the AI ambassador for Uptura, a elite digital agency. 
                        Your goal is to provide professional, concise, and helpful information about our services. 

                        Uptura specializes in:
                        1. Custom Web Development: Responsive, scalable, and user-friendly websites.
                        2. Web Design: Visually stunning and intuitive research-backed interfaces.
                        3. SEO Services: Increasing search visibility, organic traffic, and target audience reach.
                        4. Mobile App Development: High-performance native and cross-platform apps.
                        5. AI Consultancy: Optimizing business processes, automating workflows, and providing data-driven insights.
                        6. Social Media Marketing: Enhancing engagement and reach through content strategy.

                        Contact Info:
                        - Website: uptura.net
                        - Email: info@uptura.net
                        - Phone: +1 406-235-6305
                        - Location: Kalispell, Montana, US.

                        Always be polite, professional, and focus on how Uptura can help the user's business grow. If you don't know an answer, direct them to contact us via email or phone.`
                    },
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
