import { NextRequest } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/** Extract the first dollar amount from strings like "$500–$1,200/month" → 500 (dollars) */
function parsePriceCents(priceStr: string | null, tier: string | null): number {
  if (priceStr) {
    const match = decodeURIComponent(priceStr).match(/\$?([\d,]+)/);
    if (match) return parseInt(match[1].replace(/,/g, ""), 10) * 100;
  }
  const tierDefaults: Record<string, number> = {
    startup: 50000,    // $500
    smb: 150000,       // $1,500
    enterprise: 500000, // $5,000
  };
  return tierDefaults[tier ?? ""] ?? 50000;
}

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return json(500, { error: "Stripe is not configured on this server." });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    planLabel?: string;
    category?: string;
    tier?: string;
    price?: string;
    addons?: { id: string; title: string }[];
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  const origin = req.headers.get("origin") || "https://uptura.net";
  const amountCents = parsePriceCents(body.price ?? null, body.tier ?? null);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: body.planLabel || "Uptura Service Deposit",
              description: "Retainer deposit — final scope and deliverables confirmed after our review call.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        name: body.name ?? "",
        email: body.email ?? "",
        planLabel: body.planLabel ?? "",
        category: body.category ?? "",
        tier: body.tier ?? "",
        addons: JSON.stringify(body.addons ?? []),
        utm_source: body.utm_source ?? "",
        utm_medium: body.utm_medium ?? "",
        utm_campaign: body.utm_campaign ?? "",
      },
      success_url: `${origin}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?payment=cancelled`,
    });

    return json(200, { url: session.url });
  } catch (err: any) {
    console.error("[Stripe] create session error:", err);
    return json(500, { error: err.message || "Failed to create Stripe session." });
  }
}
