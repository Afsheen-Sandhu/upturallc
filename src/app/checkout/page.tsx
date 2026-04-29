"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";
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
  startup: "Startup – AI Chat Support",
  smb: "SMB – Growing Business Solutions",
  enterprise: "Enterprise – Enterprise-Grade AI",
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
    if (type) return `Digital Solutions – ${type.replace(/-/g, " ")}`;
    if (service) return `Digital Solutions – ${service.replace(/-/g, " ")}`;
  }
  if (plan) return plan;
  return "Custom plan (we'll confirm with you).";
}

function CheckoutContent() {
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "general";
  const tier = searchParams.get("tier");
  const type = searchParams.get("type");
  const service = searchParams.get("service");
  const plan = searchParams.get("plan");
  const price = searchParams.get("price");

  const planLabel = getLabel(category, tier, type, service, plan);

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAddon = (addon: { id: string; title: string }) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      return exists ? prev.filter((a) => a.id !== addon.id) : [...prev, addon];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { db } = getFirebaseClient();
      await addDoc(collection(db, "orders"), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        notes: form.notes.trim() || null,
        category,
        planLabel,
        price: price ? decodeURIComponent(price) : null,
        tier: tier || null,
        addons: selectedAddons.length > 0 ? selectedAddons : null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err: any) {
      setError("Something went wrong. Please try again or contact us directly.");
      console.error("[Checkout] Firestore write error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#EEE9E3]">
        <Navbar />
        <main className="checkout-page">
          <section className="checkout-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", background: "#E7F7EC",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px", fontSize: 28
              }}>
                <i className="fa-solid fa-circle-check" style={{ color: "#10b981" }} />
              </div>
              <h1 className="checkout-title" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", marginBottom: 16 }}>
                Order received!
              </h1>
              <p style={{ color: "#555", lineHeight: 1.7, marginBottom: 32 }}>
                Thanks, <strong>{form.name}</strong>. Your order for <strong>{planLabel}</strong> has been
                logged. Our team will reach out to <strong>{form.email}</strong> within 1 business day to
                confirm scope, timeline, and next steps.
              </p>
              <a href="/" className="cta-button primary" style={{ display: "inline-block", textDecoration: "none" }}>
                <span>Back to Home</span>
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

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
              Fill in your details and place your order. Our team will review it and get back
              to you within 1 business day to discuss scope, deliverables, and timeline.
            </p>

            <div className="selected-plan-pill">
              <i className="fa-solid fa-receipt"></i>
              <span>Selected Plan</span>
            </div>
            <div className="selected-plan-name">{planLabel}</div>
            {price && (
              <div className="selected-plan-price">
                Estimated range: {decodeURIComponent(price)}
              </div>
            )}

            <p className="checkout-notes">
              <strong>What happens next?</strong><br />
              After you place your order it appears in our dashboard instantly. We&apos;ll reach out
              via email or phone within 1 business day to confirm timelines, deliverables, and pricing.
            </p>

            <div className="checkout-trust">
              <span><i className="fa-solid fa-lock"></i> No payment required now</span>
              <span><i className="fa-solid fa-shield-halved"></i> We&apos;ll confirm everything first</span>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div>
            <form className="checkout-form" onSubmit={handleSubmit}>
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
                        <span className="addon-check">{"✓"}</span>
                        <span>{addon.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="checkout-confirmation" style={{ display: "block", background: "#FFF0EE", color: "#8B1A0A" }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="stripe-pay-btn"
                disabled={submitting}
                style={{ marginTop: 8 }}
              >
                {submitting ? (
                  <div className="checkout-spinner" style={{ display: "inline-block" }} />
                ) : (
                  <i className="fa-solid fa-paper-plane" />
                )}
                <span>{submitting ? "Placing order…" : "Place Order"}</span>
              </button>

              <p className="consult-fine-print" style={{ marginTop: 12 }}>
                <i className="fa-solid fa-info-circle"></i>
                &nbsp;No payment is taken now. We&apos;ll confirm everything with you first.
              </p>
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
