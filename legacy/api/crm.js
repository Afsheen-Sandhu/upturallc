import applicants from "./_crm_internal/applicants.js";
import attendance from "./_crm_internal/attendance.js";
import bootstrap from "./_crm_internal/bootstrap.js";
import clients from "./_crm_internal/clients.js";
import employees from "./_crm_internal/employees.js";
import invoices from "./_crm_internal/invoices.js";
import meetings from "./_crm_internal/meetings.js";
import reports from "./_crm_internal/reports.js";
import sales from "./_crm_internal/sales.js";
import superAdmin from "./_crm_internal/super-admin.js";
import userManagement from "./_crm_internal/user-management.js";
import { getDb } from "./_crm_internal/_firebase.js";

// Eager-init Firestore when the serverless function loads so first request doesn't pay connection setup in-handler
try {
  getDb();
} catch (_) {}

export default async function handler(req, res) {
    // Extract the resource from query (set by rewrite) or from path
    let resource = req.query?.resource;

    if (!resource) {
        try {
            const url = new URL(req.url, "http://localhost");
            const pathParts = url.pathname.split('/').filter(Boolean);
            resource = pathParts[2];
        } catch (e) {
            resource = null;
        }
    }

    switch (resource) {
        case "applicants": return applicants(req, res);
        case "attendance": return attendance(req, res);
        case "bootstrap": return bootstrap(req, res);
        case "clients": return clients(req, res);
        case "employees": return employees(req, res);
        case "invoices": return invoices(req, res);
        case "meetings": return meetings(req, res);
        case "reports": return reports(req, res);
        case "sales": return sales(req, res);
        case "super-admin": return superAdmin(req, res);
        case "user-management": return userManagement(req, res);
        default:
            return res.status(404).json({ success: false, message: `CRM Resource Not Found: ${resource}` });
    }
}
