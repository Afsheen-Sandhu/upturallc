import bcrypt from "bcryptjs";
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth, requireRole } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isStrongEnough(password) {
  // Keep this minimal for MVP; can be tightened later.
  return typeof password === "string" && password.length >= 8;
}

export default async function handler(req, res) {
  const auth = requireRole(requireCrmAuth(req), ["super_admin", "admin"]);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  if (req.method === "GET") {
    try {
      const db = getDb();
      const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200)));
      const users = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          email: data.email || "",
          role: data.role || "",
          name: data.name || "",
          employeeId: data.employeeId || "",
          disabled: !!data.disabled,
        };
      });
      return json(res, 200, { success: true, users });
    } catch (err) {
      console.error("[crm user-management GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method !== "POST") return json(res, 405, { success: false, message: "Method Not Allowed" });

  const { email, password, role, name, employeeId } = req.body || {};
  const e = normalizeEmail(email);
  const p = String(password || "");
  const r = String(role || "").trim();

  if (!e) return json(res, 400, { success: false, message: "Email is required" });
  if (!isStrongEnough(p)) return json(res, 400, { success: false, message: "Password must be at least 8 characters" });
  if (!r) return json(res, 400, { success: false, message: "Role is required" });

  // Only allow these roles for now (expand later if needed)
  const allowedRoles = ["super_admin", "admin", "manager", "employee", "hr"];
  if (!allowedRoles.includes(r)) {
    return json(res, 400, { success: false, message: "Invalid role" });
  }

  try {
    const db = getDb();
    const passwordHash = await bcrypt.hash(p, 10);

    const docRef = await addDoc(collection(db, "users"), {
      email: e,
      passwordHash,
      role: r,
      name: name ? String(name).trim() : "",
      employeeId: employeeId ? String(employeeId).trim() : "",
      disabled: false,
      createdAt: serverTimestamp(),
      createdBy: auth.userId,
      createdByEmail: auth.email || "",
    });

    return json(res, 201, { success: true, userId: docRef.id });
  } catch (err) {
    console.error("[crm user-management] error", err);
    return json(res, 500, { success: false, message: "Internal Server Error" });
  }
}

