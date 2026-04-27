import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    to?: string | string[];
    cc?: string | string[];
    subject?: string;
    html?: string;
  };

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SENDER = process.env.RESEND_SENDER || "onboarding@resend.dev";

  if (!RESEND_API_KEY) {
    return json(500, { success: false, message: "Missing RESEND_API_KEY environment variable" });
  }

  const toList = Array.isArray(body.to) ? body.to : [body.to].filter(Boolean) as string[];
  const ccList = body.cc ? (Array.isArray(body.cc) ? body.cc : [body.cc]) : undefined;

  if (!toList.length || !body.subject || !body.html) {
    return json(400, { success: false, message: "Missing required fields: to, subject, html" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Uptura <${SENDER}>`,
        to: toList,
        cc: ccList,
        subject: body.subject,
        html: body.html,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) return json(200, { success: true, id: (data as any)?.id });

    return json(response.status, {
      success: false,
      message: (data as any)?.message || "Resend API rejected the request.",
      error: data,
    });
  } catch (err: any) {
    return json(500, { success: false, message: err?.message || "Email request failed" });
  }
}

