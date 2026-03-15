import bcrypt from "bcryptjs";
import { collection, getDocs, limit, query, serverTimestamp, setDoc, where, doc } from "firebase/firestore/lite";
import { getDb } from "./_crm_internal/_firebase.js";
import { signCrmToken } from "./_crm_internal/_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { success: false, message: "Method Not Allowed" });

  const { action } = req.query || {};
  const { email, password } = req.body || {};

  if (action && action !== "login") {
    return json(res, 400, { success: false, message: "Invalid action" });
  }

  const e = normalizeEmail(email);
  const p = String(password || "");
  if (!e || !p) return json(res, 400, { success: false, message: "Email and password required" });

  // Bootstrap: allow env-based admin credentials to log in as super_admin.
  const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL || "admin@uptura.net");
  const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "qamaruptura12!");
  if (e === ADMIN_EMAIL && p === ADMIN_PASSWORD) {
    const token = signCrmToken({ userId: "env_admin", email: e, role: "super_admin" });
    return json(res, 200, { success: true, token, role: "super_admin", userId: "env_admin", name: "Admin" });
  }

  try {
    const db = getDb();

    const q = query(collection(db, "users"), where("email", "==", e), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return json(res, 401, { success: false, message: "Invalid credentials" });

    const userDoc = snap.docs[0];
    const user = userDoc.data() || {};
    if (user.disabled) return json(res, 403, { success: false, message: "Account disabled" });

    const ok = await bcrypt.compare(p, String(user.passwordHash || ""));
    if (!ok) return json(res, 401, { success: false, message: "Invalid credentials" });

    const role = String(user.role || "employee");
    const name = String(user.name || "").trim() || null;
    const token = signCrmToken({ userId: userDoc.id, email: e, role });

    // Lightweight last-login tracking (best-effort)
    try {
      await setDoc(
        doc(db, "users", userDoc.id),
        { lastLoginAt: serverTimestamp() },
        { merge: true }
      );
    } catch (_) { }

    return json(res, 200, { success: true, token, role, userId: userDoc.id, name: name || undefined });
  } catch (err) {
    console.error("[crm-auth] error", err);
    return json(res, 500, { success: false, message: "Internal Server Error" });
  }
}

