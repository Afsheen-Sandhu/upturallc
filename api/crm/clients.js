import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

const PIPELINE_STATUSES = [
  "lead",
  "contacted",
  "discovery",
  "proposal_sent",
  "negotiation",
  "approved",
  "onboarding",
  "active",
  "invoice_sent",
  "payment_received",
  "completed",
  "lost",
];

function normalizeStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return PIPELINE_STATUSES.includes(s) ? s : null;
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  // GET /api/crm/clients?status=lead&limit=50
  if (req.method === "GET") {
    try {
      const { id, status, take } = req.query || {};
      if (id) {
        const snap = await getDoc(doc(db, "clients", String(id)));
        if (!snap.exists()) return json(res, 404, { success: false, message: "Not found" });
        return json(res, 200, { success: true, client: { id: snap.id, ...snap.data() } });
      }

      const qParts = [collection(db, "clients")];
      const s = status ? normalizeStatus(status) : null;
      if (s) qParts.push(where("pipelineStatus", "==", s));
      qParts.push(orderBy("createdAt", "desc"));
      qParts.push(limit(Math.min(Number(take || 50) || 50, 200)));

      const snap = await getDocs(query(...qParts));
      const clients = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, clients });
    } catch (err) {
      console.error("[crm clients GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  // POST /api/crm/clients
  if (req.method === "POST") {
    try {
      const { name, email, phone, company, pipelineStatus } = req.body || {};
      const status = normalizeStatus(pipelineStatus) || "lead";

      const docRef = await addDoc(collection(db, "clients"), {
        name: name ? String(name).trim() : "",
        email: email ? String(email).trim().toLowerCase() : "",
        phone: phone ? String(phone).trim() : "",
        company: company ? String(company).trim() : "",
        pipelineStatus: status,
        createdAt: serverTimestamp(),
        createdBy: auth.userId,
        createdByEmail: auth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: auth.userId,
        updatedByEmail: auth.email || "",
      });

      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm clients POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  // PATCH /api/crm/clients?id=...
  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });

      const updates = {};
      const body = req.body || {};
      if (body.name !== undefined) updates.name = String(body.name || "").trim();
      if (body.email !== undefined) updates.email = String(body.email || "").trim().toLowerCase();
      if (body.phone !== undefined) updates.phone = String(body.phone || "").trim();
      if (body.company !== undefined) updates.company = String(body.company || "").trim();
      if (body.pipelineStatus !== undefined) {
        const s = normalizeStatus(body.pipelineStatus);
        if (!s) return json(res, 400, { success: false, message: "Invalid pipelineStatus" });
        updates.pipelineStatus = s;
      }
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;
      updates.updatedByEmail = auth.email || "";

      await updateDoc(doc(db, "clients", String(id)), updates);
      return json(res, 200, { success: true });
    } catch (err) {
      console.error("[crm clients PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

