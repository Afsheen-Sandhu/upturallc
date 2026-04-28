import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_MESSAGE = {
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
- **Web Development**: /digital-solutions#web-table
- **Web Redesign**: /digital-solutions#redesign-table
- **SEO Services**: /digital-solutions#seo-table
- **Social Media**: /digital-solutions#social-table
- **App Development**: /digital-solutions#app-table
- **AI Automation**: /ai-consultancy
- **Ready to Start**: /contact

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
- "Welcome to Uptura. What's the core focus of your project today?"`,
};

export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as {
      message: string;
      history?: { role: string; content: string }[];
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ reply: "Server configuration error." }, { status: 500 });
    }

    const messages =
      history && Array.isArray(history) && history.length > 0
        ? [SYSTEM_MESSAGE, ...history]
        : [SYSTEM_MESSAGE, { role: "user", content: message }];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
      }),
    });

    const data = (await res.json()) as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };

    if (data.error) {
      return Response.json({ reply: "OpenAI service error." }, { status: 500 });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() ?? "No response.";
    return Response.json({ reply });
  } catch {
    return Response.json({ reply: "Internal server error." }, { status: 500 });
  }
}
