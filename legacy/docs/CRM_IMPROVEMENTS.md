# CRM – Bird's Eye View: Loopholes & Improvements

High-level review of the Uptura CRM. Use this as a backlog for security, data quality, UX, and maintainability.

---

## 1. Security

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **Hardcoded fallback admin password** | `api/crm-auth.js`: `ADMIN_PASSWORD` defaults to a real value when env is unset | Require `ADMIN_EMAIL` and `ADMIN_PASSWORD` in env for bootstrap; fail or return 503 if missing. Never default to a real password. |
| **No login rate limiting** | `api/crm-auth.js` POST | Add rate limiting (by IP or email) to reduce brute-force and credential stuffing. |
| **Duplicate user creation** | `api/crm/user-management.js` | Before `addDoc`, query `users` by email; return 409 if email already exists. |
| **PATCH returns 500 for missing docs** | `clients.js`, `employees.js`, `applicants.js`, `meetings.js`, `sales.js`, `invoices.js` | `getDoc` before `updateDoc`; if `!snap.exists()` return 404 so clients can tell “not found” from server errors. |
| **Session only in localStorage** | `crm.js` | Token is exposed to XSS. Document risk; consider short-lived token + refresh or httpOnly cookie for sensitive use. |
| **Firestore rules** | Chat uses client-side Firestore | Ensure Firestore rules restrict `chats` (and subcollections) so users only read/write their own conversations. |

---

## 2. Data integrity

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **Clients: no required fields** | `api/crm/clients.js` POST | Require at least `name` or `email`; return 400 if both missing. |
| **Employees: onboardingStatus not validated** | `api/crm/employees.js` PATCH | Normalize against a whitelist (e.g. `["pending", "completed"]`); return 400 for invalid values. |
| **Invoices: no business validations** | `api/crm/invoices.js` | Validate `amount` (number, ≥ 0 or > 0); optionally check `clientId` exists in `clients`. |
| **Meetings: invalid dates** | `api/crm/meetings.js` | Validate `scheduledAt` (e.g. `!isNaN(new Date(scheduledAt).getTime())`); return 400 for invalid dates. |
| **Sales: clientId not validated** | `api/crm/sales.js` | At least require non-empty string; optionally check existence in `clients`. |

---

## 3. UX

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **Reports: no loading indicator** | `crm.js` `refreshReports()` | Add an inline loader (e.g. `#reportsLoading`) like other pages. |
| **Errors via `alert()`** | `crm.js` (Save buttons on clients, employees, applicants) | Use in-page message area (`setMsg` or dedicated status element) instead of `alert()`. |
| **Accessibility** | Forms and dynamic content | Add `aria-live` for errors/success, `aria-busy` when loading, `aria-current="page"` on active nav; associate errors with inputs (`aria-describedby`). |
| **Focus after login** | After successful login | Move focus to main content or first actionable element for keyboard/screen-reader users. |

---

## 4. Consistency

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **PATCH 404 vs 500** | Most PATCH handlers | For all PATCH/GET-by-id: check existence first; return 404 with a standard “Not found” when resource is missing. |
| **Naming: “deal” vs “sale”** | `crm.js` vs API | Pick one term for UI (e.g. “deal”) and one for API (“sale”); keep copy consistent. |
| **Error message wording** | APIs and client | Standardize patterns (e.g. “Validation error: …” for 400, “Not found” for 404, “Forbidden” for 403). |

---

## 5. Scalability / maintainability

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **Firestore indexes** | `firestore.indexes.json` | Add composite indexes for every `where` + `orderBy` used (e.g. clients by status + createdAt; meetings; users). Deploy and fix index errors from console. |
| **Magic numbers for limits** | `api/crm/*.js` | Define constants (e.g. `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`) and use everywhere. |
| **Duplicated enums** | `crm.js` and `api/crm/clients.js` (e.g. pipeline statuses) | Move shared enums to a single module (e.g. `api/crm/constants.js`) and import in API and, if needed, client. |
| **API base path** | `crm.js` | Introduce `CRM_API_BASE` (e.g. `/api`) and build URLs from it for easier env/path changes. |

---

## 6. Other

| Finding | Location | Recommendation |
|--------|----------|----------------|
| **Login help text** | “Admin credentials also work (super_admin)” | If internal-only, consider removing or moving to internal docs. |
| **Typo** | “Bussiness” in welcome message | Fixed to “Business” in `crm.js`. |

---

## Priority summary

- **High:** Remove hardcoded admin password default; add duplicate-email check in user-management; add required-field validations (clients, etc.); return 404 on PATCH when doc missing.
- **Medium:** Validate dates (meetings), amounts (invoices), enums (employees); add Reports loader; replace `alert()` with in-page messages; add missing Firestore indexes.
- **Lower:** Rate limiting; accessibility improvements; shared constants and API base; Firestore rules review.
