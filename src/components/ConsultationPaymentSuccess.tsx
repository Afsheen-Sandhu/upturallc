"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CheckoutSessionDetailsResponse } from "@/app/api/checkout/stripe/session/route";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

type Props = {
  sessionId: string | null;
};

export default function ConsultationPaymentSuccess({ sessionId }: Props) {
  const [details, setDetails] = useState<CheckoutSessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/stripe/session?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load payment details.");
          return;
        }
        setDetails(data);
      } catch {
        if (!cancelled) setError("Could not load payment details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <section className="consult-success-screen">
        <div className="checkout-spinner consult-success-spinner" aria-hidden />
        <p className="consult-success-screen-text">Loading your payment confirmation…</p>
      </section>
    );
  }

  if (error || !details) {
    return (
      <section className="consult-success-screen">
        <div className="consult-success-screen-icon consult-success-screen-icon--warn" aria-hidden>
          <i className="fa-solid fa-circle-check" />
        </div>
        <h1 className="consult-success-screen-title">Payment received</h1>
        <p className="consult-success-screen-text">
          {error ?? "Your payment went through. Our team will email you with your calendar link."}
        </p>
        <Link href="/" className="consult-success-screen-btn">
          Back to Home
        </Link>
      </section>
    );
  }

  const amount = formatMoney(details.amountTotal, details.currency);

  return (
    <section className="consult-success-screen">
      <div className="consult-success-screen-icon" aria-hidden>
        <i className="fa-solid fa-circle-check" />
      </div>
      <h1 className="consult-success-screen-title">Payment successful</h1>
      <p className="consult-success-screen-text">
        You&apos;re booked! Our team will email you within a few hours with your calendar link.
      </p>

      <div className="consult-receipt-card">
        <div className="consult-receipt-header">
          <span className="consult-receipt-label">Payment receipt</span>
          <span className="consult-receipt-status">Paid</span>
        </div>

        <dl className="consult-receipt-details">
          <div className="consult-receipt-row">
            <dt>Service</dt>
            <dd>{details.planLabel}</dd>
          </div>
          {details.customerName && (
            <div className="consult-receipt-row">
              <dt>Name</dt>
              <dd>{details.customerName}</dd>
            </div>
          )}
          {details.customerEmail && (
            <div className="consult-receipt-row">
              <dt>Email</dt>
              <dd>{details.customerEmail}</dd>
            </div>
          )}
          <div className="consult-receipt-row">
            <dt>Date</dt>
            <dd>{formatDate(details.createdAt)}</dd>
          </div>
          <div className="consult-receipt-row">
            <dt>Payment method</dt>
            <dd>Card (Stripe)</dd>
          </div>
          <div className="consult-receipt-row consult-receipt-row--id">
            <dt>Reference</dt>
            <dd title={details.sessionId}>{details.sessionId}</dd>
          </div>
        </dl>

        <div className="consult-receipt-total">
          <span>Total paid</span>
          <strong>{amount}</strong>
        </div>

        {details.receiptUrl && (
          <a
            href={details.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="consult-receipt-stripe-link"
          >
            <i className="fa-brands fa-stripe" aria-hidden />
            View Stripe receipt
          </a>
        )}
      </div>

      <Link href="/" className="consult-success-screen-btn">
        Back to Home
      </Link>
    </section>
  );
}
