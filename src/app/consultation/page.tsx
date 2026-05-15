"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultationPaymentSuccess from "@/components/ConsultationPaymentSuccess";

const CONSULTATION_PRICE_CENTS = 5000; // $50
const CONSULTATION_PRICE_LABEL = "$50";

function getCheckoutOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return "https://uptura.net";
  return window.location.origin.replace("://www.", "://");
}

function isPaymentSuccess(params: URLSearchParams) {
  return params.get("payment") === "success" || Boolean(params.get("session_id"));
}

function isPaymentCancelled(params: URLSearchParams) {
  return params.get("payment") === "cancelled";
}

const PERKS = [
  { icon: "fa-solid fa-clock", text: "30-minute 1-on-1 strategy session" },
  { icon: "fa-solid fa-bullseye", text: "Tailored advice for your specific business" },
  { icon: "fa-solid fa-diagram-project", text: "Actionable growth roadmap you can keep" },
  { icon: "fa-solid fa-comments", text: "Ask anything — AI, web, digital marketing" },
];

function ConsultationContent() {
  const searchParams = useSearchParams();
  const paidFromUrl = useMemo(() => isPaymentSuccess(searchParams), [searchParams]);
  const cancelledFromUrl = useMemo(() => isPaymentCancelled(searchParams), [searchParams]);
  const sessionId = searchParams.get("session_id");

  const [form, setForm] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(paidFromUrl);

  useEffect(() => {
    if (paidFromUrl) {
      setSuccess(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (isPaymentSuccess(params)) setSuccess(true);
  }, [paidFromUrl]);

  const handleBook = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please enter your name and email to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const origin = getCheckoutOrigin();
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          planLabel: "30-Min Strategy Consultation",
          category: "consultation",
          priceCents: CONSULTATION_PRICE_CENTS,
          productDescription: "One-on-one 30-minute strategy call with the Uptura team.",
          successUrl: `${origin}/consultation?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/consultation?payment=cancelled`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Could not connect to payment. Please try again.");
      setSubmitting(false);
    }
  };

  if (success || paidFromUrl) {
    return (
      <div style={{ background: "#EEE9E3", minHeight: "100vh" }}>
        <Navbar />
        <main className="consult-page consult-page--success">
          <ConsultationPaymentSuccess sessionId={sessionId} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "#EEE9E3", minHeight: "100vh" }}>
      <Navbar />
      <main className="consult-page">
        {cancelledFromUrl && (
          <p className="consult-cancelled-banner" role="status">
            Payment was cancelled. You can try again below.
          </p>
        )}
        {/* ── Hero ── */}
        <section className="consult-hero">
          <div className="consult-hero-inner">
            <div className="consult-badge">
              <i className="fa-solid fa-bolt"></i>
              <span>Book a Call</span>
            </div>
            <h1 className="consult-title">
              30-Minute Strategy<br />Consultation
            </h1>
            <p className="consult-subtitle">
              Get expert eyes on your business. Walk away with a clear, prioritised
              action plan — not a sales pitch.
            </p>
            <div className="consult-price-pill">
              <span className="consult-price-amount">{CONSULTATION_PRICE_LABEL}</span>
              <span className="consult-price-label">one-time · no recurring charge</span>
            </div>
          </div>
        </section>

        {/* ── Card ── */}
        <section className="consult-card-section">
          <div className="consult-card">
            {/* Left: What's included */}
            <div className="consult-included">
              <p className="consult-included-title">What&apos;s included</p>
              <ul className="consult-perks">
                {PERKS.map((p) => (
                  <li key={p.text} className="consult-perk">
                    <span className="consult-perk-icon">
                      <i className={p.icon}></i>
                    </span>
                    <span>{p.text}</span>
                  </li>
                ))}
              </ul>
              <div className="consult-guarantee">
                <i className="fa-solid fa-shield-halved"></i>
                <span>If we can&apos;t add value, we&apos;ll refund you — no questions asked.</span>
              </div>
            </div>

            {/* Right: Form */}
            <div className="consult-form-col">
              {success ? (
                <div className="consult-success">
                  <i className="fa-solid fa-circle-check"></i>
                  <h2>You&apos;re booked!</h2>
                  <p>Payment confirmed. Our team will email you within a few hours with your calendar link.</p>
                </div>
              ) : (
                <>
                  <p className="consult-form-heading">Your details</p>

                  <div className="consult-form-group">
                    <label className="consult-label">Full name *</label>
                    <input
                      type="text"
                      className="consult-input"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="consult-form-group">
                    <label className="consult-label">Email *</label>
                    <input
                      type="email"
                      className="consult-input"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  {error && <p className="consult-error">{error}</p>}

                  <button
                    className="consult-pay-btn"
                    onClick={handleBook}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="checkout-spinner" style={{ display: "inline-block" }}></div>
                    ) : (
                      <i className="fa-regular fa-credit-card"></i>
                    )}
                    <span>{submitting ? "Redirecting to Stripe…" : `Book Now — ${CONSULTATION_PRICE_LABEL}`}</span>
                  </button>

                  <p className="consult-fine-print">
                    <i className="fa-solid fa-lock"></i>
                    &nbsp;Secured by Stripe. Your card details never touch our servers.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function Consultation() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#EEE9E3" }} />}>
      <ConsultationContent />
    </Suspense>
  );
}
