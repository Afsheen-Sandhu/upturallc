import { NextRequest } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function json(status: number, body: unknown) {
  return Response.json(body, { status });
}

export type CheckoutSessionDetailsResponse = {
  sessionId: string;
  paymentStatus: string;
  status: string;
  customerName: string;
  customerEmail: string;
  planLabel: string;
  description: string;
  amountTotal: number;
  currency: string;
  createdAt: number;
  receiptUrl: string | null;
};

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) {
    return json(400, { error: "Invalid checkout session." });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json(500, { error: "Stripe is not configured." });

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product", "payment_intent.latest_charge"],
    });

    if (session.payment_status !== "paid") {
      return json(400, { error: "Payment has not been completed for this session." });
    }

    const meta = session.metadata ?? {};
    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product;
    const productName =
      typeof product === "object" && product !== null && "name" in product
        ? (product as Stripe.Product).name
        : null;

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    const charge = paymentIntent?.latest_charge;
    const receiptUrl =
      typeof charge === "object" && charge !== null && "receipt_url" in charge
        ? (charge as Stripe.Charge).receipt_url ?? null
        : null;

    const payload: CheckoutSessionDetailsResponse = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status ?? "complete",
      customerName: meta.name ?? session.customer_details?.name ?? "",
      customerEmail: meta.email ?? session.customer_email ?? session.customer_details?.email ?? "",
      planLabel: meta.planLabel ?? productName ?? "Consultation",
      description: lineItem?.description ?? productName ?? meta.planLabel ?? "Uptura consultation",
      amountTotal: session.amount_total ?? 0,
      currency: (session.currency ?? "usd").toUpperCase(),
      createdAt: session.created * 1000,
      receiptUrl,
    };

    return json(200, payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load payment details.";
    console.error("[Stripe] session retrieve error:", err);
    return json(500, { error: message });
  }
}
