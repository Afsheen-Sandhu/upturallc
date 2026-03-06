import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const STORAGE_KEY = "uptura_crm_session_v1";
const CHECKIN_STORAGE_KEY = "uptura_checkin_v1";

const firebaseConfig = {
  apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
  authDomain: "uptura-leads.firebaseapp.com",
  projectId: "uptura-leads",
  storageBucket: "uptura-leads.firebasestorage.app",
  messagingSenderId: "146306181969",
  appId: "1:146306181969:web:c91b776edc33f652c2c170",
  measurementId: "G-ELHWMEHZ9W",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const PIPELINE_STATUSES = [
  { id: "lead", label: "Lead" },
  { id: "contacted", label: "Contacted" },
  { id: "discovery", label: "Discovery / Requirement Gathering" },
  { id: "proposal_sent", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "approved", label: "Approved / Deal Won" },
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active Client" },
  { id: "invoice_sent", label: "Invoice Sent" },
  { id: "payment_received", label: "Payment Received" },
  { id: "completed", label: "Completed / Closed" },
  { id: "lost", label: "Lost / Dropped" },
];

const EMP_ONBOARDING = [
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

const APP_STAGES = [
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "hired", label: "Hired" },
];

function qs(sel) {
  return document.querySelector(sel);
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function authHeader() {
  const s = getSession();
  return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
}

function setMsg(el, text, kind) {
  if (!el) return;
  el.classList.remove("ok", "error");
  if (kind) el.classList.add(kind);
  el.textContent = text || "";
}

function toggleInlineLoader(id, show) {
  const el = qs(`#${id}`);
  if (el) el.style.display = show ? "flex" : "none";
}

function setupTopbarScroll() {
  const scroller = qs(".content");
  const topbar = qs(".topbar");
  if (!scroller || !topbar) return;

  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scroller.scrollTop || 0;
      const goingDown = y > lastY;
      const past = y > 12;

      topbar.classList.toggle("is-scrolled", past);

      // Hide on scroll down, show on scroll up (after some movement)
      if (y > 80 && goingDown) topbar.classList.add("is-hidden");
      else topbar.classList.remove("is-hidden");

      lastY = y;
      ticking = false;
    });
  };

  scroller.addEventListener("scroll", onScroll, { passive: true });
  // initial state
  onScroll();
}

function applyPageTitleFromBody() {
  const page = document.body.getAttribute("data-crm-page") || "clients";
  const title = qs("#pageTitle");
  const subtitle = qs("#pageSubtitle");
  if (!title || !subtitle) return;
  if (page === "clients") {
    title.textContent = "Clients";
    subtitle.textContent = "Pipeline + profiles";
  } else if (page === "meetings") {
    title.textContent = "Meetings";
    subtitle.textContent = "Follow-ups + scheduling";
  } else if (page === "employees") {
    title.textContent = "Employees";
    subtitle.textContent = "Onboarding + working hours";
  } else if (page === "applicants") {
    title.textContent = "Applicants";
    subtitle.textContent = "Hiring stages";
  } else if (page === "sales") {
    title.textContent = "Sales";
    subtitle.textContent = "Deals + agent tracking";
  } else if (page === "invoices") {
    title.textContent = "Invoices";
    subtitle.textContent = "Create + track status";
  } else if (page === "reports") {
    title.textContent = "Reports";
    subtitle.textContent = "KPIs + snapshots";
  } else if (page === "chat") {
    title.textContent = "Chat";
    subtitle.textContent = "Firestore real-time";
  } else if (page === "users") {
    title.textContent = "User Management";
    subtitle.textContent = "Create CRM logins";
  } else if (page === "dashboard") {
    title.textContent = "Dashboard";
    subtitle.textContent = "Check in & track your time";
  } else if (page === "attendance") {
    title.textContent = "Attendance";
    subtitle.textContent = "All employees — date-wise work hours";
  }
}

function getCurrentPage() {
  return document.body.getAttribute("data-crm-page") || "clients";
}

function applyRoleUI(role) {
  qs("#rolePill").textContent = `Role: ${role || "—"}`;

  const canManageUsers = role === "super_admin" || role === "admin";
  const usersNav = qs("#usersNav");
  if (usersNav) usersNav.style.display = canManageUsers ? "flex" : "none";
  const attendanceNav = qs("#attendanceNav");
  if (attendanceNav) attendanceNav.style.display = canManageUsers ? "flex" : "none";
  if (!canManageUsers) {
    qs("#tab-users")?.classList.remove("active");
  }

  // Restrict sidebar tabs for employees; non-employees on dashboard go to clients
  const page = getCurrentPage();
  const allPages = ["clients", "meetings", "employees", "applicants", "sales", "invoices", "reports", "chat", "users", "dashboard"];
  const employeeAllowed = ["dashboard", "clients", "meetings", "sales", "invoices", "chat"];

  if (page === "dashboard" && !["employee", "super_admin", "admin"].includes(role)) {
    window.location.href = "crm.html";
    return;
  }
  if (page === "attendance" && !["super_admin", "admin"].includes(role)) {
    window.location.href = "crm.html";
    return;
  }

  const links = document.querySelectorAll(".nav-link[href*='crm']");
  if (role === "employee") {
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const match = href.match(/crm-?([a-z]+)?/);
      let target = "clients";
      if (href === "crm.html") target = "clients";
      else if (href === "crm-dashboard.html") target = "dashboard";
      else if (match && match[1]) target = match[1];

      if (!employeeAllowed.includes(target)) {
        link.style.display = "none";
      } else {
        link.style.display = "flex";
      }
    });

    if (!employeeAllowed.includes(page)) {
      window.location.href = "crm-dashboard.html";
    }
  } else {
    links.forEach((link) => {
      link.style.display = "flex";
    });
    const showDashboard = role === "super_admin" || role === "admin";
    document.querySelectorAll('a[href="crm-dashboard.html"]').forEach((el) => {
      el.style.display = showDashboard ? "flex" : "none";
    });
  }
}

function showLoggedInUI() {
  const loginCard = qs("#loginCard");
  const sidebar = qs("#sidebar");
  const topbar = qs(".topbar");

  document.body.classList.remove("crm-logged-out");

  if (loginCard) loginCard.style.display = "none";
  if (sidebar) sidebar.style.display = "flex";
  if (topbar) topbar.style.display = "flex";

  document.querySelectorAll(".tab").forEach((t) => (t.style.display = "block"));
}

function showLoggedOutUI() {
  const loginCard = qs("#loginCard");
  const sidebar = qs("#sidebar");
  const topbar = qs(".topbar");

  document.body.classList.add("crm-logged-out");

  if (loginCard) loginCard.style.display = "block";
  if (sidebar) sidebar.style.display = "none";
  if (topbar) topbar.style.display = "none";

  document.querySelectorAll(".tab").forEach((t) => {
    t.style.display = "none";
    t.classList.remove("active");
  });
}

async function crmLogin(email, password) {
  const resp = await fetch("/api/crm-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }
  return data;
}

async function fetchClients() {
  const resp = await fetch("/api/crm/clients", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch clients");
  return data.clients || [];
}

async function createClient(payload) {
  const resp = await fetch("/api/crm/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to create client");
  return data;
}

async function updateClient(id, patch) {
  const resp = await fetch(`/api/crm/clients?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update client");
  return data;
}

async function createUser(payload) {
  const resp = await fetch("/api/crm/user-management", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to create user");
  return data;
}

async function fetchUsers() {
  const resp = await fetch("/api/crm/user-management", {
    method: "GET",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch users");
  return data.users || [];
}

function buildWelcomeMessage(email, password) {
  return `Welcome to Uptura! 

We have onboarded you as a Bussiness Development Agent. Your account details are:

📧 Email: ${email}
🔑 Password: ${password}

Please login through our app or web portal to start managing collections.`;
}

function buildEmployeeWelcomeMessage(name, email) {
  return `Welcome to Uptura! 

We have onboarded you as an employee. Your profile details are:

👤 Name: ${name}
📧 Email: ${email}

If you do not yet have login credentials, please check with your admin for your CRM username and password.`;
}

async function fetchEmployees() {
  const resp = await fetch("/api/crm/employees", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch employees");
  return data.employees || [];
}

async function createEmployee(payload) {
  const resp = await fetch("/api/crm/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to add employee");
  return data;
}

async function updateEmployee(id, patch) {
  const resp = await fetch(`/api/crm/employees?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update employee");
  return data.employee;
}

async function fetchApplicants() {
  const resp = await fetch("/api/crm/applicants", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch applicants");
  return data.applicants || [];
}

async function createApplicant(payload) {
  const resp = await fetch("/api/crm/applicants", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to add applicant");
  return data;
}

async function updateApplicant(id, patch) {
  const resp = await fetch(`/api/crm/applicants?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update applicant");
  return data.applicant;
}

async function fetchMeetings() {
  const resp = await fetch("/api/crm/meetings", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch meetings");
  return data.meetings || [];
}

async function createMeeting(payload) {
  const resp = await fetch("/api/crm/meetings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to create meeting");
  return data;
}

async function fetchSales() {
  const resp = await fetch("/api/crm/sales", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch sales");
  return data.sales || [];
}

async function createSale(payload) {
  const resp = await fetch("/api/crm/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to create deal");
  return data;
}

async function fetchInvoices() {
  const resp = await fetch("/api/crm/invoices", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch invoices");
  return data.invoices || [];
}

async function createInvoice(payload) {
  const resp = await fetch("/api/crm/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to create invoice");
  return data;
}

async function fetchReports() {
  const resp = await fetch("/api/crm/reports", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch reports");
  return data.reports;
}

function renderClientsTable(clients) {
  const tbody = qs("#clientsTbody");
  const empty = qs("#clientsEmpty");
  const search = (qs("#clientSearch")?.value || "").toLowerCase().trim();

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const hay = `${c.name || ""} ${c.email || ""} ${c.company || ""}`.toLowerCase();
    return hay.includes(search);
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const c of filtered) {
    const tr = document.createElement("tr");
    const statusSelect = document.createElement("select");
    statusSelect.style.padding = "8px 10px";
    statusSelect.style.borderRadius = "10px";
    statusSelect.style.border = "1px solid var(--border)";
    for (const s of PIPELINE_STATUSES) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      if (c.pipelineStatus === s.id) opt.selected = true;
      statusSelect.appendChild(opt);
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      try {
        await updateClient(c.id, { pipelineStatus: statusSelect.value });
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 800);
      } catch (e) {
        alert(e.message || "Update failed");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><div style="font-weight:900">${escapeHtml(c.name || "—")}</div></td>
      <td>${escapeHtml(c.company || "—")}</td>
      <td>${escapeHtml(c.email || "—")}</td>
      <td>${escapeHtml(c.phone || "—")}</td>
    `;
    const tdStatus = document.createElement("td");
    tdStatus.appendChild(statusSelect);
    const tdCreator = document.createElement("td");
    tdCreator.textContent = c.createdByEmail || "—";
    const tdAction = document.createElement("td");
    tdAction.appendChild(saveBtn);
    tr.appendChild(tdStatus);
    tr.appendChild(tdCreator);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let clientsCache = [];
let employeesCache = [];
let applicantsCache = [];
let meetingsCache = [];
let salesCache = [];
let invoicesCache = [];
let reportsCache = null;
let usersCache = [];

async function refreshClients() {
  const msg = qs("#clientMsg");
  setMsg(msg, "Loading clients…", "");
  try {
    toggleInlineLoader("clientsLoading", true);
    clientsCache = await fetchClients();
    renderClientsTable(clientsCache);
    setMsg(msg, `Loaded ${clientsCache.length} client(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load clients", "error");
  } finally {
    toggleInlineLoader("clientsLoading", false);
  }
}

async function refreshEmployees() {
  const msg = qs("#empMsg");
  setMsg(msg, "Loading employees…", "");
  try {
    toggleInlineLoader("empLoading", true);
    employeesCache = await fetchEmployees();
    renderEmployeesTable(employeesCache);
    setMsg(msg, `Loaded ${employeesCache.length} employee(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load employees", "error");
  } finally {
    toggleInlineLoader("empLoading", false);
  }
}

function renderEmployeesTable(list) {
  const tbody = qs("#empTbody");
  const empty = qs("#empEmpty");
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const emp of list) {
    const tr = document.createElement("tr");
    const onboardingSelect = document.createElement("select");
    onboardingSelect.style.padding = "8px 10px";
    onboardingSelect.style.borderRadius = "10px";
    onboardingSelect.style.border = "1px solid var(--border)";
    for (const s of EMP_ONBOARDING) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      if (emp.onboardingStatus === s.id) opt.selected = true;
      onboardingSelect.appendChild(opt);
    }

    const startedLabel = emp.startedWorking ? "Yes" : "No";

    const startedBtn = document.createElement("button");
    startedBtn.className = "btn";
    startedBtn.textContent = emp.startedWorking ? "Started" : "Started Working";
    startedBtn.disabled = !!emp.startedWorking;
    startedBtn.style.padding = "8px 10px";

    startedBtn.addEventListener("click", async () => {
      if (emp.startedWorking) return;
      startedBtn.disabled = true;
      startedBtn.textContent = "Saving...";
      try {
        const updated = await updateEmployee(emp.id, { markStartedWorking: true });
        emp.startedWorking = updated?.startedWorking;
        emp.onboardingStatus = updated?.onboardingStatus;
        renderEmployeesTable(employeesCache.map((e) => (e.id === emp.id ? updated : e)));
      } catch (e) {
        alert(e.message || "Failed to update");
        startedBtn.textContent = "Started Working";
        startedBtn.disabled = false;
      }
    });

    onboardingSelect.addEventListener("change", async () => {
      try {
        const updated = await updateEmployee(emp.id, { onboardingStatus: onboardingSelect.value });
        Object.assign(emp, updated);
      } catch (e) {
        alert(e.message || "Failed to update");
      }
    });

    tr.innerHTML = `
      <td><div style="font-weight:900">${escapeHtml(emp.name || "—")}</div></td>
      <td>${escapeHtml(emp.email || "—")}</td>
      <td>${escapeHtml(emp.role || "—")}</td>
      <td>${emp.dailyHours != null ? escapeHtml(emp.dailyHours) : "—"}</td>
    `;
    const tdOnb = document.createElement("td");
    tdOnb.appendChild(onboardingSelect);
    const tdStarted = document.createElement("td");
    tdStarted.textContent = startedLabel;
    const tdCreator = document.createElement("td");
    tdCreator.textContent = emp.createdByEmail || "—";
    const tdAction = document.createElement("td");
    tdAction.appendChild(startedBtn);
    tr.appendChild(tdOnb);
    tr.appendChild(tdStarted);
    tr.appendChild(tdCreator);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  }
}

async function refreshApplicants() {
  const msg = qs("#appMsg");
  setMsg(msg, "Loading applicants…", "");
  try {
    toggleInlineLoader("appLoading", true);
    applicantsCache = await fetchApplicants();
    renderApplicantsTable(applicantsCache);
    setMsg(msg, `Loaded ${applicantsCache.length} applicant(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load applicants", "error");
  } finally {
    toggleInlineLoader("appLoading", false);
  }
}

function renderApplicantsTable(list) {
  const tbody = qs("#appTbody");
  const empty = qs("#appEmpty");
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const app of list) {
    const tr = document.createElement("tr");
    const stageSelect = document.createElement("select");
    stageSelect.style.padding = "8px 10px";
    stageSelect.style.borderRadius = "10px";
    stageSelect.style.border = "1px solid var(--border)";
    for (const s of APP_STAGES) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.label;
      if (app.stage === s.id) opt.selected = true;
      stageSelect.appendChild(opt);
    }
    stageSelect.addEventListener("change", async () => {
      try {
        const updated = await updateApplicant(app.id, { stage: stageSelect.value });
        Object.assign(app, updated);
      } catch (e) {
        alert(e.message || "Failed to update");
      }
    });

    tr.innerHTML = `
      <td><div style="font-weight:900">${escapeHtml(app.name || "—")}</div></td>
      <td>${escapeHtml(app.email || "—")}</td>
      <td>${escapeHtml(app.role || "—")}</td>
      <td></td>
      <td>${escapeHtml(app.source || "—")}</td>
      <td>${escapeHtml(app.createdByEmail || "—")}</td>
    `;
    const tds = tr.querySelectorAll("td");
    tds[3].appendChild(stageSelect);
    tbody.appendChild(tr);
  }
}

async function refreshMeetings() {
  const msg = qs("#meetMsg");
  setMsg(msg, "Loading meetings…", "");
  try {
    toggleInlineLoader("meetLoading", true);
    meetingsCache = await fetchMeetings();
    renderMeetingsTable(meetingsCache);
    setMsg(msg, `Loaded ${meetingsCache.length} meeting(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load meetings", "error");
  } finally {
    toggleInlineLoader("meetLoading", false);
  }
}

function renderMeetingsTable(list) {
  const tbody = qs("#meetTbody");
  const empty = qs("#meetEmpty");
  if (!tbody || !empty) return;
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  for (const m of list) {
    const when = m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : "—";
    const related = m.relatedType && m.relatedId ? `${m.relatedType}:${m.relatedId}` : "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div style="font-weight:900">${escapeHtml(m.title || "—")}</div></td>
      <td>${escapeHtml(when)}</td>
      <td>${escapeHtml(related)}</td>
      <td>${escapeHtml(m.status || "scheduled")}</td>
      <td>${escapeHtml(m.createdByEmail || "—")}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function refreshSales() {
  const msg = qs("#saleMsg");
  setMsg(msg, "Loading deals…", "");
  try {
    toggleInlineLoader("salesLoading", true);
    salesCache = await fetchSales();
    renderSalesTable(salesCache);
    setMsg(msg, `Loaded ${salesCache.length} deal(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load deals", "error");
  } finally {
    toggleInlineLoader("salesLoading", false);
  }
}

function renderSalesTable(list) {
  const tbody = qs("#salesTbody");
  const empty = qs("#salesEmpty");
  if (!tbody || !empty) return;
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  for (const s of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(s.agentEmail || "—")}</td>
      <td>${escapeHtml(s.clientId || "—")}</td>
      <td>${s.amount != null ? escapeHtml(s.amount) : "—"}</td>
      <td>${escapeHtml(s.stage || "lead")}</td>
      <td>${escapeHtml(s.createdByEmail || "—")}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function refreshInvoices() {
  const msg = qs("#invMsg");
  setMsg(msg, "Loading invoices…", "");
  try {
    toggleInlineLoader("invLoading", true);
    invoicesCache = await fetchInvoices();
    renderInvoicesTable(invoicesCache);
    setMsg(msg, `Loaded ${invoicesCache.length} invoice(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load invoices", "error");
  } finally {
    toggleInlineLoader("invLoading", false);
  }
}

function renderInvoicesTable(list) {
  const tbody = qs("#invTbody");
  const empty = qs("#invEmpty");
  if (!tbody || !empty) return;
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  for (const inv of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(inv.clientId || "—")}</td>
      <td>${inv.amount != null ? escapeHtml(inv.amount) : "—"}</td>
      <td>${escapeHtml(inv.status || "draft")}</td>
      <td>${escapeHtml(inv.dueDate || "—")}</td>
      <td>${escapeHtml(inv.createdByEmail || "—")}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function refreshReports() {
  const msg = qs("#reportsMsg");
  setMsg(msg, "Loading reports…", "");
  try {
    reportsCache = await fetchReports();
    renderReports(reportsCache);
    setMsg(msg, "Updated.", "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load reports", "error");
  } finally {
    // reports uses cards, not table; no inline spinner
  }
}

function statCard(label, value) {
  const div = document.createElement("div");
  div.className = "card";
  div.style.boxShadow = "none";
  div.style.margin = "0";
  div.innerHTML = `
    <div class="muted" style="text-transform:uppercase; letter-spacing:.06em; font-size:11px; font-weight:900;">${escapeHtml(label)}</div>
    <div style="font-size:28px; font-weight:900; margin-top:8px;">${escapeHtml(value)}</div>
  `;
  return div;
}

function renderReports(reports) {
  const grid = qs("#reportsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const pipeline = reports?.clientPipeline || {};
  const employees = reports?.employees || {};
  const applicants = reports?.applicants || {};
  const invoices = reports?.invoices || {};
  const sales = reports?.sales || {};
  const meetings = reports?.meetings || {};

  grid.appendChild(statCard("Clients (total)", Object.values(pipeline).reduce((a, b) => a + (Number(b) || 0), 0)));
  grid.appendChild(statCard("Employees (total)", employees.total ?? 0));
  grid.appendChild(statCard("Employees onboarded", employees.onboarded ?? 0));
  grid.appendChild(statCard("Applicants (total)", applicants.total ?? 0));

  // second row - key pipeline stages
  grid.appendChild(statCard("Pipeline: Lead", pipeline.lead ?? 0));
  grid.appendChild(statCard("Pipeline: Proposal", pipeline.proposal_sent ?? 0));
  grid.appendChild(statCard("Pipeline: Active", pipeline.active ?? 0));
  grid.appendChild(statCard("Pipeline: Completed", pipeline.completed ?? 0));

  // third row - invoices/sales/meetings
  grid.appendChild(statCard("Meetings", meetings.total ?? 0));
  grid.appendChild(statCard("Sales (count)", sales.total ?? 0));
  grid.appendChild(statCard("Invoices (total)", invoices.total ?? 0));
  grid.appendChild(statCard("Invoices paid", invoices.byStatus?.paid ?? 0));
}

async function refreshUsers() {
  const msg = qs("#userMsg");
  toggleInlineLoader("usersLoading", true);
  try {
    usersCache = await fetchUsers();
    renderUsersTable(usersCache);
    setMsg(msg, `Loaded ${usersCache.length} user(s).`, "ok");
  } catch (e) {
    setMsg(msg, e.message || "Failed to load users", "error");
  } finally {
    toggleInlineLoader("usersLoading", false);
  }
}

function renderUsersTable(list) {
  const tbody = qs("#usersTbody");
  const empty = qs("#usersEmpty");
  if (!tbody || !empty) return;
  tbody.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  for (const u of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(u.email || "—")}</td>
      <td>${escapeHtml(u.name || "—")}</td>
      <td>${escapeHtml(u.role || "—")}</td>
      <td>${escapeHtml(u.employeeId || "—")}</td>
      <td>${u.disabled ? "Disabled" : "Active"}</td>
    `;
    tbody.appendChild(tr);
  }
}

function setupChat() {
  const form = qs("#chatForm");
  const input = qs("#chatInput");
  const list = qs("#chatMessages");
  const msg = qs("#chatMsg");
  const threadsEl = qs("#chatThreads");
  const activeTitle = qs("#chatActiveTitle");
  const activeMeta = qs("#chatActiveMeta");

  if (!form || !input || !list || !threadsEl) return;

  const session = getSession();
  const myEmail = (session?.email || "").toLowerCase();
  if (!myEmail) return;

  let activeChatId = null;
  let unsubMessages = null;
  let threadsList = [];
  const sessionRole = session?.role || "";
  let superAdminEmail = null;
  const conversationsLoader = qs("#chatConversationsLoader");

  (async () => {
    try {
      const resp = await fetch("/api/crm/super-admin", { headers: authHeader() });
      const data = await resp.json();
      const card = qs("#superAdminCard");
      const contactEl = qs("#superAdminContact");
      const linkEl = qs("#superAdminEmailLink");
      if (data.success && data.superAdmin?.email) {
        superAdminEmail = data.superAdmin.email.toLowerCase();
        if (card) card.style.display = "block";
        if (contactEl) contactEl.textContent = data.superAdmin.name ? `${data.superAdmin.name} — ${data.superAdmin.email}` : data.superAdmin.email;
        if (linkEl) { linkEl.href = `mailto:${data.superAdmin.email}`; linkEl.style.display = "inline-flex"; }
      }
      if (sessionRole !== "super_admin" && sessionRole !== "admin" && superAdminEmail) {
        const wrap = qs("#chatPeopleWrap");
        const listEl = qs("#chatPeopleList");
        if (wrap && listEl) {
          wrap.style.display = "block";
          listEl.innerHTML = "";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "chat-thread chat-people-item";
          btn.innerHTML = `<div class="chat-thread-title">Chat with Admin</div><div class="chat-thread-sub">${escapeHtml(superAdminEmail)}</div>`;
          btn.addEventListener("click", () => openOrCreateChat(superAdminEmail, "Admin"));
          listEl.appendChild(btn);
        }
      }
      if (sessionRole !== "super_admin" && sessionRole !== "admin" && conversationsLoader) conversationsLoader.style.display = "none";
    } catch (_) {
      if (conversationsLoader) conversationsLoader.style.display = "none";
    }
  })();

  const chatsRef = collection(db, "chats");
  const threadsQuery = query(chatsRef, where("participantEmails", "array-contains", myEmail), orderBy("updatedAt", "desc"), limit(50));

  function openOrCreateChat(otherEmail, displayName) {
    const other = (otherEmail || "").toLowerCase();
    if (!other) return;
    const existing = threadsList.find(
      (t) =>
        (t.participantEmails || []).length === 2 &&
        t.participantEmails.includes(myEmail) &&
        t.participantEmails.includes(other)
    );
    if (existing) {
      selectThread(existing);
      return;
    }
    setMsg(msg, "Opening chat…", "");
    const participantEmails = [myEmail, other].sort();
    addDoc(chatsRef, {
      type: "direct",
      name: displayName || other,
      participantEmails,
      createdAt: serverTimestamp(),
      createdBy: myEmail,
      updatedAt: serverTimestamp(),
    }).then((chatDoc) => {
      selectThread({ id: chatDoc.id, name: displayName || other, participantEmails });
      setMsg(msg, "", "");
    }).catch((err) => setMsg(msg, err.message || "Failed to start chat", "error"));
  }

  function renderThreads(threads) {
    threadsList = threads;
    threadsEl.innerHTML = "";
  }

  function renderMessages(items) {
    list.innerHTML = "";
    for (const m of items) {
      const row = document.createElement("div");
      row.className = "chat-row";
      const when = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : null;
      row.innerHTML = `
        <div class="chat-meta">${escapeHtml(m.senderEmail || "User")} <span>${when ? when.toLocaleString() : ""}</span></div>
        <div class="chat-text">${escapeHtml(m.text || "")}</div>
      `;
      list.appendChild(row);
    }
    list.scrollTop = list.scrollHeight;
  }

  function selectThread(thread) {
    activeChatId = thread.id;
    const others = (thread.participantEmails || []).filter((e) => e !== myEmail);
    const otherEmail = others[0] || "";
    activeTitle.textContent = thread.name ? `Chat with ${thread.name}` : (otherEmail ? `Chat with ${otherEmail}` : "Conversation");
    activeMeta.textContent = otherEmail;
    setMsg(msg, "", "");

    if (unsubMessages) {
      try { unsubMessages(); } catch (_) {}
      unsubMessages = null;
    }

    const msgsRef = collection(db, "chats", activeChatId, "messages");
    const qMsgs = query(msgsRef, orderBy("createdAt", "asc"), limit(200));
    unsubMessages = onSnapshot(
      qMsgs,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderMessages(items);
      },
      (err) => setMsg(msg, err.message || "Failed to load messages", "error")
    );
  }

  // live threads list
  onSnapshot(
    threadsQuery,
    (snap) => {
      const threads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderThreads(threads);
    },
    (err) => setMsg(msg, err.message || "Failed to load conversations", "error")
  );

  if (sessionRole === "super_admin" || sessionRole === "admin") {
    (async () => {
      try {
        const [empResp, usersResp] = await Promise.all([
          fetch("/api/crm/employees", { headers: authHeader() }),
          fetch("/api/crm/user-management", { headers: authHeader() }),
        ]);
        const empData = empResp.ok ? await empResp.json() : {};
        const usersData = usersResp.ok ? await usersResp.json() : {};
        const employees = empData.employees || [];
        const users = usersData.users || [];
        const byEmail = new Map();
        for (const u of users) {
          const e = (u.email || "").toLowerCase();
          if (e && e !== myEmail) byEmail.set(e, { name: u.name || u.email || e, email: e });
        }
        for (const emp of employees) {
          const e = (emp.email || "").toLowerCase();
          if (e && e !== myEmail) byEmail.set(e, { name: emp.name || emp.email || e, email: e });
        }
        const people = Array.from(byEmail.values()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
        const wrap = qs("#chatPeopleWrap");
        const listEl = qs("#chatPeopleList");
        if (wrap && listEl) {
          wrap.style.display = "block";
          listEl.innerHTML = "";
          for (const p of people) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chat-thread chat-people-item";
            btn.innerHTML = `
              <div class="chat-thread-title">${escapeHtml(p.name || p.email)}</div>
              <div class="chat-thread-sub">${escapeHtml(p.email)}</div>
            `;
            btn.addEventListener("click", () => openOrCreateChat(p.email, p.name || p.email));
            listEl.appendChild(btn);
          }
        }
      } catch (_) {}
      if (conversationsLoader) conversationsLoader.style.display = "none";
    })();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(msg, "", "");
    const text = String(input.value || "").trim();
    if (!text) return;
    if (!activeChatId) return setMsg(msg, "Select a conversation first.", "error");

    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text,
        senderEmail: myEmail,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "chats", activeChatId), { updatedAt: serverTimestamp() }, { merge: true });
      input.value = "";
    } catch (err) {
      setMsg(msg, err.message || "Failed to send", "error");
    }
  });
}

function setupSidebar() {
  const sidebar = qs("#sidebar");
  const toggleBtn = qs("#sidebarToggle");
  const toggleIcon = qs("#toggleIcon");
  const mobileMenuBtn = qs("#mobileMenuBtn");

  if (localStorage.getItem("uptura_sidebar_collapsed") === "true") {
    sidebar.classList.add("collapsed");
    toggleIcon?.classList.replace("fa-chevron-left", "fa-chevron-right");
  }

  toggleBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    const isCollapsed = sidebar.classList.contains("collapsed");
    localStorage.setItem("uptura_sidebar_collapsed", String(isCollapsed));
    if (isCollapsed) toggleIcon?.classList.replace("fa-chevron-left", "fa-chevron-right");
    else toggleIcon?.classList.replace("fa-chevron-right", "fa-chevron-left");
  });

  mobileMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 900 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      sidebar.classList.remove("active");
    }
  });
}

function getCheckinState() {
  try {
    const raw = localStorage.getItem(CHECKIN_STORAGE_KEY) || "{}";
    const o = JSON.parse(raw);
    return {
      startTime: typeof o.startTime === "number" ? o.startTime : null,
      totalElapsedSeconds: typeof o.totalElapsedSeconds === "number" ? o.totalElapsedSeconds : 0,
      sessionStartTime: typeof o.sessionStartTime === "number" ? o.sessionStartTime : null,
    };
  } catch {
    return { startTime: null, totalElapsedSeconds: 0, sessionStartTime: null };
  }
}

function setCheckinState(state) {
  localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(state));
}

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setupDashboard() {
  const timerEl = qs("#dashboardTimer");
  const checkInBtn = qs("#checkInBtn");
  const resumeBtn = qs("#resumeBtn");
  const checkOutBtn = qs("#checkOutBtn");
  const msgEl = qs("#dashboardMsg");
  const tab = qs("#tab-dashboard");
  if (!tab || !timerEl) return;

  tab.style.display = "block";

  let tickInterval = null;

  function setMsg(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.className = "msg" + (kind ? " " + kind : "");
  }

  function currentElapsed() {
    const state = getCheckinState();
    let total = state.totalElapsedSeconds;
    if (state.startTime) total += (Date.now() - state.startTime) / 1000;
    return total;
  }

  function render() {
    const sec = currentElapsed();
    timerEl.textContent = formatTimer(sec);
  }

  function savePause() {
    const state = getCheckinState();
    if (state.startTime) {
      state.totalElapsedSeconds += (Date.now() - state.startTime) / 1000;
      state.startTime = null;
      setCheckinState(state);
    }
  }

  function applyButtons() {
    const state = getCheckinState();
    const running = state.startTime != null;
    checkInBtn.style.display = !state.sessionStartTime && !running ? "inline-flex" : "none";
    resumeBtn.style.display = state.sessionStartTime != null && !running ? "inline-flex" : "none";
    checkOutBtn.style.display = running ? "inline-flex" : "none";
  }

  checkInBtn?.addEventListener("click", () => {
    const now = Date.now();
    setCheckinState({ startTime: now, totalElapsedSeconds: 0, sessionStartTime: now });
    applyButtons();
    if (!tickInterval) tickInterval = setInterval(render, 1000);
    render();
    setMsg("", "");
  });

  resumeBtn?.addEventListener("click", () => {
    const state = getCheckinState();
    setCheckinState({ ...state, startTime: Date.now() });
    applyButtons();
    if (!tickInterval) tickInterval = setInterval(render, 1000);
    render();
    setMsg("", "");
  });

  checkOutBtn?.addEventListener("click", async () => {
    savePause();
    const state = getCheckinState();
    const sessionStart = state.sessionStartTime || Date.now();
    const endTime = Date.now();
    const totalSeconds = state.totalElapsedSeconds;
    setCheckinState({ startTime: null, totalElapsedSeconds: 0, sessionStartTime: null });
    applyButtons();
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    render();
    setMsg("Saving…", "");
    try {
      const resp = await fetch("/api/crm/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          startTime: new Date(sessionStart).toISOString(),
          endTime: new Date(endTime).toISOString(),
          totalSeconds: Math.round(totalSeconds),
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) setMsg("Session saved.", "ok");
      else setMsg(data.message || "Failed to save", "error");
    } catch (e) {
      setMsg(e.message || "Failed to save session", "error");
    }
  });

  window.addEventListener("beforeunload", () => {
    if (sessionStorage.getItem("uptura_checkin_navigating")) {
      sessionStorage.removeItem("uptura_checkin_navigating");
      return;
    }
    sessionStorage.setItem("uptura_checkin_refresh", String(Date.now()));
  });

  if (getCheckinState().startTime) {
    const returning = sessionStorage.getItem("uptura_checkin_returning");
    const refreshAt = sessionStorage.getItem("uptura_checkin_refresh");
    if (returning) sessionStorage.removeItem("uptura_checkin_returning");
    else if (refreshAt) {
      const age = Date.now() - Number(refreshAt);
      if (age < 2500) sessionStorage.removeItem("uptura_checkin_refresh");
    } else savePause();
  }

  applyButtons();
  render();
  if (getCheckinState().startTime) {
    if (!tickInterval) tickInterval = setInterval(render, 1000);
  }

  const tbody = qs("#dashboardAttendanceTbody");
  const emptyEl = qs("#dashboardAttendanceEmpty");
  const loadingEl = qs("#dashboardAttendanceLoading");
  const refreshBtn = qs("#refreshAttendanceBtn");

  function formatHours(seconds) {
    if (seconds == null) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  async function loadAttendance() {
    if (!tbody || !emptyEl || !loadingEl) return;
    loadingEl.style.display = "flex";
    emptyEl.style.display = "none";
    tbody.innerHTML = "";
    try {
      const resp = await fetch("/api/crm/attendance", { headers: authHeader() });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.message || "Failed to load");
      const sessions = data.sessions || [];
      loadingEl.style.display = "none";
      if (!sessions.length) {
        emptyEl.style.display = "block";
        return;
      }
      for (const s of sessions) {
        const start = s.startTime ? new Date(s.startTime) : null;
        const end = s.endTime ? new Date(s.endTime) : null;
        const dateStr = start ? start.toLocaleDateString() : "—";
        const checkInStr = start ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const checkOutStr = end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const tr = document.createElement("tr");
        const remarkCell = document.createElement("td");
        const remarkInput = document.createElement("input");
        remarkInput.type = "text";
        remarkInput.placeholder = "Add remark…";
        remarkInput.value = s.remark || "";
        remarkInput.style.width = "100%";
        remarkInput.style.padding = "6px 8px";
        const saveRemarkBtn = document.createElement("button");
        saveRemarkBtn.className = "btn";
        saveRemarkBtn.textContent = "Save";
        saveRemarkBtn.style.marginLeft = "6px";
        saveRemarkBtn.addEventListener("click", async () => {
          saveRemarkBtn.disabled = true;
          saveRemarkBtn.textContent = "…";
          try {
            const r = await fetch(`/api/crm/attendance?id=${encodeURIComponent(s.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...authHeader() },
              body: JSON.stringify({ remark: remarkInput.value.trim() }),
            });
            const d = await r.json();
            if (r.ok && d.success) saveRemarkBtn.textContent = "Saved";
            else throw new Error(d.message);
          } catch (e) {
            saveRemarkBtn.textContent = "Save";
            alert(e.message || "Failed to save remark");
          } finally {
            saveRemarkBtn.disabled = false;
            setTimeout(() => (saveRemarkBtn.textContent = "Save"), 1500);
          }
        });
        remarkCell.appendChild(remarkInput);
        remarkCell.appendChild(saveRemarkBtn);
        tr.innerHTML = `
          <td>${escapeHtml(dateStr)}</td>
          <td>${escapeHtml(checkInStr)}</td>
          <td>${escapeHtml(checkOutStr)}</td>
          <td>${formatHours(s.totalSeconds)}</td>
        `;
        tr.appendChild(remarkCell);
        tbody.appendChild(tr);
      }
    } catch (e) {
      loadingEl.style.display = "none";
      emptyEl.style.display = "block";
      emptyEl.textContent = e.message || "Failed to load.";
    }
  }

  refreshBtn?.addEventListener("click", loadAttendance);
  loadAttendance();
}

function setupAttendance() {
  const tbody = qs("#attendanceAllTbody");
  const emptyEl = qs("#attendanceAllEmpty");
  const loadingEl = qs("#attendanceAllLoading");
  const tab = qs("#tab-attendance");
  if (!tbody || !emptyEl || !loadingEl || !tab) return;

  tab.style.display = "block";

  function formatHours(seconds) {
    if (seconds == null) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  async function load() {
    loadingEl.style.display = "flex";
    emptyEl.style.display = "none";
    tbody.innerHTML = "";
    try {
      const [attResp, empResp] = await Promise.all([
        fetch("/api/crm/attendance?all=1", { headers: authHeader() }),
        fetch("/api/crm/employees", { headers: authHeader() }),
      ]);
      const attData = attResp.ok ? await attResp.json() : {};
      const empData = empResp.ok ? await empResp.json() : {};
      if (!attResp.ok || !attData.success) throw new Error(attData.message || "Failed to load attendance");
      const sessions = attData.sessions || [];
      const employees = empData.employees || [];
      const users = await (async () => {
        try {
          const r = await fetch("/api/crm/user-management", { headers: authHeader() });
          const d = await r.json();
          return (r.ok && d.users) ? d.users : [];
        } catch { return []; }
      })();
      const emailToName = new Map();
      for (const e of employees) if (e.email) emailToName.set(e.email.toLowerCase(), e.name || e.email);
      for (const u of users) if (u.email) emailToName.set(u.email.toLowerCase(), u.name || u.email);
      loadingEl.style.display = "none";
      if (!sessions.length) {
        emptyEl.style.display = "block";
        return;
      }
      for (const s of sessions) {
        const start = s.startTime ? new Date(s.startTime) : null;
        const end = s.endTime ? new Date(s.endTime) : null;
        const dateStr = start ? start.toLocaleDateString() : "—";
        const checkInStr = start ? start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const checkOutStr = end ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const email = (s.userEmail || "").toLowerCase();
        const name = emailToName.get(email) || s.userEmail || email || "—";
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(dateStr)}</td>
          <td><div style="font-weight:700">${escapeHtml(name)}</div><div class="muted" style="font-size:12px">${escapeHtml(email || "—")}</div></td>
          <td>${escapeHtml(checkInStr)}</td>
          <td>${escapeHtml(checkOutStr)}</td>
          <td>${formatHours(s.totalSeconds)}</td>
          <td>${escapeHtml(s.remark || "—")}</td>
        `;
        tbody.appendChild(tr);
      }
    } catch (e) {
      loadingEl.style.display = "none";
      emptyEl.style.display = "block";
      emptyEl.textContent = e.message || "Failed to load.";
    }
  }

  qs("#refreshAttendanceAllBtn")?.addEventListener("click", load);
  load();
}

function boot() {
  const page = getCurrentPage();

  setupSidebar();
  applyPageTitleFromBody();
  setupTopbarScroll();

  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("a[href]");
      if (a && a.href && a.href.startsWith(window.location.origin) && /crm/.test(a.getAttribute("href") || "")) {
        sessionStorage.setItem("uptura_checkin_navigating", "1");
        if ((a.getAttribute("href") || "").includes("dashboard")) sessionStorage.setItem("uptura_checkin_returning", "1");
      }
    },
    true
  );

  const logoutBtn = qs("#logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    clearSession();
    applyRoleUI("");
    showLoggedOutUI();
  });

  if (page === "clients") {
    qs("#clientSearch")?.addEventListener("input", () => renderClientsTable(clientsCache));
    qs("#refreshClientsBtn")?.addEventListener("click", refreshClients);
  }

  if (page === "clients") qs("#createClientForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#clientMsg");
    setMsg(msg, "", "");
    const payload = {
      name: qs("#clientName")?.value || "",
      email: qs("#clientEmail")?.value || "",
      phone: qs("#clientPhone")?.value || "",
      company: qs("#clientCompany")?.value || "",
      pipelineStatus: qs("#clientStatus")?.value || "lead",
    };
    try {
      await createClient(payload);
      setMsg(msg, "Client created.", "ok");
      e.target.reset();
      await refreshClients();
    } catch (err) {
      setMsg(msg, err.message || "Failed to create client", "error");
    }
  });

  if (page === "users") qs("#createUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#userMsg");
    setMsg(msg, "", "");
    const payload = {
      email: qs("#userEmail")?.value || "",
      password: qs("#userPassword")?.value || "",
      role: qs("#userRole")?.value || "employee",
      name: qs("#userName")?.value || "",
      employeeId: qs("#userEmployeeId")?.value || "",
    };
    try {
      const { userId } = await createUser(payload);
      const email = payload.email;
      const password = payload.password;
      const text = buildWelcomeMessage(email, password);
      msg.classList.add("ok");
      msg.innerHTML = `User created: ${userId} <button type="button" class="btn" id="copyUserCredsBtn" style="margin-left:8px; padding:6px 10px; font-size:12px;">Copy welcome message</button>`;

      const copyBtn = qs("#copyUserCredsBtn");
      copyBtn?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          msg.textContent = `User created: ${userId} (welcome message copied)`;
        } catch {
          msg.textContent = `User created: ${userId}. Copy failed — please copy manually:\n\n${text}`;
        }
      }, { once: true });

      e.target.reset();
      await refreshUsers();
    } catch (err) {
      setMsg(msg, err.message || "Failed to create user", "error");
    }
  });

  if (page === "employees") qs("#createEmployeeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#empMsg");
    setMsg(msg, "", "");
    const payload = {
      name: qs("#empName")?.value || "",
      email: qs("#empEmail")?.value || "",
      phone: qs("#empPhone")?.value || "",
      role: qs("#empRole")?.value || "",
      dailyHours: qs("#empHours")?.value || "",
      onboardingStatus: qs("#empOnboarding")?.value || "pending",
    };
    try {
      const result = await createEmployee(payload);
      const text = buildEmployeeWelcomeMessage(payload.name, payload.email);
      msg.classList.add("ok");
      msg.innerHTML = `Employee added: ${result.id} <button type="button" class="btn" id="copyEmployeeMsgBtn" style="margin-left:8px; padding:6px 10px; font-size:12px;">Copy welcome message</button>`;

      const copyBtn = qs("#copyEmployeeMsgBtn");
      copyBtn?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text);
          msg.textContent = `Employee added: ${result.id} (welcome message copied)`;
        } catch {
          msg.textContent = `Employee added: ${result.id}. Copy failed — please copy manually:\n\n${text}`;
        }
      }, { once: true });

      e.target.reset();
      await refreshEmployees();
    } catch (err) {
      setMsg(msg, err.message || "Failed to add employee", "error");
    }
  });

  if (page === "applicants") qs("#createApplicantForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#appMsg");
    setMsg(msg, "", "");
    const payload = {
      name: qs("#appName")?.value || "",
      email: qs("#appEmail")?.value || "",
      role: qs("#appRole")?.value || "",
      stage: qs("#appStage")?.value || "applied",
      source: qs("#appSource")?.value || "",
    };
    try {
      await createApplicant(payload);
      setMsg(msg, "Applicant added.", "ok");
      e.target.reset();
      await refreshApplicants();
    } catch (err) {
      setMsg(msg, err.message || "Failed to add applicant", "error");
    }
  });

  if (page === "meetings") {
    qs("#refreshMeetingsBtn")?.addEventListener("click", refreshMeetings);
    qs("#createMeetingForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#meetMsg");
      setMsg(msg, "", "");
      const relatedType = qs("#meetRelatedType")?.value || "";
      const relatedId = qs("#meetRelatedId")?.value || "";
      const payload = {
        title: qs("#meetTitle")?.value || "",
        scheduledAt: qs("#meetWhen")?.value ? new Date(qs("#meetWhen").value).toISOString() : null,
        relatedType,
        relatedId,
        status: qs("#meetStatus")?.value || "scheduled",
        notes: qs("#meetNotes")?.value || "",
      };
      try {
        await createMeeting(payload);
        setMsg(msg, "Meeting created.", "ok");
        e.target.reset();
        await refreshMeetings();
      } catch (err) {
        setMsg(msg, err.message || "Failed to create meeting", "error");
      }
    });
  }

  if (page === "sales") {
    qs("#refreshSalesBtn")?.addEventListener("click", refreshSales);
    qs("#createSaleForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#saleMsg");
      setMsg(msg, "", "");
      const payload = {
        clientId: qs("#saleClientId")?.value || "",
        agentEmail: qs("#saleAgentEmail")?.value || "",
        amount: qs("#saleAmount")?.value || "",
        stage: qs("#saleStage")?.value || "lead",
        notes: qs("#saleNotes")?.value || "",
      };
      try {
        await createSale(payload);
        setMsg(msg, "Deal created.", "ok");
        e.target.reset();
        await refreshSales();
      } catch (err) {
        setMsg(msg, err.message || "Failed to create deal", "error");
      }
    });
  }

  if (page === "invoices") {
    qs("#refreshInvoicesBtn")?.addEventListener("click", refreshInvoices);
    qs("#createInvoiceForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#invMsg");
      setMsg(msg, "", "");
      const payload = {
        clientId: qs("#invClientId")?.value || "",
        amount: qs("#invAmount")?.value || "",
        status: qs("#invStatus")?.value || "draft",
        dueDate: qs("#invDue")?.value || "",
        notes: qs("#invNotes")?.value || "",
      };
      try {
        await createInvoice(payload);
        setMsg(msg, "Invoice created.", "ok");
        e.target.reset();
        await refreshInvoices();
      } catch (err) {
        setMsg(msg, err.message || "Failed to create invoice", "error");
      }
    });
  }

  if (page === "reports") {
    qs("#refreshReportsBtn")?.addEventListener("click", refreshReports);
  }

  qs("#loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = qs("#loginError");
    setMsg(errEl, "", "");
    const btn = qs("#loginBtn");
    btn.disabled = true;
    btn.innerHTML = `<span>Logging in...</span>`;
    try {
      const email = qs("#loginEmail").value;
      const password = qs("#loginPassword").value;
      const data = await crmLogin(email, password);
      setSession({ token: data.token, role: data.role, userId: data.userId, email });
      applyRoleUI(data.role);
      showLoggedInUI();
      if (data.role === "employee") {
        window.location.href = "crm-dashboard.html";
        return;
      }
      switchTab("clients");
      await refreshClients();
    } catch (err) {
      errEl.style.display = "block";
      errEl.textContent = err.message || "Login failed";
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>Login</span><i class="fa-solid fa-arrow-right"></i>`;
    }
  });

  // Session restore
  const session = getSession();
  if (session?.token) {
    applyRoleUI(session.role);
    showLoggedInUI();
    if (page === "clients") refreshClients();
    if (page === "meetings") refreshMeetings();
    if (page === "employees") refreshEmployees();
    if (page === "applicants") refreshApplicants();
    if (page === "sales") refreshSales();
    if (page === "invoices") refreshInvoices();
    if (page === "reports") refreshReports();
    if (page === "users") refreshUsers();
    if (page === "chat") setupChat();
    if (page === "dashboard") setupDashboard();
    if (page === "attendance") setupAttendance();
  } else {
    showLoggedOutUI();
  }

  // Login card entrance animation (like admin.html)
  if (window.gsap) {
    window.gsap.to("#loginCard", { opacity: 1, y: 0, duration: 1, ease: "expo.out" });
  }
}

document.addEventListener("DOMContentLoaded", boot);

