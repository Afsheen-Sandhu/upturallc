import { NextRequest } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Firebase (server-side) — reads from env so no client key exposure risk
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const app =
    getApps().find((a) => a.name === "stripe-webhook") ||
    initializeApp(firebaseConfig, "stripe-webhook");
  return getFirestore(app);
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");

  if (!stripeKey || !webhookSecret || !sig) {
    return new Response("Webhook not configured", { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const rawBody = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe webhook] signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    try {
      const db = getDb();
      await addDoc(collection(db, "orders"), {
        name: meta.name ?? "",
        email: meta.email ?? "",
        planLabel: meta.planLabel ?? "",
        category: meta.category ?? "",
        tier: meta.tier ?? "",
        addons: JSON.parse(meta.addons || "[]"),
        paymentMethod: "stripe",
        paymentStatus: "paid",
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        utm_source: meta.utm_source ?? "",
        utm_medium: meta.utm_medium ?? "",
        utm_campaign: meta.utm_campaign ?? "",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[Stripe webhook] Firebase save error:", err);
      // Return 200 so Stripe doesn't retry — log the error manually
    }
  }

  return new Response("ok", { status: 200 });
}
