import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth, requireRole } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

const STAGES = ["applied", "interview", "hired"];

function normalizeStage(stage) {
  const s = String(stage || "").toLowerCase().trim();
  return STAGES.includes(s) ? s : null;
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const snap = await getDocs(query(collection(db, "jobApplicants"), orderBy("createdAt", "desc"), limit(200)));
      const applicants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, applicants });
    } catch (err) {
      console.error("[crm applicants GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  // Only super_admin/admin/hr can create / update applicants
  const writeAuth = requireRole(auth, ["super_admin", "admin", "hr"]);
  if (!writeAuth.ok) return json(res, writeAuth.status || 403, { success: false, message: writeAuth.message });

  if (req.method === "POST") {
    try {
      const { name, email, role, stage, source } = req.body || {};
      const s = normalizeStage(stage) || "applied";
      const docRef = await addDoc(collection(db, "jobApplicants"), {
        name: name ? String(name).trim() : "",
        email: email ? String(email).trim().toLowerCase() : "",
        role: role ? String(role).trim() : "",
        stage: s,
        source: source ? String(source).trim() : "",
        createdAt: serverTimestamp(),
        createdBy: writeAuth.userId,
        createdByEmail: writeAuth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: writeAuth.userId,
        updatedByEmail: writeAuth.email || "",
      });
      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm applicants POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });

      const body = req.body || {};
      const updates = {};
      if (body.name !== undefined) updates.name = String(body.name || "").trim();
      if (body.email !== undefined) updates.email = String(body.email || "").trim().toLowerCase();
      if (body.role !== undefined) updates.role = String(body.role || "").trim();
      if (body.source !== undefined) updates.source = String(body.source || "").trim();
      if (body.stage !== undefined) {
        const s = normalizeStage(body.stage);
        if (!s) return json(res, 400, { success: false, message: "Invalid stage" });
        updates.stage = s;
      }
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = writeAuth.userId;
      updates.updatedByEmail = writeAuth.email || "";

      await updateDoc(doc(db, "jobApplicants", String(id)), updates);
      const snap = await getDoc(doc(db, "jobApplicants", String(id)));
      return json(res, 200, { success: true, applicant: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm applicants PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

