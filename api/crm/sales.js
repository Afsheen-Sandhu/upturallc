import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

const DEAL_STAGES = ["lead", "proposal_sent", "negotiation", "won", "lost"];

function normalizeStage(stage) {
  const s = String(stage || "").toLowerCase().trim();
  return DEAL_STAGES.includes(s) ? s : "lead";
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const snap = await getDocs(query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(200)));
      const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, sales });
    } catch (err) {
      console.error("[crm sales GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { clientId, agentEmail, amount, stage, notes } = req.body || {};
      const docRef = await addDoc(collection(db, "sales"), {
        clientId: clientId ? String(clientId).trim() : "",
        agentEmail: agentEmail ? String(agentEmail).trim().toLowerCase() : auth.email,
        amount: amount != null && amount !== "" ? Number(amount) : null,
        stage: normalizeStage(stage),
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
      console.error("[crm sales POST] error", err);
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
      if (body.agentEmail !== undefined) updates.agentEmail = String(body.agentEmail || "").trim().toLowerCase();
      if (body.amount !== undefined) updates.amount = body.amount !== "" ? Number(body.amount) : null;
      if (body.stage !== undefined) updates.stage = normalizeStage(body.stage);
      if (body.notes !== undefined) updates.notes = String(body.notes || "").trim();
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;
      updates.updatedByEmail = auth.email || "";
      await updateDoc(doc(db, "sales", String(id)), updates);
      const snap = await getDoc(doc(db, "sales", String(id)));
      return json(res, 200, { success: true, sale: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm sales PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

