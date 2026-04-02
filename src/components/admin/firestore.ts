"use client";

import type { Timestamp } from "firebase/firestore";

export function tsToDate(ts: unknown): Date | null {
  const t = ts as Timestamp | undefined;
  if (!t) return null;
  // Firestore Timestamp has toDate(), but avoid runtime crashes for unexpected shapes.
  try {
    if (typeof (t as any).toDate === "function") return (t as any).toDate();
  } catch {}
  return null;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

