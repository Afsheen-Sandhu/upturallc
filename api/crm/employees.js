import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth, requireRole } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const snap = await getDocs(query(collection(db, "employees"), orderBy("createdAt", "desc"), limit(200)));
      const employees = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, employees });
    } catch (err) {
      console.error("[crm employees GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  // Only super_admin/admin/hr can create / update employees
  const writeAuth = requireRole(auth, ["super_admin", "admin", "hr"]);
  if (!writeAuth.ok) return json(res, writeAuth.status || 403, { success: false, message: writeAuth.message });

  if (req.method === "POST") {
    try {
      const { name, email, phone, role, dailyHours, onboardingStatus } = req.body || {};
      const docRef = await addDoc(collection(db, "employees"), {
        name: name ? String(name).trim() : "",
        email: email ? String(email).trim().toLowerCase() : "",
        phone: phone ? String(phone).trim() : "",
        role: role ? String(role).trim() : "",
        dailyHours: dailyHours ? Number(dailyHours) : null,
        onboardingStatus: onboardingStatus || "pending",
        startedWorking: onboardingStatus === "completed" ? true : false,
        createdAt: serverTimestamp(),
        createdBy: writeAuth.userId,
        createdByEmail: writeAuth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: writeAuth.userId,
        updatedByEmail: writeAuth.email || "",
      });
      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm employees POST] error", err);
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
      if (body.phone !== undefined) updates.phone = String(body.phone || "").trim();
      if (body.role !== undefined) updates.role = String(body.role || "").trim();
      if (body.dailyHours !== undefined) updates.dailyHours = Number(body.dailyHours);
      if (body.onboardingStatus !== undefined) updates.onboardingStatus = String(body.onboardingStatus || "").trim();
      if (body.startedWorking !== undefined) updates.startedWorking = Boolean(body.startedWorking);

      // If "Started Working" clicked, mark onboarding completed + startedWorking true
      if (body.markStartedWorking) {
        updates.onboardingStatus = "completed";
        updates.startedWorking = true;
        updates.startedWorkingAt = serverTimestamp();
      }

      updates.updatedAt = serverTimestamp();
      updates.updatedBy = writeAuth.userId;
      updates.updatedByEmail = writeAuth.email || "";

      await updateDoc(doc(db, "employees", String(id)), updates);
      const snap = await getDoc(doc(db, "employees", String(id)));
      return json(res, 200, { success: true, employee: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm employees PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

