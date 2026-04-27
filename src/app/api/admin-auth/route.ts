import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type LoginBody = { email?: string; password?: string };
type VerifyBody = { token?: string };

function normalizeEmail(email: unknown) {
  return String(email || "").trim().toLowerCase();
}

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL || "admin@uptura.net");
  const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "qamaruptura12!");
  const AUTH_TOKEN = String(process.env.AUTH_TOKEN || "uptura_admin_session_v1");

  if (action === "login") {
    const body = (await req.json().catch(() => ({}))) as LoginBody;
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return json(200, { success: true, token: AUTH_TOKEN, message: "Login successful" });
    }
    return json(401, { success: false, message: "Invalid email or password" });
  }

  if (action === "verify") {
    const body = (await req.json().catch(() => ({}))) as VerifyBody;
    const token = String(body.token || "");
    if (token && token === AUTH_TOKEN) return json(200, { success: true });
    return json(401, { success: false, message: "Invalid session" });
  }

  return json(400, { success: false, message: "Invalid action" });
}

