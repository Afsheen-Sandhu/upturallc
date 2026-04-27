"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";
import type { OrderRecord, OrderStatus } from "./types";
import { downloadCsv, tsToDate, ymd } from "./firestore";
import RescheduleModal from "./RescheduleModal";

type OrderCategory = "all" | "ai" | "digital" | "consultation";

function normalizeStatus(s: unknown): OrderStatus {
  const v = String(s || "pending").toLowerCase();
  if (v === "approved" || v === "rejected" || v === "pending") return v;
  if (v === "done") return "approved";
  return "pending";
}

function safeStr(v: unknown) {
  return String(v || "").trim();
}

async function sendEmail(to: string, subject: string, html: string) {
  await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  }).catch(() => {});
}

function approvalEmailHtml(name: string, status: "approved" | "rejected", date?: string, time?: string) {
  const isApproved = status === "approved";
  const color = isApproved ? "#10b981" : "#ef4444";
  const endColor = isApproved ? "#059669" : "#dc2626";
  const heading = isApproved ? "Order Confirmed!" : "Order Update";

  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eaeaea;border-radius:12px;background:#fff;">
      <div style="text-align:center;padding:20px 0 15px;border-bottom:1px solid #f0f0f0;margin-bottom:20px;">
        <img src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695861fb4062b42c0bd5c2cd_Logo%20Main.png" alt="Uptura" height="36" style="display:block;margin:0 auto;">
      </div>
      <div style="background:linear-gradient(135deg,${color},${endColor});padding:14px;border-radius:8px;color:#fff;text-align:center;margin-bottom:24px;">
        <h2 style="margin:0;font-size:18px;font-weight:700;">${heading}</h2>
      </div>
      <div style="color:#444;line-height:1.65;font-size:15px;padding:0 10px;">
        <p>Hi <strong>${name}</strong>,</p>
        ${isApproved
          ? `<p>Great news — your order has been confirmed${date ? ` for <strong>${date}${time ? " at " + time + " EST" : ""}</strong>` : ""}. Our team will be in touch shortly to kick things off.</p>`
          : `<p>Thank you for your interest in Uptura. Unfortunately we were unable to proceed with your current order. Please reply to this email or visit our site if you'd like to discuss alternatives.</p>`
        }
        <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0;">
        <p style="color:#666;font-size:14px;margin:0;">Best regards,<br><strong style="color:#111;">The Uptura Team</strong></p>
      </div>
    </div>`;
}

export default function OrdersView() {
  const [rows, setRows] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<OrderCategory>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [dateFilter, setDateFilter] = useState("");

  const [reschedule, setReschedule] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { db } = getFirebaseClient();
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200));
        const snap = await getDocs(q);
        const next: OrderRecord[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            createdAt: tsToDate(data.createdAt),
            name: safeStr(data.name),
            email: safeStr(data.email),
            phone: safeStr(data.phone) || undefined,
            category: safeStr(data.category) || undefined,
            planLabel: safeStr(data.planLabel) || undefined,
            price: safeStr(data.price) || undefined,
            addons: (data.addons as any) || undefined,
            appointmentDate: safeStr(data.appointmentDate) || undefined,
            appointmentTime: safeStr(data.appointmentTime) || undefined,
            paymentMethod: safeStr(data.paymentMethod) || undefined,
            paymentStatus: safeStr(data.paymentStatus) || undefined,
            stripeSessionId: safeStr(data.stripeSessionId) || undefined,
            paypalOrderId: safeStr(data.paypalOrderId) || undefined,
            amountTotal: typeof data.amountTotal === "number" ? data.amountTotal : undefined,
            status: normalizeStatus(data.status),
            remarks: safeStr(data.remarks) || undefined,
          };
        });
        if (!cancelled) setRows(next);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const cat = String(r.category || "ai").toLowerCase();
      if (category !== "all" && cat !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (dateFilter) {
        if (!r.createdAt || ymd(r.createdAt) !== dateFilter) return false;
      }
      if (!term) return true;
      return `${r.name} ${r.email} ${r.planLabel || ""} ${cat}`.toLowerCase().includes(term);
    });
  }, [rows, search, category, status, dateFilter]);

  const stats = useMemo(() => {
    const s = { total: 0, pending: 0, approved: 0, rejected: 0 };
    for (const r of filtered) {
      s.total++;
      if (r.status === "pending") s.pending++;
      if (r.status === "approved") s.approved++;
      if (r.status === "rejected") s.rejected++;
    }
    return s;
  }, [filtered]);

  async function setOrderStatus(id: string, newStatus: OrderStatus) {
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "orders", id), { status: newStatus });
    const row = rows.find((r) => r.id === id);
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));

    if (row && (newStatus === "approved" || newStatus === "rejected")) {
      const html = approvalEmailHtml(row.name, newStatus, row.appointmentDate, row.appointmentTime);
      await sendEmail(row.email, `Update from Uptura: Order ${newStatus}`, html);
      await sendEmail("info@uptura.net", `[ADMIN] Order ${newStatus.toUpperCase()}: ${row.name}`, html);
    }
  }

  async function updateRemarks(id: string, remarks: string) {
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "orders", id), { remarks });
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, remarks } : p)));
  }

  async function deleteOrder(id: string) {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    const { db } = getFirebaseClient();
    await deleteDoc(doc(db, "orders", id));
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleReschedule(date: string, time: string) {
    if (!reschedule) return;
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "orders", reschedule.id), {
      appointmentDate: date,
      appointmentTime: time,
      status: "pending",
    });
    setRows((prev) =>
      prev.map((p) =>
        p.id === reschedule.id
          ? { ...p, appointmentDate: date, appointmentTime: time, status: "pending" }
          : p
      )
    );

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eaeaea;border-radius:12px;background:#fff;">
        <div style="text-align:center;padding:20px 0 15px;border-bottom:1px solid #f0f0f0;margin-bottom:20px;">
          <img src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695861fb4062b42c0bd5c2cd_Logo%20Main.png" alt="Uptura" height="36" style="display:block;margin:0 auto;">
        </div>
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:14px;border-radius:8px;color:#fff;text-align:center;margin-bottom:24px;">
          <h2 style="margin:0;font-size:18px;font-weight:700;">Time Slot Conflict</h2>
        </div>
        <div style="color:#444;line-height:1.65;font-size:15px;padding:0 10px;">
          <p>Hi <strong>${reschedule.name}</strong>,</p>
          <p>We had a scheduling conflict with your original slot. Here is a new suggested time:</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;color:#b45309;padding:14px;border-radius:8px;text-align:center;font-size:17px;font-weight:700;margin:20px 0;">
            📅 ${date} at ${time} EST
          </div>
          <p>If this works for you, simply reply to this email. Otherwise feel free to suggest another time.</p>
          <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0;">
          <p style="color:#666;font-size:14px;margin:0;">Best regards,<br><strong style="color:#111;">The Uptura Team</strong></p>
        </div>
      </div>`;

    await sendEmail(reschedule.email, "New Suggested Time: Uptura Order", html);
    alert("Rescheduled and emailed client ✓");
    setReschedule(null);
  }

  async function exportCsv() {
    const lines = ["Date,Client Name,Email,Phone,Plan,Price,Payment,Add-ons,Status,Remarks"];
    for (const r of filtered) {
      const iso = r.createdAt ? r.createdAt.toISOString() : "";
      const addons = r.addons ? r.addons.map((a) => a?.title).filter(Boolean).join("|") : "";
      const payment = r.paymentMethod ? `${r.paymentMethod}/${r.paymentStatus}` : "invoice";
      lines.push(
        `"${iso}","${(r.name || "").replace(/"/g, '""')}","${(r.email || "").replace(/"/g, '""')}","${(r.phone || "").replace(/"/g, '""')}","${(r.planLabel || "").replace(/"/g, '""')}","${(r.price || "").replace(/"/g, '""')}","${payment}","${addons.replace(/"/g, '""')}","${r.status}","${(r.remarks || "").replace(/"/g, '""')}"`
      );
    }
    downloadCsv(`uptura_orders_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`, lines.join("\n"));
  }

  return (
    <section className="admin-content">
      <div className="admin-tab-header">
        <h2 className="admin-h2">Orders Overview</h2>
        <button className="admin-btn" onClick={exportCsv} disabled={loading || filtered.length === 0}>
          <i className="fa-solid fa-download" />
          <span>Download CSV</span>
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><div className="admin-stat-label">Total</div><div className="admin-stat-value">{stats.total}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">Pending</div><div className="admin-stat-value warn">{stats.pending}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">Approved</div><div className="admin-stat-value ok">{stats.approved}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">Rejected</div><div className="admin-stat-value bad">{stats.rejected}</div></div>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input className="admin-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" />
        </div>
        <select className="admin-select" value={category} onChange={(e) => setCategory(e.target.value as OrderCategory)}>
          <option value="all">All Categories</option>
          <option value="ai">AI</option>
          <option value="digital">Digital</option>
          <option value="consultation">Consultation</option>
        </select>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input className="admin-date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {error && <div className="admin-inline-error">{error}</div>}

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /><div>Loading orders…</div></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan / Service</th>
                <th>Payment</th>
                <th>Add-ons</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cat = String(r.category || "ai").toLowerCase();
                const addons = r.addons ? r.addons.map((a) => a?.title).filter(Boolean).join(", ") : "None";
                const dateStr = r.createdAt ? r.createdAt.toLocaleDateString() : "N/A";
                const isPaid = r.paymentStatus === "paid";
                const amountDisplay = r.amountTotal ? `$${(r.amountTotal / 100).toFixed(2)}` : r.price || "";
                return (
                  <tr key={r.id} className={`admin-row ${r.status}`}>
                    <td>
                      <div className="admin-strong">{r.name}</div>
                      <div className="admin-muted">{r.email}</div>
                      {r.phone && <div className="admin-muted small">{r.phone}</div>}
                    </td>
                    <td>
                      <div className="admin-strong">{r.planLabel || "Custom Package"}</div>
                      <div className="admin-pill-row">
                        <span className={`admin-pill ${cat === "digital" ? "digital" : cat === "consultation" ? "consult" : "ai"}`}>{cat}</span>
                        {amountDisplay && <span className="admin-price">{amountDisplay}</span>}
                      </div>
                    </td>
                    <td>
                      {r.paymentMethod ? (
                        <div>
                          <span className={`admin-badge ${isPaid ? "approved" : "pending"}`}>
                            {isPaid ? "paid" : "unpaid"}
                          </span>
                          <div className="admin-muted small" style={{ marginTop: 4 }}>
                            <i className={`fa-brands fa-${r.paymentMethod === "paypal" ? "paypal" : "stripe"}`} />
                            {" "}{r.paymentMethod}
                          </div>
                        </div>
                      ) : (
                        <span className="admin-muted">invoice</span>
                      )}
                    </td>
                    <td className="admin-muted">{addons}</td>
                    <td><span className={`admin-badge ${r.status}`}>{r.status}</span></td>
                    <td>
                      <input
                        className="admin-remarks"
                        defaultValue={r.remarks || ""}
                        placeholder="Add remarks…"
                        onBlur={(e) => updateRemarks(r.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      />
                    </td>
                    <td className="admin-muted">{dateStr}</td>
                    <td>
                      <div className="admin-actions">
                        {r.status !== "approved" ? (
                          <button className="admin-icon-btn ok" title="Approve" onClick={() => setOrderStatus(r.id, "approved")}>
                            <i className="fa-solid fa-check" />
                          </button>
                        ) : (
                          <button className="admin-icon-btn" title="Reset to Pending" onClick={() => setOrderStatus(r.id, "pending")}>
                            <i className="fa-solid fa-rotate-left" />
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button className="admin-icon-btn bad" title="Reject" onClick={() => setOrderStatus(r.id, "rejected")}>
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                        <button
                          className="admin-icon-btn reschedule"
                          title="Reschedule"
                          onClick={() => setReschedule({ id: r.id, name: r.name, email: r.email })}
                        >
                          <i className="fa-solid fa-calendar-day" />
                        </button>
                        <button className="admin-icon-btn dark" title="Delete" onClick={() => deleteOrder(r.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="admin-empty">No matching orders.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {reschedule && (
        <RescheduleModal
          name={reschedule.name}
          email={reschedule.email}
          onClose={() => setReschedule(null)}
          onConfirm={handleReschedule}
        />
      )}
    </section>
  );
}
