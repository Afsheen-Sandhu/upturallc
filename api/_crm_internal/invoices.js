import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";
import { sendEmail } from "./_email.js";

function json(res, status, body) {
  res.status(status).json(body);
}

const INVOICE_STATUSES = ["draft", "sent", "paid", "void"];

function normalizeStatus(status) {
  const s = String(status || "").toLowerCase().trim();
  return INVOICE_STATUSES.includes(s) ? s : "draft";
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  const db = getDb();

  if (req.method === "GET") {
    try {
      const qParts = [collection(db, "invoices")];

      // Role-based visibility
      if (auth.role !== "super_admin") {
        qParts.push(where("createdByEmail", "==", auth.email.toLowerCase()));
      }

      qParts.push(orderBy("createdAt", "desc"));
      qParts.push(limit(200));

      const snap = await getDocs(query(...qParts));
      const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return json(res, 200, { success: true, invoices });
    } catch (err) {
      console.error("[crm invoices GET] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { clientId, amount, status, dueDate, notes } = req.body || {};
      const docRef = await addDoc(collection(db, "invoices"), {
        clientId: clientId ? String(clientId).trim() : "",
        amount: amount != null && amount !== "" ? Number(amount) : null,
        status: normalizeStatus(status),
        dueDate: dueDate ? String(dueDate).trim() : "",
        notes: notes ? String(notes).trim() : "",
        createdAt: serverTimestamp(),
        createdBy: auth.userId,
        createdByEmail: auth.email || "",
        updatedAt: serverTimestamp(),
        updatedBy: auth.userId,
        updatedByEmail: auth.email || "",
      });

      if (normalizeStatus(status) === "sent" && clientId) {
        // Try to fetch client email
        let email = String(clientId).includes("@") ? String(clientId) : null;
        if (!email) {
          try {
            const clientSnap = await getDoc(doc(db, "clients", String(clientId).trim()));
            if (clientSnap.exists() && clientSnap.data().email) {
              email = clientSnap.data().email;
            }
          } catch (e) { }
        }

        if (email) {
          const html = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
              <h2>Invoice Notification</h2>
              <p>A new invoice for <strong>$${amount != null ? Number(amount).toFixed(2) : "0.00"}</strong> has been issued to you by Uptura.</p>
              <p>Due Date: <strong>${dueDate || "Upon Receipt"}</strong></p>
              ${notes ? `<p>Notes: ${notes}</p>` : ""}
              <br />
              <p>Please log in to your portal or contact us to arrange payment.</p>
              <br />
              <p>Best regards,</p>
              <p><strong>The Uptura Team</strong></p>
            </div>
          `;
          sendEmail({ to: email, subject: "New Invoice from Uptura", html }).catch(e => console.error(e));
        }
      }

      return json(res, 201, { success: true, id: docRef.id });
    } catch (err) {
      console.error("[crm invoices POST] error", err);
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
      if (body.amount !== undefined) updates.amount = body.amount !== "" ? Number(body.amount) : null;
      if (body.status !== undefined) updates.status = normalizeStatus(body.status);
      if (body.dueDate !== undefined) updates.dueDate = String(body.dueDate || "").trim();
      if (body.notes !== undefined) updates.notes = String(body.notes || "").trim();
      updates.updatedAt = serverTimestamp();
      updates.updatedBy = auth.userId;
      updates.updatedByEmail = auth.email || "";

      // Fetch old doc to check status transition
      let oldStatus = null;
      let finalClientId = updates.clientId;
      let finalAmount = updates.amount;
      let finalDueDate = updates.dueDate;
      let finalNotes = updates.notes;

      try {
        const oldSnap = await getDoc(doc(db, "invoices", String(id)));
        if (oldSnap.exists()) {
          const oldData = oldSnap.data();
          oldStatus = oldData.status;
          if (finalClientId === undefined) finalClientId = oldData.clientId;
          if (finalAmount === undefined) finalAmount = oldData.amount;
          if (finalDueDate === undefined) finalDueDate = oldData.dueDate;
          if (finalNotes === undefined) finalNotes = oldData.notes;
        }
      } catch (e) { }

      await updateDoc(doc(db, "invoices", String(id)), updates);
      const snap = await getDoc(doc(db, "invoices", String(id)));

      if (updates.status === "sent" && oldStatus !== "sent" && finalClientId) {
        let email = String(finalClientId).includes("@") ? String(finalClientId) : null;
        if (!email) {
          try {
            const clientSnap = await getDoc(doc(db, "clients", String(finalClientId).trim()));
            if (clientSnap.exists() && clientSnap.data().email) {
              email = clientSnap.data().email;
            }
          } catch (e) { }
        }

        if (email) {
          const html = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
              <h2>Invoice Notification</h2>
              <p>An invoice for <strong>$${finalAmount != null ? Number(finalAmount).toFixed(2) : "0.00"}</strong> has been marked as sent.</p>
              <p>Due Date: <strong>${finalDueDate || "Upon Receipt"}</strong></p>
              ${finalNotes ? `<p>Notes: ${finalNotes}</p>` : ""}
              <br />
              <p>Please log in to your portal or contact us to arrange payment.</p>
              <br />
              <p>Best regards,</p>
              <p><strong>The Uptura Team</strong></p>
            </div>
          `;
          sendEmail({ to: email, subject: "Invoice Update from Uptura", html }).catch(e => console.error(e));
        }
      }

      return json(res, 200, { success: true, invoice: snap.exists() ? { id: snap.id, ...snap.data() } : null });
    } catch (err) {
      console.error("[crm invoices PATCH] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query || {};
      if (!id) return json(res, 400, { success: false, message: "Missing id" });
      await deleteDoc(doc(db, "invoices", String(id)));
      return json(res, 200, { success: true, message: "Deleted" });
    } catch (err) {
      console.error("[crm invoices DELETE] error", err);
      return json(res, 500, { success: false, message: "Internal Server Error" });
    }
  }

  return json(res, 405, { success: false, message: "Method Not Allowed" });
}

