import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const PAYPAL_BASE =
  process.env.PAYPAL_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

/** Extract the first dollar amount from strings like "$500–$1,200/month" */
function parsePriceDollars(priceStr: string | null, tier: string | null): number {
  if (priceStr) {
    const match = decodeURIComponent(priceStr).match(/\$?([\d,]+)/);
    if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  }
  const tierDefaults: Record<string, number> = {
    startup: 500,
    smb: 1500,
    enterprise: 5000,
  };
  return tierDefaults[tier ?? ""] ?? 500;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

export async function POST(req: NextRequest) {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return json(500, { error: "PayPal is not configured on this server." });
  }

  const body = (await req.json().catch(() => ({}))) as {
    planLabel?: string;
    category?: string;
    tier?: string;
    price?: string;
  };

  const amount = parsePriceDollars(body.price ?? null, body.tier ?? null);

  try {
    const accessToken = await getPayPalAccessToken();

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: body.planLabel || "Uptura Service Deposit",
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
      }),
      cache: "no-store",
    });

    const order = await res.json();
    if (!res.ok) {
      console.error("[PayPal] create order error:", order);
      return json(500, { error: order.message || "Failed to create PayPal order." });
    }

    return json(200, { orderID: order.id });
  } catch (err: any) {
    console.error("[PayPal] create order exception:", err);
    return json(500, { error: err.message || "PayPal request failed." });
  }
}
