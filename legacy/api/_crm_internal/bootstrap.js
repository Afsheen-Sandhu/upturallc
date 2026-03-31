import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore/lite";
import { getDb } from "./_firebase.js";
import { requireCrmAuth, requireRole } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

/**
 * GET /api/crm/bootstrap
 * Returns clients and users in one request to avoid multiple cold starts / round-trips.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { success: false, message: "Method Not Allowed" });

  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  try {
    const isSuperAdmin = auth.role === "super_admin";

    const clientQ = (() => {
      const qParts = [collection(db, "clients")];
      if (!isSuperAdmin) qParts.push(where("createdByEmail", "==", auth.email.toLowerCase()));
      qParts.push(orderBy("createdAt", "desc"));
      qParts.push(limit(100));
      return query(...qParts);
    })();

    const userQ = isSuperAdmin
      ? query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(100)
        )
      : null;

    const [clientsSnap, usersSnap] = await Promise.all([
      getDocs(clientQ),
      userQ ? getDocs(userQ) : Promise.resolve({ docs: [] }),
    ]);

    const clients = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const users = usersSnap.docs
      ? usersSnap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            email: data.email || "",
            role: data.role || "",
            name: data.name || "",
            employeeId: data.employeeId || "",
            disabled: !!data.disabled,
          };
        })
      : [];

    return json(res, 200, { success: true, clients, users });
  } catch (err) {
    console.error("[crm bootstrap GET] error", err);
    return json(res, 500, { success: false, message: "Internal Server Error" });
  }
}
