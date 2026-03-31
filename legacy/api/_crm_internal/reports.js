import { collection, getCountFromServer, getDocs, limit, query, where } from "firebase/firestore/lite";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

async function safeCount(db, col, whereField, op, value, authFilter) {
  try {
    const base = collection(db, col);
    let q = base;
    if (whereField) {
      q = query(q, where(whereField, op, value));
    }
    if (authFilter) {
      q = query(q, where("createdByEmail", "==", authFilter));
    }
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    // Fallback for older emulator / rule constraints
    try {
      const base = collection(db, col);
      let q = base;
      if (whereField) {
        q = query(q, where(whereField, op, value));
      }
      if (authFilter) {
        q = query(q, where("createdByEmail", "==", authFilter));
      }
      q = query(q, limit(1000));
      const snap = await getDocs(q);
      return snap.size;
    } catch (_) {
      return 0;
    }
  }
}

export default async function handler(req, res) {
  const auth = requireCrmAuth(req);
  if (!auth.ok) return json(res, auth.status || 401, { success: false, message: auth.message });

  if (req.method !== "GET") return json(res, 405, { success: false, message: "Method Not Allowed" });

  try {
    const db = getDb();
    const authFilter = auth.role !== "super_admin" ? auth.email.toLowerCase() : null;

    const pipelineStatuses = [
      "lead", "contacted", "discovery", "proposal_sent", "negotiation",
      "approved", "onboarding", "active", "invoice_sent", "payment_received",
      "completed", "lost",
    ];

    // Build an array of promises for all counts
    const promises = [
      // Client Pipeline
      ...pipelineStatuses.map(s => safeCount(db, "clients", "pipelineStatus", "==", s, authFilter)),
      // Employees
      safeCount(db, "employees", null, null, null, authFilter),
      safeCount(db, "employees", "onboardingStatus", "==", "completed", authFilter),
      // Applicants
      safeCount(db, "jobApplicants", null, null, null, authFilter),
      safeCount(db, "jobApplicants", "stage", "==", "applied", authFilter),
      safeCount(db, "jobApplicants", "stage", "==", "interview", authFilter),
      safeCount(db, "jobApplicants", "stage", "==", "hired", authFilter),
      // Meetings, Invoices, Sales
      safeCount(db, "meetings", null, null, null, authFilter),
      safeCount(db, "invoices", null, null, null, authFilter),
      safeCount(db, "invoices", "status", "==", "draft", authFilter),
      safeCount(db, "invoices", "status", "==", "sent", authFilter),
      safeCount(db, "invoices", "status", "==", "paid", authFilter),
      safeCount(db, "invoices", "status", "==", "void", authFilter),
      safeCount(db, "sales", null, null, null, authFilter)
    ];

    const results = await Promise.all(promises);
    let idx = 0;

    const clientPipeline = {};
    pipelineStatuses.forEach(s => {
      clientPipeline[s] = results[idx++];
    });

    const employeesTotal = results[idx++];
    const employeesOnboarded = results[idx++];

    const applicantsTotal = results[idx++];
    const applicantsByStage = {
      applied: results[idx++],
      interview: results[idx++],
      hired: results[idx++],
    };

    const meetingsTotal = results[idx++];
    const invoicesTotal = results[idx++];
    const invoicesByStatus = {
      draft: results[idx++],
      sent: results[idx++],
      paid: results[idx++],
      void: results[idx++],
    };

    const salesTotal = results[idx++];

    return json(res, 200, {
      success: true,
      reports: {
        clientPipeline,
        employees: { total: employeesTotal, onboarded: employeesOnboarded },
        applicants: { total: applicantsTotal, byStage: applicantsByStage },
        meetings: { total: meetingsTotal },
        invoices: { total: invoicesTotal, byStatus: invoicesByStatus },
        sales: { total: salesTotal },
      },
    });
  } catch (err) {
    console.error("[crm reports] error", err);
    return json(res, 500, { success: false, message: "Internal Server Error" });
  }
}

