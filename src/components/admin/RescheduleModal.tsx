"use client";

import { useState } from "react";

type Props = {
  name: string;
  email: string;
  onClose: () => void;
  onConfirm: (date: string, time: string) => Promise<void>;
};

export default function RescheduleModal({ name, email, onClose, onConfirm }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!date || !time) { alert("Please select a date and time."); return; }
    setLoading(true);
    try {
      await onConfirm(date, time);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">Suggest New Time</h3>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <p className="admin-modal-sub">
          Suggesting a new time for <strong>{name}</strong> ({email})
        </p>
        <div className="admin-modal-fields">
          <label className="admin-label">New Date</label>
          <input
            type="date"
            className="admin-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="admin-label" style={{ marginTop: 12 }}>New Time (EST)</label>
          <input
            type="time"
            className="admin-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="admin-modal-actions">
          <button className="admin-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="admin-btn"
            onClick={handleConfirm}
            disabled={loading || !date || !time}
          >
            {loading ? "Sending…" : "Confirm & Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
