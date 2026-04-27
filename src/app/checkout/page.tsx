"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AI_ADDONS = [
  { id: "1", title: "Predictive Analytics" },
  { id: "2", title: "Sentiment Analysis" },
  { id: "3", title: "Multi-Channel AI" },
  { id: "4", title: "Custom Dashboards" },
  { id: "5", title: "Staff Training" },
  { id: "6", title: "AI Workflow Automation" },
  { id: "7", title: "Advanced Analytics" },
  { id: "8", title: "Security & Compliance" },
  { id: "9", title: "Custom API Integration" },
];

const TIER_NAMES: Record<string, string> = {
  startup: "Startup \u2013 AI Chat Support",
  smb: "SMB \u2013 Growing Business Solutions",
  enterprise: "Enterprise \u2013 Enterprise-Grade AI",
};

function getLabel(
  category: string | null,
  tier: string | null,
  type: string | null,
  service: string | null,
  plan: string | null
) {
  if (category === "ai" && tier) return TIER_NAMES[tier] || "AI Consultancy Plan";
  if (category === "digital") {
    if (type) return `Digital Solutions \u2013 ${type.replace(/-/g, " ")}`;
    if (service) return `Digital Solutions \u2013 ${service.replace(/-/g, " ")}`;
  }
  if (plan) return plan;
  return "Custom plan (we\u2019ll confirm with you).";
}

// Declare third-party globals on window
declare global {
  interface Window {
    paypal?: any;
    fbq?: (...args: unknown[]) => void;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "general";
  const tier = searchParams.get("tier");
  const type = searchParams.get("type");
  const service = searchParams.get("service");
  const plan = searchParams.get("plan");
  const price = searchParams.get("price");
  const paymentStatus = searchParams.get("payment");
  const fbclid = searchParams.get("fbclid");
  const utm_source = searchParams.get("utm_source");
  const utm_medium = searchParams.get("utm_medium");
  const utm_campaign = searchParams.get("utm_campaign");

  const planLabel = getLabel(category, tier, type, service, plan);

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);

  // Refs so PayPal callbacks see fresh state without stale closures
  const formRef = useRef(form);
  const addonsRef = useRef(selectedAddons);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { addonsRef.current = selectedAddons; }, [selectedAddons]);

  const toggleAddon = (addon: { id: string; title: string }) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      return exists ? prev.filter((a) => a.id !== addon.id) : [...prev, addon];
    });
  };

  // Handle return from Stripe hosted checkout
  useEffect(() => {
    if (paymentStatus === "success") {
      setConfirmation({ type: "success", message: "Payment received! Our team will contact you shortly to confirm next steps." });
      // Fire Meta Pixel
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Purchase", { content_name: planLabel, currency: "USD", value: 0 });
      }
    } else if (paymentStatus === "cancelled") {
      setConfirmation({ type: "info", message: "Payment was cancelled — no charge was made. You can try again below." });
    }
  }, [paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load PayPal JS SDK and render buttons
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return; // PayPal not configured — hide button

    const scriptId = "paypal-sdk";
    if (document.getElementById(scriptId)) {
      // Script already loaded (hot reload / re-mount)
      setPaypalReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;

    script.onload = () => setPaypalReady(true);
    script.onerror = () => console.warn("[PayPal SDK] failed to load.");

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount to avoid re-load on navigation
    };
  }, []);

  // Render PayPal buttons once SDK is ready
  useEffect(() => {
    if (!paypalReady || !window.paypal) return;

    const container = document.getElementById("paypal-button-container");
    if (!container) return;

    // Clear previous render
    container.innerHTML = "";

    window.paypal
      .Buttons({
        style: { layout: "horizontal", color: "gold", shape: "pill", label: "pay", height: 48 },

        createOrder: async () => {
          const f = formRef.current;
          if (!f.name.trim() || !f.email.trim()) {
            setConfirmation({ type: "error", message: "Please fill in your name and email before paying." });
            // Returning undefined aborts the PayPal flow
            return undefined as any;
          }

          const res = await fetch("/api/checkout/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planLabel, category, tier, price }),
          });

          const data = await res.json();
          if (data.error) {
            setConfirmation({ type: "error", message: `PayPal error: ${data.error}` });
            return undefined as any;
          }
          return data.orderID;
        },

        onApprove: async (data: { orderID: string }) => {
          setSubmitting(true);
          setConfirmation(null);
          try {
            const f = formRef.current;
            const res = await fetch("/api/checkout/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderID: data.orderID,
                name: f.name,
                email: f.email,
                phone: f.phone,
                company: f.company,
                notes: f.notes,
                planLabel,
                category,
                tier,
                price,
                addons: addonsRef.current,
                utm_source,
                utm_medium,
                utm_campaign,
              }),
            });
            const result = await res.json();
            if (result.status === "COMPLETED") {
              setConfirmation({ type: "success", message: "Payment received via PayPal! Our team will contact you shortly." });
              setForm({ name: "", email: "", phone: "", company: "", notes: "" });
              setSelectedAddons([]);
              if (typeof window !== "undefined" && window.fbq) {
                window.fbq("track", "Purchase", { content_name: planLabel, currency: "USD", payment_method: "paypal" });
              }
            } else {
              setConfirmation({ type: "error", message: "Payment could not be captured. Please try again or use card payment." });
            }
          } catch {
            setConfirmation({ type: "error", message: "An error occurred capturing your PayPal payment. Please try again." });
          } finally {
            setSubmitting(false);
          }
        },

        onCancel: () => {
          setConfirmation({ type: "info", message: "PayPal payment cancelled — no charge was made." });
        },

        onError: (err: unknown) => {
          console.error("[PayPal]", err);
          setConfirmation({ type: "error", message: "PayPal encountered an issue. Please try card payment instead." });
        },
      })
      .render("#paypal-button-container");
  }, [paypalReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stripe card payment
  const handleStripePayment = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setConfirmation({ type: "error", message: "Please fill in your name and email before paying." });
      return;
    }

    setSubmitting(true);
    setConfirmation(null);

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          planLabel,
          category,
          tier,
          price,
          addons: selectedAddons,
          fbclid,
          utm_source,
          utm_medium,
          utm_campaign,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConfirmation({ type: "error", message: data.error || "Could not redirect to payment. Please try again." });
        setSubmitting(false);
      }
    } catch {
      setConfirmation({ type: "error", message: "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  };

  const confirmationBg =
    confirmation?.type === "success"
      ? { background: "#E7F7EC", color: "#105126" }
      : confirmation?.type === "error"
      ? { background: "#FFF0EE", color: "#8B1A0A" }
      : { background: "#EEF4FF", color: "#1A3B8B" };

  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main className="checkout-page">
        <section className="checkout-wrapper">
          {/* ── Left: Order Summary ── */}
          <div>
            <div className="checkout-summary-label">
              <span className="dot"></span>
              <span>Order Summary</span>
            </div>
            <h1 className="checkout-title">
              Confirm your plan<br />and share your details
            </h1>
            <p className="checkout-subtitle">
              Pay a deposit to secure your spot and we&apos;ll confirm scope, deliverables, and timelines on a quick call.
            </p>

            <div className="selected-plan-pill">
              <i className="fa-solid fa-receipt"></i>
              <span>Selected Plan</span>
            </div>
            <div className="selected-plan-name">{planLabel}</div>
            <div className="selected-plan-price">
              {price
                ? `Deposit based on: ${decodeURIComponent(price)}`
                : "Deposit amount confirmed after reviewing your plan."}
            </div>

            <p className="checkout-notes">
              <strong>What happens next?</strong><br />
              After payment your order is securely recorded. Our team will reach out via email or phone
              within 1 business day to confirm timelines, deliverables, and any final pricing adjustments.
            </p>

            {/* Trust badges */}
            <div className="checkout-trust">
              <span><i className="fa-solid fa-lock"></i> Secure checkout</span>
              <span><i className="fa-brands fa-stripe"></i> Stripe</span>
              <span><i className="fa-brands fa-paypal"></i> PayPal</span>
            </div>
          </div>

          {/* ── Right: Form + Payment ── */}
          <div>
            <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
              <div className="checkout-form-group">
                <label className="checkout-label">Name *</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="Enter your full name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-label">Email *</label>
                <input
                  type="email"
                  className="checkout-input"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-label">Phone</label>
                <input
                  type="tel"
                  className="checkout-input"
                  placeholder="Optional, but helpful"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-label">Company</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="Your company name (optional)"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>

              <div className="checkout-form-group">
                <label className="checkout-label">Anything specific we should know?</label>
                <textarea
                  className="checkout-textarea"
                  placeholder="Share any context, links, or goals you have in mind."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* AI Add-ons */}
              {category === "ai" && (
                <div className="addons-section">
                  <div className="addons-title">Optional AI add-ons</div>
                  <div className="addons-helper">Select any extra features you&apos;d like included with this AI plan.</div>
                  <div className="addons-grid">
                    {AI_ADDONS.map((addon) => (
                      <button
                        key={addon.id}
                        type="button"
                        className={`addon-chip ${selectedAddons.find((a) => a.id === addon.id) ? "selected" : ""}`}
                        onClick={() => toggleAddon(addon)}
                      >
                        <span className="addon-check">{"\u2713"}</span>
                        <span>{addon.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Payment Methods ── */}
              <div className="payment-methods-section">
                <div className="payment-methods-label">
                  <span className="payment-methods-line"></span>
                  <span>Choose payment method</span>
                  <span className="payment-methods-line"></span>
                </div>

                {/* Stripe — Card */}
                <button
                  type="button"
                  className="stripe-pay-btn"
                  onClick={handleStripePayment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="checkout-spinner" style={{ display: "inline-block" }}></div>
                  ) : (
                    <i className="fa-regular fa-credit-card"></i>
                  )}
                  <span>{submitting ? "Redirecting…" : "Pay with Card"}</span>
                  <span className="stripe-badge">via Stripe</span>
                </button>

                {/* PayPal */}
                {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
                  <>
                    <div className="payment-or">or</div>
                    <div id="paypal-button-container" style={{ minHeight: 50 }}></div>
                  </>
                )}
              </div>

              {/* Confirmation / Error */}
              {confirmation && (
                <div
                  className="checkout-confirmation"
                  style={{ display: "block", ...confirmationBg }}
                >
                  {confirmation.message}
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#EEE9E3" }} />}>
      <CheckoutContent />
    </Suspense>
  );
}
