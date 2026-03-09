import { collection, getCountFromServer, getDocs, limit, query, where } from "firebase/firestore";
import { getDb } from "./_firebase.js";
import { requireCrmAuth } from "./_auth.js";

function json(res, status, body) {
  res.status(status).json(body);
}

async function safeCount(db, col, whereField, op, value) {
  try {
    const base = collection(db, col);
    const q = whereField ? query(base, where(whereField, op, value)) : query(base);
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    // Fallback for older emulator / rule constraints
    try {
      const base = collection(db, col);
      const q = whereField ? query(base, where(whereField, op, value), limit(1000)) : query(base, limit(1000));
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

    const pipelineStatuses = [
      "lead",
      "contacted",
      "discovery",
      "proposal_sent",
      "negotiation",
      "approved",
      "onboarding",
      "active",
      "invoice_sent",
      "payment_received",
      "completed",
      "lost",
    ];

    const clientPipeline = {};
    for (const s of pipelineStatuses) {
      clientPipeline[s] = await safeCount(db, "clients", "pipelineStatus", "==", s);
    }

    const employeesTotal = await safeCount(db, "employees");
    const employeesOnboarded = await safeCount(db, "employees", "onboardingStatus", "==", "completed");

    const applicantsTotal = await safeCount(db, "jobApplicants");
    const applicantsByStage = {
      applied: await safeCount(db, "jobApplicants", "stage", "==", "applied"),
      interview: await safeCount(db, "jobApplicants", "stage", "==", "interview"),
      hired: await safeCount(db, "jobApplicants", "stage", "==", "hired"),
    };

    const meetingsTotal = await safeCount(db, "meetings");
    const invoicesTotal = await safeCount(db, "invoices");
    const invoicesByStatus = {
      draft: await safeCount(db, "invoices", "status", "==", "draft"),
      sent: await safeCount(db, "invoices", "status", "==", "sent"),
      paid: await safeCount(db, "invoices", "status", "==", "paid"),
      void: await safeCount(db, "invoices", "status", "==", "void"),
    };

    const salesTotal = await safeCount(db, "sales");

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

