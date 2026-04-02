"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
  authDomain: "uptura-leads.firebaseapp.com",
  projectId: "uptura-leads",
  storageBucket: "uptura-leads.firebasestorage.app",
  messagingSenderId: "146306181969",
  appId: "1:146306181969:web:c91b776edc33f652c2c170",
  measurementId: "G-ELHWMEHZ9W"
};

const app = initializeApp(firebaseConfig, "checkout");
const db = getFirestore(app);

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

function getLabel(category: string | null, tier: string | null, type: string | null, service: string | null, plan: string | null) {
  if (category === "ai" && tier) return TIER_NAMES[tier] || "AI Consultancy Plan";
  if (category === "digital") {
    if (type) return `Digital Solutions \u2013 ${type.replace(/-/g, " ")}`;
    if (service) return `Digital Solutions \u2013 ${service.replace(/-/g, " ")}`;
  }
  if (plan) return plan;
  return "Custom plan (we\u2019ll confirm with you).";
}

function CheckoutContent() {
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "general";
  const tier = searchParams.get("tier");
  const type = searchParams.get("type");
  const service = searchParams.get("service");
  const plan = searchParams.get("plan");
  const price = searchParams.get("price");
  const fbclid = searchParams.get("fbclid");
  const utm_source = searchParams.get("utm_source");
  const utm_medium = searchParams.get("utm_medium");
  const utm_campaign = searchParams.get("utm_campaign");

  const planLabel = getLabel(category, tier, type, service, plan);

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; title: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const toggleAddon = (addon: { id: string; title: string }) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      return exists ? prev.filter((a) => a.id !== addon.id) : [...prev, addon];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert("Please enter at least your name and email so we can contact you.");
      return;
    }

    setSubmitting(true);
    setConfirmation(null);

    try {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          content_name: planLabel,
          email: form.email,
          value: null,
          currency: "USD",
          fbclid,
          utm_source,
          utm_medium,
          utm_campaign,
          addons: selectedAddons.map((a) => a.title),
        });
      }

      await addDoc(collection(db, "orders"), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
        category,
        tier,
        type,
        service,
        planLabel,
        price: price ? decodeURIComponent(price) : null,
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
        fbclid,
        utm_source,
        utm_medium,
        utm_campaign,
        addons: selectedAddons,
        createdAt: serverTimestamp(),
      });

      setConfirmation("Order received. Our team will contact you shortly.");
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
      setSelectedAddons([]);
    } catch (error) {
      console.error("Error saving order to Firebase:", error);
      setConfirmation("Something went wrong while saving your order. Please try again or contact info@uptura.net.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EEE9E3]">
      <Navbar />
      <main className="checkout-page">
        <section className="checkout-wrapper">
          {/* Left: Order Summary */}
          <div>
            <div className="checkout-summary-label">
              <span className="dot"></span>
              <span>Order Summary</span>
            </div>
            <h1 className="checkout-title">
              Confirm your plan<br />and share your details
            </h1>
            <p className="checkout-subtitle">
              This isn&apos;t a payment &mdash; it simply lets us capture the plan you&apos;re interested in so our team can
              review, confirm the scope, and reach out with next steps.
            </p>

            <div className="selected-plan-pill">
              <i className="fa-solid fa-receipt"></i>
              <span>Selected Plan</span>
            </div>
            <div className="selected-plan-name">{planLabel}</div>
            <div className="selected-plan-price">
              {price
                ? `Approximate pricing: ${decodeURIComponent(price)} (final quote shared after review).`
                : "Pricing will be finalized after our call."}
            </div>

            <p className="checkout-notes">
              <strong>What happens next?</strong><br />
              Once you place this order, your details and selected plan are securely stored in our system.
              Our team will review everything and contact you shortly via email or phone to confirm timelines,
              deliverables, and final pricing.
            </p>
          </div>

          {/* Right: Form */}
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

              {/* AI Addons */}
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

              <button type="submit" className="checkout-submit" disabled={submitting}>
                {submitting && <div className="checkout-spinner" style={{ display: "inline-block" }}></div>}
                <span>{submitting ? "Placing order..." : "Place Order"}</span>
              </button>

              {confirmation && (
                <div className="checkout-confirmation" style={{ display: "block" }}>
                  {confirmation}
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
