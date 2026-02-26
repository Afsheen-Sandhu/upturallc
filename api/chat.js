export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: 'Method Not Allowed' });
    }

    try {
        const { message, history } = req.body;
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!OPENAI_API_KEY) {
            console.error("Missing OPENAI_API_KEY environment variable");
            return res.status(500).json({ reply: "Server configuration error (API Key missing)." });
        }

        const systemMessage = {
            role: "system",
            content: `You are **TuraBot**, the official AI Consultant for **Uptura**.
            
            ## PHILOSOPHY
            You are a partner consultant. Your job is to understand before you solve.
            
            ## CORE RULES
            1. **DISCOVERY FIRST**: Do NOT give links or buttons in the very first response where a user mentions a service. Instead, ask ONE short qualifying question.
            2. **STRICT BUTTON FORMAT**: NEVER use standard Markdown links like [text](url). All links MUST be provided using the ACTION_JSON block at the very end of your message.
            3. **ONE PRECISE LINK**: Once qualified, provide the single most relevant link for that service.
            4. **CONCISE RESPONSES**: Keep your text under 3 sentences.
            
            ## INTENT ROUTING
            - **Web Development**: /digital-solutions.html#web-table
            - **Web Redesign**: /digital-solutions.html#redesign-table
            - **SEO Services**: /digital-solutions.html#seo-table
            - **Social Media**: /digital-solutions.html#social-table
            - **App Development**: /digital-solutions.html#app-table
            - **AI Automation**: /ai-consultancy.html
            - **Ready to Start**: /contact.html
            
            ## ACTION BUTTON SYSTEM
            When providing a link, use this EXACT format. Do NOT use markdown links in the text above.
            
            \`\`\`ACTION_JSON
            {
              "actions": [
                {"label": "Human-friendly label", "url": "approved-url"}
              ]
            }
            \`\`\`
            
            ## PERSONA
            - Senior Partner. Direct, respectful, and brief.
            - "Welcome to Uptura. What's the core focus of your project today?"`
        };

        // Construct message history for OpenAI
        // Use provided history if available, otherwise just system + current message
        const messages = history && Array.isArray(history) && history.length > 0
            ? [systemMessage, ...history]
            : [systemMessage, { role: "user", content: message }];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
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
