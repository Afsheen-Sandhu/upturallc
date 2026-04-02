"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";
import type { OrderRecord, OrderStatus } from "./types";
import { downloadCsv, tsToDate, ymd } from "./firestore";

type OrderCategory = "all" | "ai" | "digital";

function normalizeStatus(s: unknown): OrderStatus {
  const v = String(s || "pending").toLowerCase();
  if (v === "approved" || v === "rejected" || v === "pending") return v;
  if (v === "done") return "approved";
  return "pending";
}

function safeStr(v: unknown) {
  return String(v || "").trim();
}

export default function OrdersView() {
  const [rows, setRows] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<OrderCategory>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [dateFilter, setDateFilter] = useState("");

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
          const createdAt = tsToDate(data.createdAt);
          return {
            id: d.id,
            createdAt,
            name: safeStr(data.name),
            email: safeStr(data.email),
            phone: safeStr(data.phone) || undefined,
            category: safeStr(data.category) || undefined,
            planLabel: safeStr(data.planLabel) || undefined,
            price: safeStr(data.price) || undefined,
            addons: (data.addons as any) || undefined,
            appointmentDate: safeStr(data.appointmentDate) || undefined,
            appointmentTime: safeStr(data.appointmentTime) || undefined,
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
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const cat = String(r.category || "ai").toLowerCase();
      if (category !== "all" && cat !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (dateFilter) {
        if (!r.createdAt) return false;
        if (ymd(r.createdAt) !== dateFilter) return false;
      }
      if (!term) return true;
      const s = `${r.name} ${r.email} ${r.planLabel || ""} ${cat}`.toLowerCase();
      return s.includes(term);
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
    setRows((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
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

  async function exportCsv() {
    const lines: string[] = [];
    lines.push("Date,Client Name,Email,Phone,Plan,Price,Add-ons,Status,Remarks");
    for (const r of filtered) {
      const iso = r.createdAt ? r.createdAt.toISOString() : "";
      const addons = r.addons ? r.addons.map((a) => a?.title).filter(Boolean).join("|") : "";
      const remarks = (r.remarks || "").replace(/"/g, '""');
      lines.push(
        `"${iso}","${(r.name || "").replace(/"/g, '""')}","${(r.email || "").replace(/"/g, '""')}","${(r.phone || "").replace(/"/g, '""')}","${(r.planLabel || "").replace(/"/g, '""')}","${(r.price || "").replace(/"/g, '""')}","${addons.replace(/"/g, '""')}","${r.status}","${remarks}"`
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
          <span>Download Orders</span>
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-label">Total</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Pending</div>
          <div className="admin-stat-value warn">{stats.pending}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Approved</div>
          <div className="admin-stat-value ok">{stats.approved}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Rejected</div>
          <div className="admin-stat-value bad">{stats.rejected}</div>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
          />
        </div>
        <select className="admin-select" value={category} onChange={(e) => setCategory(e.target.value as OrderCategory)}>
          <option value="all">All Categories</option>
          <option value="ai">AI</option>
          <option value="digital">Digital</option>
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
          <div className="admin-loading">
            <div className="admin-spinner" />
            <div>Loading orders…</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan / Service</th>
                <th>Add-ons</th>
                <th>Appointment</th>
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
                return (
                  <tr key={r.id} className={`admin-row ${r.status}`}>
                    <td>
                      <div className="admin-strong">{r.name}</div>
                      <div className="admin-muted">{r.email}</div>
                    </td>
                    <td>
                      <div className="admin-strong">{r.planLabel || "Custom Package"}</div>
                      <div className="admin-pill-row">
                        <span className={`admin-pill ${cat === "digital" ? "digital" : "ai"}`}>{cat}</span>
                        <span className="admin-price">{r.price || ""}</span>
                      </div>
                    </td>
                    <td className="admin-muted">{addons}</td>
                    <td>
                      <div className="admin-strong small">{r.appointmentDate || "N/A"}</div>
                      <div className="admin-muted small">{r.appointmentTime || ""}</div>
                    </td>
                    <td>
                      <span className={`admin-badge ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      <input
                        className="admin-remarks"
                        defaultValue={r.remarks || ""}
                        placeholder="Add remarks…"
                        onBlur={(e) => updateRemarks(r.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
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

                        {r.status !== "rejected" ? (
                          <button className="admin-icon-btn bad" title="Reject" onClick={() => setOrderStatus(r.id, "rejected")}>
                            <i className="fa-solid fa-xmark" />
                          </button>
                        ) : null}

                        <button className="admin-icon-btn dark" title="Delete" onClick={() => deleteOrder(r.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    No matching orders.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

