import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
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
      const all = req.query?.all === "1" || req.query?.all === "true";
      if (all) {
        const adminAuth = requireRole(auth, ["super_admin"]);
        if (!adminAuth.ok) return json(res, 403, { success: false, message: "Forbidden" });
        const q = query(
          collection(db, "attendance"),
          orderBy("startTime", "desc"),
          limit(500)
        );
        const snap = await getDocs(q);
        const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return json(res, 200, { success: true, sessions });
      }
      const q = query(
        collection(db, "attendance"),
        where("userId", "==", auth.userId),
        limit(100)
      );
      const snap = await getDocs(q);
      const sessions = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
          const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
          return tb - ta;
        });
      return json(res, 200, { success: true, sessions });
    } catch (err) {
      console.error("[crm attendance GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      const ref = doc(db, "attendance", String(id));
      const snap = await getDoc(ref);
      if (!snap.exists()) return json(res, 404, { success: false, message: "Not found" });
      const data = snap.data();
      const isAdmin = auth.role === "super_admin";
      const isOwn = data.userId === auth.userId;
      if (!isAdmin && !isOwn) return json(res, 403, { success: false, message: "Forbidden" });
      const { remark } = req.body || {};
      await updateDoc(ref, {
        remark: typeof remark === "string" ? remark.trim() : (data.remark || ""),
        updatedAt: serverTimestamp(),
      });
      const updated = await getDoc(ref);
      return json(res, 200, { success: true, session: updated.exists() ? { id: updated.id, ...updated.data() } : null });
    } catch (err) {
      console.error("[crm attendance PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { startTime, endTime, totalSeconds } = req.body || {};
      const start = startTime ? new Date(startTime).getTime() : 0;
      const end = endTime ? new Date(endTime).getTime() : 0;
      const seconds = typeof totalSeconds === "number" ? totalSeconds : 0;
      if (!start || !end || seconds < 0) {
        return json(res, 400, { success: false, message: "startTime, endTime, and totalSeconds required" });
      }
      const docRef = await addDoc(collection(db, "attendance"), {
        userId: auth.userId,
        userEmail: auth.email || "",
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        totalSeconds: Math.round(seconds),
        createdAt: serverTimestamp(),
      });
      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm attendance POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}
