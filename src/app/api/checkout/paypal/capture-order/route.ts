import { NextRequest } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

const PAYPAL_BASE =
  process.env.PAYPAL_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com");

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
    getApps().find((a) => a.name === "paypal-capture") ||
    initializeApp(firebaseConfig, "paypal-capture");
  return getFirestore(app);
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
    orderID?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    planLabel?: string;
    category?: string;
    tier?: string;
    price?: string;
    addons?: { id: string; title: string }[];
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  if (!body.orderID) return json(400, { error: "Missing orderID" });

  try {
    const accessToken = await getPayPalAccessToken();

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${body.orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const capture = await res.json();

    if (capture.status === "COMPLETED") {
      // Save to Firebase
      try {
        const db = getDb();
        await addDoc(collection(db, "orders"), {
          name: body.name ?? "",
          email: body.email ?? "",
          phone: body.phone ?? "",
          company: body.company ?? "",
          notes: body.notes ?? "",
          planLabel: body.planLabel ?? "",
          category: body.category ?? "",
          tier: body.tier ?? "",
          addons: body.addons ?? [],
          paymentMethod: "paypal",
          paymentStatus: "paid",
          paypalOrderId: body.orderID,
          price: body.price ? decodeURIComponent(body.price) : null,
          utm_source: body.utm_source ?? "",
          utm_medium: body.utm_medium ?? "",
          utm_campaign: body.utm_campaign ?? "",
          createdAt: serverTimestamp(),
        });
      } catch (fbErr) {
        console.error("[PayPal capture] Firebase save error:", fbErr);
        // Still return success — payment went through
      }

      return json(200, { status: "COMPLETED" });
    }

    console.error("[PayPal capture] not completed:", capture);
    return json(400, { error: "Payment capture not completed", details: capture.status });
  } catch (err: any) {
    console.error("[PayPal capture] exception:", err);
    return json(500, { error: err.message || "PayPal capture failed." });
  }
}
