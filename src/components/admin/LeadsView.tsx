"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";
import type { LeadRecord, LeadStatus } from "./types";
import { downloadCsv, tsToDate, ymd } from "./firestore";
import RescheduleModal from "./RescheduleModal";

function normalizeStatus(s: unknown): LeadStatus {
  const v = String(s || "pending").toLowerCase();
  if (v === "approved" || v === "rejected" || v === "pending") return v;
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

function statusEmailHtml(
  name: string,
  status: "approved" | "rejected",
  mode: "leads" | "appointments",
  date?: string,
  time?: string
) {
  const isApproved = status === "approved";
  const color = isApproved ? "#10b981" : "#ef4444";
  const endColor = isApproved ? "#059669" : "#dc2626";
  const heading =
    mode === "appointments"
      ? isApproved
        ? "Appointment Confirmed!"
        : "Slot Unavailable"
      : isApproved
      ? "Great News!"
      : "Update on Your Enquiry";

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
        ${
          mode === "appointments"
            ? isApproved
              ? `<p>Great news! Your strategy call has been confirmed${date ? ` for <strong>${date}${time ? " at " + time + " EST" : ""}</strong>` : ""}. We look forward to speaking with you!</p>`
              : `<p>Unfortunately the time slot you requested is no longer available. Please reply to this email or visit our website to request a new time.</p>
                 <div style="text-align:center;margin:24px 0;"><a href="https://uptura.net" style="display:inline-block;padding:11px 22px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Book New Time</a></div>`
            : isApproved
            ? `<p>We've reviewed your enquiry and we're ready to move forward. Our team will be in touch shortly!</p>`
            : `<p>Thank you for reaching out. Unfortunately we're unable to proceed with your enquiry at this time. Please feel free to contact us again if your needs change.</p>`
        }
        <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0;">
        <p style="color:#666;font-size:14px;margin:0;">Best regards,<br><strong style="color:#111;">The Uptura Team</strong></p>
      </div>
    </div>`;
}

export default function LeadsView({ mode }: { mode: "leads" | "appointments" }) {
  const [rows, setRows] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [dateFilter, setDateFilter] = useState("");

  const [reschedule, setReschedule] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { db } = getFirebaseClient();
        const q = query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(mode === "appointments" ? 500 : 200));
        const snap = await getDocs(q);
        const next: LeadRecord[] = snap.docs
          .map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: d.id,
              createdAt: tsToDate(data.createdAt),
              name: safeStr(data.name),
              email: safeStr(data.email),
              phone: safeStr(data.phone) || undefined,
              company: safeStr(data.company) || undefined,
              message: safeStr(data.message) || undefined,
              appointmentDate: safeStr(data.appointmentDate) || undefined,
              appointmentTime: safeStr(data.appointmentTime) || undefined,
              status: normalizeStatus(data.status),
              remarks: safeStr(data.remarks) || undefined,
            };
          })
          .filter((r) => {
            const isAppointment = Boolean(r.appointmentDate);
            return mode === "appointments" ? isAppointment : !isAppointment;
          });
        if (!cancelled) setRows(next);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load leads.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [mode]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (dateFilter) {
        if (!r.createdAt || ymd(r.createdAt) !== dateFilter) return false;
      }
      if (!term) return true;
      return `${r.name} ${r.email} ${r.company || ""} ${r.message || ""} ${r.appointmentDate || ""}`.toLowerCase().includes(term);
    });
  }, [rows, search, status, dateFilter]);

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

  async function setLeadStatus(id: string, newStatus: LeadStatus) {
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "leads", id), { status: newStatus });
    const row = rows.find((r) => r.id === id);
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));

    if (row && (newStatus === "approved" || newStatus === "rejected")) {
      const html = statusEmailHtml(row.name, newStatus, mode, row.appointmentDate, row.appointmentTime);
      const subject =
        mode === "appointments"
          ? `Uptura: Appointment ${newStatus}`
          : `Update from Uptura: Enquiry ${newStatus}`;
      await sendEmail(row.email, subject, html);
      await sendEmail("info@uptura.net", `[ADMIN] ${mode} ${newStatus.toUpperCase()}: ${row.name}`, html);
    }
  }

  async function updateRemarks(id: string, remarks: string) {
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "leads", id), { remarks });
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, remarks } : p)));
  }

  async function deleteLead(id: string) {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    const { db } = getFirebaseClient();
    await deleteDoc(doc(db, "leads", id));
    setRows((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleReschedule(date: string, time: string) {
    if (!reschedule) return;
    const { db } = getFirebaseClient();
    await updateDoc(doc(db, "leads", reschedule.id), {
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
          <h2 style="margin:0;font-size:18px;font-weight:700;">New Suggested Time</h2>
        </div>
        <div style="color:#444;line-height:1.65;font-size:15px;padding:0 10px;">
          <p>Hi <strong>${reschedule.name}</strong>,</p>
          <p>We had a conflict with the original slot. Here's a new suggested time:</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;color:#b45309;padding:14px;border-radius:8px;text-align:center;font-size:17px;font-weight:700;margin:20px 0;">
            📅 ${date} at ${time} EST
          </div>
          <p>Simply reply to confirm, or suggest another time that works better for you.</p>
          <hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0;">
          <p style="color:#666;font-size:14px;margin:0;">Best regards,<br><strong style="color:#111;">The Uptura Team</strong></p>
        </div>
      </div>`;

    await sendEmail(reschedule.email, "New Suggested Time: Uptura Appointment", html);
    alert("Rescheduled and emailed client ✓");
    setReschedule(null);
  }

  async function exportCsv() {
    const lines: string[] = [];
    if (mode === "appointments") {
      lines.push("Date,Name,Email,Phone,Company,Appointment Date,Appointment Time,Status,Remarks");
    } else {
      lines.push("Date,Name,Email,Phone,Company,Message,Status,Remarks");
    }
    for (const r of filtered) {
      const iso = r.createdAt ? r.createdAt.toISOString() : "";
      const remarks = (r.remarks || "").replace(/"/g, '""');
      if (mode === "appointments") {
        lines.push(`"${iso}","${(r.name||"").replace(/"/g,'""')}","${(r.email||"").replace(/"/g,'""')}","${(r.phone||"").replace(/"/g,'""')}","${(r.company||"").replace(/"/g,'""')}","${(r.appointmentDate||"").replace(/"/g,'""')}","${(r.appointmentTime||"").replace(/"/g,'""')}","${r.status}","${remarks}"`);
      } else {
        lines.push(`"${iso}","${(r.name||"").replace(/"/g,'""')}","${(r.email||"").replace(/"/g,'""')}","${(r.phone||"").replace(/"/g,'""')}","${(r.company||"").replace(/"/g,'""')}","${(r.message||"").replace(/"/g,'""')}","${r.status}","${remarks}"`);
      }
    }
    const base = mode === "appointments" ? "uptura_appointments" : "uptura_leads";
    downloadCsv(`${base}_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`, lines.join("\n"));
  }

  const heading = mode === "appointments" ? "Appointments" : "Leads";

  return (
    <section className="admin-content">
      <div className="admin-tab-header">
        <h2 className="admin-h2">{heading} Management</h2>
        <button className="admin-btn" onClick={exportCsv} disabled={loading || filtered.length === 0}>
          <i className="fa-solid fa-download" />
          <span>Download {heading}</span>
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
          <input className="admin-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${heading.toLowerCase()}…`} />
        </div>
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
          <div className="admin-loading"><div className="admin-spinner" /><div>Loading {heading.toLowerCase()}…</div></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Company</th>
                {mode === "appointments" ? <th>Appointment</th> : <th>Message</th>}
                <th>Status</th>
                <th>Remarks</th>
                <th>Date</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const dateStr = r.createdAt ? r.createdAt.toLocaleDateString() : "N/A";
                return (
                  <tr key={r.id} className={`admin-row ${r.status}`}>
                    <td className="admin-strong">{r.name}</td>
                    <td>
                      <div>{r.email}</div>
                      {r.phone && <div className="admin-muted small">{r.phone}</div>}
                    </td>
                    <td>{r.company || "—"}</td>
                    {mode === "appointments" ? (
                      <td>
                        <div className="admin-strong small">{r.appointmentDate || "—"}</div>
                        <div className="admin-muted small">{r.appointmentTime || ""}</div>
                      </td>
                    ) : (
                      <td className="admin-muted" style={{ maxWidth: 220 }}>{r.message || "—"}</td>
                    )}
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
                          <button className="admin-icon-btn ok" title="Approve" onClick={() => setLeadStatus(r.id, "approved")}>
                            <i className="fa-solid fa-check" />
                          </button>
                        ) : (
                          <button className="admin-icon-btn" title="Reset to Pending" onClick={() => setLeadStatus(r.id, "pending")}>
                            <i className="fa-solid fa-rotate-left" />
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button className="admin-icon-btn bad" title="Reject" onClick={() => setLeadStatus(r.id, "rejected")}>
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
                        <button className="admin-icon-btn dark" title="Delete" onClick={() => deleteLead(r.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="admin-empty">No matching {heading.toLowerCase()}.</td></tr>
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
