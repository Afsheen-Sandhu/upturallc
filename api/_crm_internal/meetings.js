import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const { relatedType, relatedId } = req.query || {};
      const parts = [collection(db, "meetings")];
      if (relatedType && relatedId) {
        parts.push(where("relatedType", "==", String(relatedType)));
        parts.push(where("relatedId", "==", String(relatedId)));
      }

      // Role-based visibility
      if (auth.role !== "super_admin") {
        parts.push(where("createdByEmail", "==", auth.email.toLowerCase()));
      }

      parts.push(orderBy("scheduledAt", "desc"));
      parts.push(limit(200));
      const snap = await getDocs(query(...parts));
      const meetings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, meetings });
    } catch (err) {
      console.error("[crm meetings GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, notes, scheduledAt, relatedType, relatedId, status } = req.body || {};
      const docRef = await addDoc(collection(db, "meetings"), {
        title: title ? String(title).trim() : "",
        notes: notes ? String(notes).trim() : "",
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        relatedType: relatedType ? String(relatedType) : "",
        relatedId: relatedId ? String(relatedId) : "",
        status: status ? String(status) : "scheduled",
        createdAt: serverTimestamp(),
        createdBy: auth.userId,
        createdByEmail: auth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: auth.userId,
        updatedByEmail: auth.email || "",
      });
      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm meetings POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      const body = req.body || {};
      const updates = {};
      if (body.title !== undefined) updates.title = String(body.title || "").trim();
      if (body.notes !== undefined) updates.notes = String(body.notes || "").trim();
      if (body.status !== undefined) updates.status = String(body.status || "").trim();
      if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null;
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;
      updates.updatedByEmail = auth.email || "";
      await updateDoc(doc(db, "meetings", String(id)), updates);
      const snap = await getDoc(doc(db, "meetings", String(id)));
      return json(res, 200, { success: true, meeting: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm meetings PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      await deleteDoc(doc(db, "meetings", String(id)));
      return json(res, 200, { success: true, message: "Deleted" });
    } catch (err) {
      console.error("[crm meetings DELETE] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

