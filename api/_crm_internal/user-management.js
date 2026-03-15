import bcrypt from "bcryptjs";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore/lite";
import { getDb } from "./_firebase.js";
import { requireCrmAuth, requireRole } from "./_auth.js";
import { sendEmail } from "./_email.js";

function json(res, status, body) {
  res.status(status).json(body);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isStrongEnough(password) {
  return typeof password === "string" && password.length >= 8;
}

export default async function handler(req, res) {
  const auth = requireRole(requireCrmAuth(req), ["super_admin"]);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
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

  if (req.method === "POST") {
    const { email, password, role, name, employeeId } = req.body || {};
    const e = normalizeEmail(email);
    const p = String(password || "");
    const r = String(role || "").trim();

    if (!e) return json(res, 400, { success: false, message: "Email is required" });
    if (!isStrongEnough(p)) return json(res, 400, { success: false, message: "Password must be at least 8 characters" });
    if (!r) return json(res, 400, { success: false, message: "Role is required" });

    const allowedRoles = ["super_admin", "admin", "manager", "employee", "hr"];
    if (!allowedRoles.includes(r)) return json(res, 400, { success: false, message: "Invalid role" });

    try {
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

      if (e) {
        const userName = name ? String(name).trim() : "Team Member";
        const html = `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2>Welcome to Uptura CRM, ${userName}!</h2>
            <p>Your account has been successfully created. Here are your login credentials:</p>
            <ul>
              <li><strong>Email:</strong> ${e}</li>
              <li><strong>Password:</strong> ${p}</li>
              <li><strong>Role:</strong> ${r}</li>
            </ul>
            <br />
            <p>You can now log in at <a href="https://uptura.net/crm.html">uptura.net/crm.html</a>.</p>
            <p>For your security, we recommend keeping this email safe or logging in immediately to verify your access.</p>
            <br />
            <p>Best regards,</p>
            <p><strong>The Uptura Team</strong></p>
          </div>
        `;
        // Fire and forget
        sendEmail({ to: e, subject: "Your Uptura CRM Credentials", html }).catch(err => console.error(err));
      }

      return json(res, 201, { success: true, userId: docRef.id });
    } catch (err) {
      console.error("[crm user-management POST] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      const body = req.body || {};
      const updates = {};

      if (body.email !== undefined) updates.email = normalizeEmail(body.email);
      if (body.role !== undefined) updates.role = String(body.role).trim();
      if (body.name !== undefined) updates.name = String(body.name || "").trim();
      if (body.employeeId !== undefined) updates.employeeId = String(body.employeeId || "").trim();
      if (body.disabled !== undefined) updates.disabled = !!body.disabled;

      if (body.password && isStrongEnough(body.password)) {
        updates.passwordHash = await bcrypt.hash(String(body.password), 10);
      }

      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;

      await updateDoc(doc(db, "users", String(id)), updates);
      const snap = await getDoc(doc(db, "users", String(id)));
      return json(res, 200, { success: true, user: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm user-management PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      await deleteDoc(doc(db, "users", String(id)));
      return json(res, 200, { success: true, message: "Deleted" });
    } catch (err) {
      console.error("[crm user-management DELETE] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

