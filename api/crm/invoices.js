import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

const INVOICE_STATUSES = ["draft", "sent", "paid", "void"];

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase().trim();
  return INVOICE_STATUSES.includes(s) ? s : "draft";
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const snap = await getDocs(query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(200)));
      const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, invoices });
    } catch (err) {
      console.error("[crm invoices GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { clientId, amount, status, dueDate, notes } = req.body || {};
      const docRef = await addDoc(collection(db, "invoices"), {
        clientId: clientId ? String(clientId).trim() : "",
        amount: amount != null && amount !== "" ? Number(amount) : null,
        status: normalizeStatus(status),
        dueDate: dueDate ? String(dueDate).trim() : "",
        notes: notes ? String(notes).trim() : "",
        createdAt: serverTimestamp(),
        createdBy: auth.userId,
        createdByEmail: auth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: auth.userId,
        updatedByEmail: auth.email || "",
      });
      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm invoices POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      const body = req.body || {};
      const updates = {};
      if (body.clientId !== undefined) updates.clientId = String(body.clientId || "").trim();
      if (body.amount !== undefined) updates.amount = body.amount !== "" ? Number(body.amount) : null;
      if (body.status !== undefined) updates.status = normalizeStatus(body.status);
      if (body.dueDate !== undefined) updates.dueDate = String(body.dueDate || "").trim();
      if (body.notes !== undefined) updates.notes = String(body.notes || "").trim();
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;
      updates.updatedByEmail = auth.email || "";
      await updateDoc(doc(db, "invoices", String(id)), updates);
      const snap = await getDoc(doc(db, "invoices", String(id)));
      return json(res, 200, { success: true, invoice: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm invoices PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      await deleteDoc(doc(db, "invoices", String(id)));
      return json(res, 200, { success: true, message: "Deleted" });
    } catch (err) {
      console.error("[crm invoices DELETE] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

