import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  if (req.method !== "GET") return json(res, 405, { success: false, message: "Method Not Allowed" });

  try {
    const db = getDb();
    const q = query(
      collection(db, "users"),
      where("role", "==", "super_admin"),
      limit(1)
    );
    const snap = await getDocs(q);
    const doc = snap.docs[0];
    if (!doc) {
      return json(res, 200, { success: true, superAdmin: null });
    }
    const data = doc.data() || {};
    return json(res, 200, {
      success: true,
      superAdmin: {
        email: data.email || "",
        name: data.name || "",
      },
    });
  } catch (err) {
    console.error("[crm super-admin GET] error", err);
    return json(res, 500, { success: false, message: "Internal Server Error" });
  }
}
