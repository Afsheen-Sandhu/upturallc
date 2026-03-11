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

  if (page === "dashboard" && role !== "employee") {
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
    // Non-employees never see the Dashboard link
    document.querySelectorAll('a[href="crm-dashboard.html"]').forEach((el) => {
      el.style.display = "none";
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

async function deleteClient(id) {
  const resp = await fetch(`/api/crm/clients?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete client");
  return true;
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

function buildUserEmailMap(list) {
  for (const u of list || []) {
    if (u.id && u.email) {
      userEmailById[String(u.id)] = String(u.email);
    }
  }
}

async function primeUsersForCreatorLabels() {
  const session = getSession();
  const role = session?.role || "";
  if (role !== "super_admin" && role !== "admin") return;
  if (Object.keys(userEmailById).length) return;
  try {
    const users = await fetchUsers();
    usersCache = users;
    buildUserEmailMap(users);
  } catch {
    // non-fatal: creator labels will just fall back to createdByEmail / —
  }
}

function getCreatorEmail(item) {
  if (!item) return "—";
  if (item.createdByEmail) return item.createdByEmail;
  if (item.createdBy && userEmailById[item.createdBy]) return userEmailById[item.createdBy];
  return "—";
}

function buildWelcomeMessage(email, password) {
  return `Welcome to Uptura! 

We have onboarded you as a Business Development Agent. Your account details are:

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

async function deleteEmployee(id) {
  const resp = await fetch(`/api/crm/employees?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete employee");
  return true;
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

async function deleteApplicant(id) {
  const resp = await fetch(`/api/crm/applicants?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete applicant");
  return true;
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

async function updateMeeting(id, patch) {
  const resp = await fetch(`/api/crm/meetings?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update meeting");
  return data.meeting;
}

async function deleteMeeting(id) {
  const resp = await fetch(`/api/crm/meetings?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete meeting");
  return true;
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

async function updateSale(id, patch) {
  const resp = await fetch(`/api/crm/sales?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update deal");
  return data.sale;
}

async function deleteSale(id) {
  const resp = await fetch(`/api/crm/sales?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete deal");
  return true;
}

async function fetchInvoices() {
  const resp = await fetch("/api/crm/invoices", { headers: { ...authHeader() } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to fetch invoices");
  return data.invoices || [];
}

async function updateUser(id, patch) {
  const resp = await fetch(`/api/crm/user-management?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update user");
  return data.user;
}

async function deleteUser(id) {
  const resp = await fetch(`/api/crm/user-management?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete user");
  return true;
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

async function updateInvoice(id, patch) {
  const resp = await fetch(`/api/crm/invoices?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(patch),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to update invoice");
  return data.invoice;
}

async function deleteInvoice(id) {
  const resp = await fetch(`/api/crm/invoices?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader() },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.success) throw new Error(data.message || "Failed to delete invoice");
  return true;
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
  const filter = qs("#filterClientStatus")?.value || "all";

  const filtered = clients.filter((c) => {
    const matchesSearch = !search || `${c.name || ""} ${c.email || ""} ${c.company || ""}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || c.pipelineStatus === filter;
    return matchesSearch && matchesFilter;
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
      saveBtn.textContent = "…";
      const name = tr.querySelector(".client-name").value;
      const company = tr.querySelector(".client-company").value;
      const email = tr.querySelector(".client-email").value;
      const phone = tr.querySelector(".client-phone").value;
      try {
        await updateClient(c.id, {
          name,
          company,
          email,
          phone,
          pipelineStatus: statusSelect.value
        });
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Update failed");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this client?")) return;
      delBtn.disabled = true;
      try {
        await deleteClient(c.id);
        tr.remove();
        clientsCache = clientsCache.filter(item => item.id !== c.id);
        if (!clientsCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><input class="field client-name" style="font-weight:900; background:transparent; border:none; padding:4px;" value="${escapeHtml(c.name || "")}" /></td>
      <td><input class="field client-company" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(c.company || "")}" /></td>
      <td><input class="field client-email" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(c.email || "")}" /></td>
      <td><input class="field client-phone" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(c.phone || "")}" /></td>
      <td class="td-status"></td>
      <td>${escapeHtml(getCreatorEmail(c))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-status").appendChild(statusSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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
let reportCharts = {};
let usersCache = [];
const userEmailById = {};

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
  if (!tbody || !empty) return;

  const search = (qs("#empSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterEmpStatus")?.value || "all";

  const filtered = list.filter((e) => {
    const matchesSearch = !search || `${e.name || ""} ${e.email || ""} ${e.role || ""}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || e.onboardingStatus === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const emp of filtered) {
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

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const name = tr.querySelector(".emp-name").value;
      const email = tr.querySelector(".emp-email").value;
      const role = tr.querySelector(".emp-role").value;
      const dailyHours = tr.querySelector(".emp-hours").value;
      try {
        const updated = await updateEmployee(emp.id, {
          name,
          email,
          role,
          dailyHours,
          onboardingStatus: onboardingSelect.value
        });
        Object.assign(emp, updated);
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this employee?")) return;
      delBtn.disabled = true;
      try {
        await deleteEmployee(emp.id);
        tr.remove();
        employeesCache = employeesCache.filter(e => e.id !== emp.id);
        if (!employeesCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    const startedBtn = document.createElement("button");
    startedBtn.className = "btn";
    startedBtn.textContent = emp.startedWorking ? "Started" : "Started Working";
    startedBtn.disabled = !!emp.startedWorking;
    startedBtn.style.padding = "8px 10px";

    startedBtn.addEventListener("click", async () => {
      if (emp.startedWorking) return;
      startedBtn.disabled = true;
      startedBtn.textContent = "…";
      try {
        const updated = await updateEmployee(emp.id, { markStartedWorking: true });
        Object.assign(emp, updated);
        renderEmployeesTable(employeesCache);
      } catch (e) {
        alert(e.message || "Failed to update");
        startedBtn.textContent = "Started Working";
        startedBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><input class="field emp-name" style="font-weight:900; background:transparent; border:none; padding:4px;" value="${escapeHtml(emp.name || "")}" /></td>
      <td><input class="field emp-email" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(emp.email || "")}" /></td>
      <td><input class="field emp-role" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(emp.role || "")}" /></td>
      <td><input class="field emp-hours" type="number" style="background:transparent; border:none; padding:4px;" value="${emp.dailyHours || ""}" /></td>
      <td class="td-onboarding"></td>
      <td class="td-started"></td>
      <td>${escapeHtml(getCreatorEmail(emp))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-onboarding").appendChild(onboardingSelect);
    tr.querySelector(".td-started").appendChild(startedBtn);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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
  if (!tbody || !empty) return;

  const search = (qs("#appSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterAppStage")?.value || "all";

  const filtered = list.filter((a) => {
    const matchesSearch = !search || `${a.name || ""} ${a.email || ""} ${a.role || ""}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || a.stage === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const app of filtered) {
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

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const name = tr.querySelector(".app-name").value;
      const email = tr.querySelector(".app-email").value;
      const role = tr.querySelector(".app-role").value;
      const source = tr.querySelector(".app-source").value;
      try {
        const updated = await updateApplicant(app.id, {
          name,
          email,
          role,
          source,
          stage: stageSelect.value
        });
        Object.assign(app, updated);
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this applicant?")) return;
      delBtn.disabled = true;
      try {
        await deleteApplicant(app.id);
        tr.remove();
        applicantsCache = applicantsCache.filter(a => a.id !== app.id);
        if (!applicantsCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><input class="field app-name" style="font-weight:900; background:transparent; border:none; padding:4px;" value="${escapeHtml(app.name || "")}" /></td>
      <td><input class="field app-email" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(app.email || "")}" /></td>
      <td><input class="field app-role" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(app.role || "")}" /></td>
      <td class="td-stage"></td>
      <td><input class="field app-source" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(app.source || "")}" /></td>
      <td>${escapeHtml(getCreatorEmail(app))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-stage").appendChild(stageSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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

  const search = (qs("#meetSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterMeetStatus")?.value || "all";

  const filtered = list.filter((m) => {
    const matchesSearch = !search || `${m.title || ""} ${m.relatedType || ""} ${m.relatedId || ""} ${getCreatorEmail(m)}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const m of filtered) {
    const tr = document.createElement("tr");

    const statusSelect = document.createElement("select");
    statusSelect.style.padding = "8px 10px";
    statusSelect.style.borderRadius = "10px";
    statusSelect.style.border = "1px solid var(--border)";
    const statuses = ["scheduled", "completed", "cancelled"];
    for (const st of statuses) {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      if (m.status === st) opt.selected = true;
      statusSelect.appendChild(opt);
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const title = tr.querySelector(".meet-title").value;
      const scheduledAt = tr.querySelector(".meet-when").value;
      try {
        const updated = await updateMeeting(m.id, {
          title,
          scheduledAt,
          status: statusSelect.value
        });
        Object.assign(m, updated);
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this meeting?")) return;
      delBtn.disabled = true;
      try {
        await deleteMeeting(m.id);
        tr.remove();
        meetingsCache = meetingsCache.filter(item => item.id !== m.id);
        if (!meetingsCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    const whenVal = m.scheduledAt ? new Date(m.scheduledAt).toISOString().slice(0, 16) : "";

    tr.innerHTML = `
      <td><input class="field meet-title" style="font-weight:900; background:transparent; border:none; padding:4px;" value="${escapeHtml(m.title || "")}" /></td>
      <td><input class="field meet-when" type="datetime-local" style="background:transparent; border:none; padding:4px;" value="${whenVal}" /></td>
      <td class="td-status"></td>
      <td>${escapeHtml(m.relatedType && m.relatedId ? `${m.relatedType}:${m.relatedId}` : "—")}</td>
      <td>${escapeHtml(getCreatorEmail(m))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-status").appendChild(statusSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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

  const search = (qs("#saleSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterSaleStage")?.value || "all";

  const filtered = list.filter((s) => {
    const matchesSearch = !search || `${s.agentEmail || ""} ${s.clientId || ""} ${s.amount || ""} ${getCreatorEmail(s)}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || s.stage === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const s of filtered) {
    const tr = document.createElement("tr");

    const stageSelect = document.createElement("select");
    stageSelect.style.padding = "8px 10px";
    stageSelect.style.borderRadius = "10px";
    stageSelect.style.border = "1px solid var(--border)";
    const stages = ["lead", "proposal_sent", "negotiation", "won", "lost"];
    for (const st of stages) {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st.replace(/_/g, " ").charAt(0).toUpperCase() + st.replace(/_/g, " ").slice(1);
      if (s.stage === st) opt.selected = true;
      stageSelect.appendChild(opt);
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const agentEmail = tr.querySelector(".sale-agent").value;
      const clientId = tr.querySelector(".sale-client").value;
      const amount = tr.querySelector(".sale-amount").value;
      try {
        const updated = await updateSale(s.id, {
          agentEmail,
          clientId,
          amount,
          stage: stageSelect.value
        });
        Object.assign(s, updated);
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this deal?")) return;
      delBtn.disabled = true;
      try {
        await deleteSale(s.id);
        tr.remove();
        salesCache = salesCache.filter(item => item.id !== s.id);
        if (!salesCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><input class="field sale-agent" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(s.agentEmail || "")}" /></td>
      <td><input class="field sale-client" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(s.clientId || "")}" /></td>
      <td><input class="field sale-amount" type="number" step="0.01" style="background:transparent; border:none; padding:4px;" value="${s.amount != null ? s.amount : ""}" /></td>
      <td class="td-stage"></td>
      <td>${escapeHtml(getCreatorEmail(s))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-stage").appendChild(stageSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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

  const search = (qs("#invSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterInvStatus")?.value || "all";

  const filtered = list.filter((inv) => {
    const matchesSearch = !search || `${inv.clientId || ""} ${inv.amount || ""} ${inv.notes || ""} ${getCreatorEmail(inv)}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const inv of filtered) {
    const tr = document.createElement("tr");

    const statusSelect = document.createElement("select");
    statusSelect.style.padding = "8px 10px";
    statusSelect.style.borderRadius = "10px";
    statusSelect.style.border = "1px solid var(--border)";
    const statuses = ["draft", "sent", "paid", "void"];
    for (const st of statuses) {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      if (inv.status === st) opt.selected = true;
      statusSelect.appendChild(opt);
    }

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const clientId = tr.querySelector(".inv-client").value;
      const amount = tr.querySelector(".inv-amount").value;
      const dueDate = tr.querySelector(".inv-due").value;
      try {
        const updated = await updateInvoice(inv.id, {
          clientId,
          amount,
          dueDate,
          status: statusSelect.value
        });
        Object.assign(inv, updated);
        saveBtn.textContent = "Saved";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this invoice?")) return;
      delBtn.disabled = true;
      try {
        await deleteInvoice(inv.id);
        tr.remove();
        invoicesCache = invoicesCache.filter(item => item.id !== inv.id);
        if (!invoicesCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td><input class="field inv-client" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(inv.clientId || "")}" /></td>
      <td><input class="field inv-amount" type="number" step="0.01" style="background:transparent; border:none; padding:4px;" value="${inv.amount != null ? inv.amount : ""}" /></td>
      <td class="td-status"></td>
      <td><input class="field inv-due" type="date" style="background:transparent; border:none; padding:4px;" value="${inv.dueDate || ""}" /></td>
      <td>${escapeHtml(getCreatorEmail(inv))}</td>
      <td class="td-action" style="display:flex; gap:6px;"></td>
    `;

    tr.querySelector(".td-status").appendChild(statusSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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

  const r = reports || {};
  const pipeline = r.clientPipeline || {};
  const employees = r.employees || {};
  const applicants = r.applicants || {};
  const invoices = r.invoices || {};
  const sales = r.sales || {};
  const meetings = r.meetings || {};

  // Stat Cards
  grid.appendChild(statCard("Clients (total)", Object.values(pipeline).reduce((a, b) => a + (Number(b) || 0), 0)));
  grid.appendChild(statCard("Employees (total)", employees.total ?? 0));
  grid.appendChild(statCard("Employees onboarded", employees.onboarded ?? 0));
  grid.appendChild(statCard("Applicants (total)", applicants.total ?? 0));

  grid.appendChild(statCard("Pipeline: Lead", pipeline.lead ?? 0));
  grid.appendChild(statCard("Pipeline: Proposal", pipeline.proposal_sent ?? 0));
  grid.appendChild(statCard("Pipeline: Active", pipeline.active ?? 0));
  grid.appendChild(statCard("Pipeline: Completed", pipeline.completed ?? 0));

  grid.appendChild(statCard("Meetings", meetings.total ?? 0));
  grid.appendChild(statCard("Sales (count)", sales.total ?? 0));
  grid.appendChild(statCard("Invoices (total)", invoices.total ?? 0));
  grid.appendChild(statCard("Invoices paid", invoices.byStatus?.paid ?? 0));

  if (!window.Chart) return;

  // Destroy old charts
  Object.values(reportCharts).forEach(c => c.destroy());

  // 1. Pipeline Distribution (Horizontal Bar)
  const ctxP = document.getElementById('pipelineChart')?.getContext('2d');
  if (ctxP) {
    reportCharts.pipeline = new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: Object.keys(pipeline).map(s => s.replace('_', ' ')),
        datasets: [{
          label: 'Clients',
          data: Object.values(pipeline),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } }
      }
    });
  }

  // 2. Invoice Status (Donut)
  const ctxI = document.getElementById('invoiceChart')?.getContext('2d');
  if (ctxI) {
    const invData = invoices.byStatus || {};
    reportCharts.invoice = new Chart(ctxI, {
      type: 'doughnut',
      data: {
        labels: Object.keys(invData),
        datasets: [{
          data: Object.values(invData),
          backgroundColor: [
            'rgba(148, 163, 184, 0.6)', // draft
            'rgba(59, 130, 246, 0.6)', // sent
            'rgba(34, 197, 94, 0.6)',  // paid
            'rgba(239, 68, 68, 0.6)'   // void
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        },
        cutout: '70%'
      }
    });
  }

  // 3. Activity Breakdown (Radar or Polar Area looks premium)
  const ctxA = document.getElementById('activityChart')?.getContext('2d');
  if (ctxA) {
    reportCharts.activity = new Chart(ctxA, {
      type: 'polarArea',
      data: {
        labels: ['Meetings', 'Sales', 'Applicants', 'Employees'],
        datasets: [{
          data: [meetings.total || 0, sales.total || 0, applicants.total || 0, employees.total || 0],
          backgroundColor: [
            'rgba(245, 158, 11, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { r: { ticks: { display: false } } }
      }
    });
  }
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

  const search = (qs("#userSearch")?.value || "").toLowerCase().trim();
  const filter = qs("#filterUserRole")?.value || "all";

  const filtered = list.filter((u) => {
    const matchesSearch = !search || `${u.email || ""} ${u.name || ""} ${u.role || ""}`.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || u.role === filter;
    return matchesSearch && matchesFilter;
  });

  tbody.innerHTML = "";
  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const u of filtered) {
    const tr = document.createElement("tr");

    const roleSelect = document.createElement("select");
    roleSelect.style.padding = "8px 10px";
    roleSelect.style.borderRadius = "10px";
    roleSelect.style.border = "1px solid var(--border)";
    const roles = ["super_admin", "admin", "manager", "employee", "hr"];
    for (const r of roles) {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      if (u.role === r) opt.selected = true;
      roleSelect.appendChild(opt);
    }

    const statusSelect = document.createElement("select");
    statusSelect.style.padding = "8px 10px";
    statusSelect.style.borderRadius = "10px";
    statusSelect.style.border = "1px solid var(--border)";
    [{ v: false, l: "Active" }, { v: true, l: "Disabled" }].forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.v;
      opt.textContent = o.l;
      if (!!u.disabled === o.v) opt.selected = true;
      statusSelect.appendChild(opt);
    });

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save";
    saveBtn.style.padding = "8px 10px";
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "…";
      const name = tr.querySelector(".user-name").value;
      const employeeId = tr.querySelector(".user-emp-id").value;
      const pwd = tr.querySelector(".user-pwd").value;
      try {
        const patch = {
          name,
          employeeId,
          role: roleSelect.value,
          disabled: statusSelect.value === "true"
        };
        if (pwd) patch.password = pwd;
        const updated = await updateUser(u.id, patch);
        Object.assign(u, updated);
        saveBtn.textContent = "Saved";
        tr.querySelector(".user-pwd").value = "";
        setTimeout(() => (saveBtn.textContent = "Save"), 1000);
      } catch (e) {
        alert(e.message || "Failed to update");
        saveBtn.textContent = "Save";
      } finally {
        saveBtn.disabled = false;
      }
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.style.padding = "8px";
    delBtn.style.color = "#ff3c00";
    delBtn.addEventListener("click", async () => {
      if (!confirm(`Delete user ${u.email}?`)) return;
      delBtn.disabled = true;
      try {
        await deleteUser(u.id);
        tr.remove();
        usersCache = usersCache.filter(item => item.id !== u.id);
        if (!usersCache.length) empty.style.display = "block";
      } catch (e) {
        alert(e.message || "Failed to delete");
        delBtn.disabled = false;
      }
    });

    tr.innerHTML = `
      <td>${escapeHtml(u.email || "—")}</td>
      <td><input class="field user-name" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(u.name || "")}" /></td>
      <td class="td-role"></td>
      <td><input class="field user-emp-id" style="background:transparent; border:none; padding:4px;" value="${escapeHtml(u.employeeId || "")}" /></td>
      <td class="td-status"></td>
      <td class="td-action" style="display:flex; gap:6px; align-items:center;">
        <input class="field user-pwd" type="password" placeholder="Reset pwd" style="width:80px; font-size:10px; padding:4px;" />
      </td>
    `;

    tr.querySelector(".td-role").appendChild(roleSelect);
    tr.querySelector(".td-status").appendChild(statusSelect);
    const actionTd = tr.querySelector(".td-action");
    actionTd.appendChild(saveBtn);
    actionTd.appendChild(delBtn);

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
        t.type === "direct" &&
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
    if (!threads.length) {
      threadsEl.innerHTML = '<div class="muted" style="padding:10px;">No conversations yet.</div>';
      return;
    }
    for (const t of threads) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-thread" + (activeChatId === t.id ? " active" : "");

      let title = t.name || (t.type === 'group' ? "Unnamed Group" : "Direct Chat");
      let sub = "";
      if (t.type === "direct") {
        const others = (t.participantEmails || []).filter(e => e !== myEmail);
        title = others[0] || title;
        sub = "One-on-one";
      } else {
        sub = `${(t.participantEmails || []).length} participants`;
      }

      btn.innerHTML = `<div class="chat-thread-title">${escapeHtml(title)}</div><div class="chat-thread-sub">${escapeHtml(sub)}</div>`;
      btn.addEventListener("click", () => selectThread(t));
      threadsEl.appendChild(btn);
    }
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
    if (thread.type === "group") {
      activeTitle.textContent = thread.name || "Group Chat";
      activeMeta.textContent = (thread.participantEmails || []).length + " members";
    } else {
      const others = (thread.participantEmails || []).filter((e) => e !== myEmail);
      const otherEmail = others[0] || "";
      activeTitle.textContent = thread.name ? `Chat with ${thread.name}` : (otherEmail ? `Chat with ${otherEmail}` : "Conversation");
      activeMeta.textContent = otherEmail;
    }
    setMsg(msg, "", "");

    // Highlight active thread
    const all = threadsEl.querySelectorAll('.chat-thread');
    all.forEach(el => el.classList.remove('active'));
    for (const el of all) {
      // Small hack: identify by title or simplified comparison if possible.
      // Better: find by a stored data-id. But we can just use the fact that renderThreads will hit soon.
      // Actually, let's just re-render threadsList to be sure, or just leave it since Snapshot will likely trigger anyway on message send.
      // But if we just click, Snapshot might NOT trigger.
    }
    // Let's just re-run renderThreads with current list
    renderThreads(threadsList);

    if (unsubMessages) {
      try { unsubMessages(); } catch (_) { }
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

  // group chat UI
  const groupBtn = qs("#createGroupChatBtn");
  const groupModal = qs("#groupChatModal");
  const groupListEl = qs("#groupUsersList");
  const groupClose = qs("#closeGroupChatModal");
  const groupSubmit = qs("#submitGroupChat");
  const groupNameInput = qs("#groupName");
  const groupError = qs("#groupChatError");

  if (sessionRole === "admin" || sessionRole === "super_admin") {
    if (groupBtn) groupBtn.style.display = "inline-flex";
  }

  groupBtn?.addEventListener("click", () => {
    if (groupModal) groupModal.style.display = "flex";
  });
  groupClose?.addEventListener("click", () => {
    if (groupModal) groupModal.style.display = "none";
  });

  groupSubmit?.addEventListener("click", async () => {
    const name = (groupNameInput.value || "").trim();
    if (!name) return setMsg(groupError, "Group name required", "error");

    const checked = groupListEl.querySelectorAll('input:checked');
    const selectedEmails = Array.from(checked).map(i => i.value);
    if (!selectedEmails.length) return setMsg(groupError, "Select at least one user", "error");

    const participantEmails = Array.from(new Set([myEmail, ...selectedEmails])).sort();

    groupSubmit.disabled = true;
    groupSubmit.textContent = "Creating…";
    setMsg(groupError, "Creating group…", "");

    try {
      const docRef = await addDoc(chatsRef, {
        type: "group",
        name,
        participantEmails,
        createdAt: serverTimestamp(),
        createdBy: myEmail,
        updatedAt: serverTimestamp(),
      });
      groupModal.style.display = "none";
      groupNameInput.value = "";
      checked.forEach(i => i.checked = false);
      selectThread({ id: docRef.id, name, type: "group", participantEmails });
    } catch (err) {
      setMsg(groupError, err.message || "Failed to create group", "error");
    } finally {
      groupSubmit.disabled = false;
      groupSubmit.textContent = "Create Group Chat";
    }
  });

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
          if (groupListEl) groupListEl.innerHTML = "";
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

            if (groupListEl) {
              const lbl = document.createElement("label");
              lbl.style.display = "flex";
              lbl.style.alignItems = "center";
              lbl.style.gap = "8px";
              lbl.style.padding = "6px 4px";
              lbl.style.cursor = "pointer";
              lbl.innerHTML = `<input type="checkbox" value="${p.email}" /> <span style="font-size:13px; font-weight:600;">${escapeHtml(p.name || p.email)} <small style="color:var(--text-muted)">(${p.email})</small></span>`;
              groupListEl.appendChild(lbl);
            }
          }
        }
      } catch (_) { }
      if (conversationsLoader) conversationsLoader.style.display = "none";
    })();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(msg, "", "");
    const text = String(input.value || "").trim();
    if (!text) return;
    if (!activeChatId) return setMsg(msg, "Select a conversation first.", "error");

    // Clear immediately for snappier UX
    input.value = "";

    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text,
        senderEmail: myEmail,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "chats", activeChatId), { updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      // If it fails, we won't restore the text for now; user can retype
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
    qs("#filterClientStatus")?.addEventListener("change", () => renderClientsTable(clientsCache));
    qs("#refreshClientsBtn")?.addEventListener("click", refreshClients);
  }

  if (page === "clients") qs("#createClientForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#clientMsg");
    setMsg(msg, "Creating client…", "");
    toggleInlineLoader("clientsLoading", true);
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
    } finally {
      toggleInlineLoader("clientsLoading", false);
    }
  });

  if (page === "users") qs("#createUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#userMsg");
    setMsg(msg, "Creating user…", "");
    toggleInlineLoader("usersLoading", true);
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
    } finally {
      toggleInlineLoader("usersLoading", false);
    }
  });

  if (page === "users") {
    qs("#userSearch")?.addEventListener("input", () => renderUsersTable(usersCache));
    qs("#filterUserRole")?.addEventListener("change", () => renderUsersTable(usersCache));
    qs("#refreshUsersBtn")?.addEventListener("click", refreshUsers);
  }

  if (page === "employees") qs("#createEmployeeForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#empMsg");
    setMsg(msg, "Adding employee…", "");
    toggleInlineLoader("empLoading", true);
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
    } finally {
      toggleInlineLoader("empLoading", false);
    }
  });

  if (page === "employees") {
    qs("#empSearch")?.addEventListener("input", () => renderEmployeesTable(employeesCache));
    qs("#filterEmpStatus")?.addEventListener("change", () => renderEmployeesTable(employeesCache));
    qs("#refreshEmployeesBtn")?.addEventListener("click", refreshEmployees);
  }

  if (page === "applicants") qs("#createApplicantForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = qs("#appMsg");
    setMsg(msg, "Adding applicant…", "");
    toggleInlineLoader("appLoading", true);
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
    } finally {
      toggleInlineLoader("appLoading", false);
    }
  });

  if (page === "applicants") {
    qs("#appSearch")?.addEventListener("input", () => renderApplicantsTable(applicantsCache));
    qs("#filterAppStage")?.addEventListener("change", () => renderApplicantsTable(applicantsCache));
    qs("#refreshAppBtn")?.addEventListener("click", refreshApplicants);
  }

  if (page === "meetings") {
    qs("#meetSearch")?.addEventListener("input", () => renderMeetingsTable(meetingsCache));
    qs("#filterMeetStatus")?.addEventListener("change", () => renderMeetingsTable(meetingsCache));
    qs("#refreshMeetingsBtn")?.addEventListener("click", refreshMeetings);
    qs("#createMeetingForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#meetMsg");
      setMsg(msg, "Creating meeting…", "");
      toggleInlineLoader("meetLoading", true);
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
      } finally {
        toggleInlineLoader("meetLoading", false);
      }
    });
  }

  if (page === "sales") {
    qs("#saleSearch")?.addEventListener("input", () => renderSalesTable(salesCache));
    qs("#filterSaleStage")?.addEventListener("change", () => renderSalesTable(salesCache));
    qs("#refreshSalesBtn")?.addEventListener("click", refreshSales);
    qs("#createSaleForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#saleMsg");
      setMsg(msg, "Creating deal…", "");
      toggleInlineLoader("salesLoading", true);
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
      } finally {
        toggleInlineLoader("salesLoading", false);
      }
    });
  }

  if (page === "invoices") {
    qs("#invSearch")?.addEventListener("input", () => renderInvoicesTable(invoicesCache));
    qs("#filterInvStatus")?.addEventListener("change", () => renderInvoicesTable(invoicesCache));
    qs("#refreshInvoicesBtn")?.addEventListener("click", refreshInvoices);
    qs("#createInvoiceForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#invMsg");
      setMsg(msg, "Creating invoice…", "");
      toggleInlineLoader("invoicesLoading", true);
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
      } finally {
        toggleInlineLoader("invoicesLoading", false);
      }
    });

    document.getElementById("generatePdfBtn")?.addEventListener("click", () => {
      if (!window.jspdf) {
        alert("PDF generator not ready. Please check connection.");
        return;
      }

      // ── Collect form values ──────────────────────
      const clientName    = document.getElementById("pdfClientName")?.value.trim()    || "Client Name";
      const clientEmail   = document.getElementById("pdfClientEmail")?.value.trim()   || "";
      const dateVal       = document.getElementById("pdfDate")?.value                 || "";
      const timeVal       = document.getElementById("pdfTime")?.value                 || "";
      const serviceType   = document.getElementById("pdfService")?.value              || "Service";
      const servicePrice  = parseFloat(document.getElementById("pdfServicePrice")?.value) || 0;
      const serviceDur    = document.getElementById("pdfServiceDuration")?.value.trim()|| "1 Month";
      const description   = document.getElementById("pdfDescription")?.value.trim()   || "";

      // Line items
      const itemRows = document.querySelectorAll("#pdfItemsList .pdf-item-row");
      const lineItems = [];
      itemRows.forEach(row => {
        const name  = row.querySelector(".item-name")?.value.trim();
        const price = parseFloat(row.querySelector(".item-price")?.value) || 0;
        const dur   = row.querySelector(".item-dur")?.value.trim() || "1 Month";
        if (name) lineItems.push({ name, price, dur });
      });

      // Build all items including main service
      const allItems = [{ name: serviceType, price: servicePrice, dur: serviceDur, desc: description }, ...lineItems];
      const subtotal = allItems.reduce((s, i) => s + i.price, 0);

      // Invoice number & date
      const invoiceNum = "INV-" + Math.floor(1000 + Math.random() * 9000);
      const issueDate  = dateVal ? new Date(dateVal).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }) : new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
      const issueTime  = timeVal || new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

      const processPDF = (logoDataUrl, watermarkDataUrl, logoW, logoH) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const PW = doc.internal.pageSize.getWidth();   // 595
        const PH = doc.internal.pageSize.getHeight();  // 842

        // ── Colours & fonts ──────────────────────────
        const BRAND_ORANGE = [255, 90, 0]; // Brand orange
        const LIGHT_GREY = [242, 242, 242];
        const MUTED = [100, 100, 100];
        const TEXT = [0, 0, 0];
        const WHITE = [255, 255, 255];

        let cy = 40;

        // Draw Watermark (center of page)
        if (watermarkDataUrl) {
          const wmWidth = 400; // Large width for watermark
          const wmHeight = Math.floor(wmWidth * logoH / logoW);
          const wmX = (PW - wmWidth) / 2;
          const wmY = (PH - wmHeight) / 2; 
          doc.addImage(watermarkDataUrl, "PNG", wmX, wmY, wmWidth, wmHeight);
        }

        // Company Logo (Left side)
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", 40, cy, logoW, logoH);
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(36);
          doc.setTextColor(...BRAND_ORANGE);
          doc.text("Uptura", 40, cy + 25);
        }

        // Top Right Info
        doc.setFontSize(28);
        doc.setTextColor(...TEXT);
        doc.text("INVOICE", PW - 40, cy + 15, { align: "right" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("UPTURA LLC", PW - 40, cy + 35, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("1001 S. Main Street", PW - 40, cy + 47, { align: "right" });
        doc.text("Kalispell, MT 59901", PW - 40, cy + 59, { align: "right" });
        doc.text("United States", PW - 40, cy + 71, { align: "right" });
        doc.text("info@uptura.net", PW - 40, cy + 83, { align: "right" });
        
        cy = Math.max(cy + 105, cy + logoH + 20); // adapt based on logo height

        cy += 15;
        doc.setDrawColor(230, 230, 230);
        doc.line(40, cy, PW - 40, cy);
        cy += 20;

        // BILL TO (Left) & Invoice Meta (Right)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text("BILL TO", 40, cy);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text(clientName.toUpperCase(), 40, cy + 12);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (clientEmail) doc.text(clientEmail, 40, cy + 40);

        // Meta Right
        const rightColLabel = PW - 180;
        const rightColValue = PW - 40;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...TEXT);
        doc.text("Invoice Number:", rightColLabel, cy, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(invoiceNum, rightColValue, cy, { align: "right" });

        doc.setFont("helvetica", "bold");
        doc.text("Invoice Date:", rightColLabel, cy + 14, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(issueDate, rightColValue, cy + 14, { align: "right" });

        doc.setFont("helvetica", "bold");
        doc.text("Payment Due:", rightColLabel, cy + 28, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(issueDate, rightColValue, cy + 28, { align: "right" });

        // Amount Due highlighted
        doc.setFillColor(...LIGHT_GREY);
        doc.rect(PW - 260, cy + 34, 220, 16, "F");
        
        doc.setFont("helvetica", "bold");
        doc.text("Amount Due (USD):", rightColLabel, cy + 45, { align: "right" });
        doc.text("$" + subtotal.toFixed(2), rightColValue, cy + 45, { align: "right" });

        cy += 65;

        // TABLE HEADER (Orange band)
        const COL = { service: 45, fee: 400, amount: PW - 45 };
        const rowH = 22;

        doc.setFillColor(...BRAND_ORANGE);
        doc.rect(40, cy, PW - 80, rowH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...WHITE);
        doc.text("Services", COL.service, cy + 15);
        doc.text("Fee", COL.fee, cy + 15, { align: "right" });
        doc.text("Amount", COL.amount, cy + 15, { align: "right" });

        cy += rowH + 10;

        // TABLE ROWS
        doc.setTextColor(...TEXT);
        allItems.forEach((item, i) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(item.name, COL.service, cy);

          doc.setFont("helvetica", "normal");
          doc.text("$" + item.price.toFixed(2), COL.fee, cy, { align: "right" });
          doc.text("$" + item.price.toFixed(2), COL.amount, cy, { align: "right" });

          cy += 12;

          if (item.desc || item.dur) {
            doc.setFontSize(9);
            doc.setTextColor(...TEXT);
            let extra = item.desc ? item.desc : `Duration: ${item.dur}`;
            doc.text(extra, COL.service, cy);
            cy += 20;
          } else {
            cy += 8;
          }
        });

        // Bottom line
        cy += 5;
        doc.setDrawColor(230, 230, 230);
        doc.line(40, cy, PW - 40, cy);
        cy += 15;

        // TOTALS
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Total:", COL.fee, cy, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("$" + subtotal.toFixed(2), COL.amount, cy, { align: "right" });

        cy += 14;
        doc.setFont("helvetica", "bold");
        doc.text(`Payment on ${issueDate}:`, COL.fee, cy, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text("$0.00", COL.amount, cy, { align: "right" });

        cy += 10;
        doc.setDrawColor(230, 230, 230);
        doc.line(PW - 260, cy, PW - 40, cy);
        cy += 18;

        doc.setFont("helvetica", "bold");
        doc.text("Amount Due (USD):", COL.fee, cy, { align: "right" });
        doc.text("$" + subtotal.toFixed(2), COL.amount, cy, { align: "right" });

        cy += 50;

        // NOTES / TERMS
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Notes / Terms", 40, cy);
        doc.setFont("helvetica", "normal");
        
        cy += 14;
        doc.text(`Total Amount: $${subtotal.toFixed(2)}`, 40, cy);
        cy += 14;
        doc.text(`Service Fee: $0.00 (Non-refundable)`, 40, cy);

        // FOOTER
        const footerY = PH - 40;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...BRAND_ORANGE);
        doc.text("Powered by Uptura", PW / 2, footerY, { align: "center" });

        // ── SAVE ────────────────────────────────────
        doc.save(`Uptura-${invoiceNum}-${clientName.replace(/\s+/g, "-")}.pdf`);
      };

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = "images/logo-main.png";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");

        // Create dull watermark image
        const wCanvas = document.createElement("canvas");
        wCanvas.width = img.width;
        wCanvas.height = img.height;
        const wCtx = wCanvas.getContext("2d");
        wCtx.globalAlpha = 0.08; // Very light/faint 8% opacity
        wCtx.drawImage(img, 0, 0);
        const watermarkDataUrl = wCanvas.toDataURL("image/png");

        // Define larger logo size for header
        let targetW = 150;
        let targetH = Math.floor(150 * img.height / img.width);

        processPDF(dataUrl, watermarkDataUrl, targetW, targetH);
      };

      img.onerror = () => {
        processPDF(null, null, 0, 0);
      };
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
    // Preload users for creator labels when admin/super_admin
    primeUsersForCreatorLabels();
    showLoggedInUI();
    if (page === "clients") refreshClients();
    if (page === "meetings") refreshMeetings();
    if (page === "employees") refreshEmployees();
    if (page === "applicants") refreshApplicants();
    if (page === "sales") refreshSales();
    if (page === "invoices") {
      refreshInvoices();
      setupInvoicePdfGenerator();
    }
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

function setupInvoicePdfGenerator() {
  const list = qs("#pdfItemsList");
  const addBtn = qs("#addItemBtn");
  const totalDisplay = qs("#pdfTotalDisplay");

  if (!list || !addBtn) return;

  // Initialize date/time
  const now = new Date();
  const dateInput = qs("#pdfDate");
  const timeInput = qs("#pdfTime");
  if (dateInput) dateInput.value = now.toISOString().split("T")[0];
  if (timeInput) timeInput.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const updatePdfTotal = () => {
    let total = parseFloat(qs("#pdfServicePrice")?.value) || 0;
    document.querySelectorAll(".pdf-item-price").forEach(inp => {
      total += parseFloat(inp.value) || 0;
    });
    if (totalDisplay) totalDisplay.textContent = total.toFixed(2);
  };

  qs("#pdfServicePrice")?.addEventListener("input", updatePdfTotal);

  const addRow = (nameText = "", priceVal = 0, durationVal = "1") => {
    const div = document.createElement("div");
    div.className = "pdf-item-row grid4";
    div.style.marginBottom = "8px";
    div.style.alignItems = "center";
    div.innerHTML = `
      <div class="field"><input class="pdf-item-name" placeholder="Item Name" value="${nameText}" /></div>
      <div class="field"><input class="pdf-item-price" type="number" step="0.01" placeholder="Price" value="${priceVal}" /></div>
      <div class="field"><input class="pdf-item-duration" placeholder="Duration (e.g. 1 Month)" value="${durationVal}" /></div>
      <div class="field"><button class="btn remove-item-btn" style="color:red; border-color:red; padding:8px;"><i class="fa-solid fa-trash"></i></button></div>
    `;

    div.querySelector(".pdf-item-price").addEventListener("input", updatePdfTotal);
    div.querySelector(".remove-item-btn").addEventListener("click", () => {
      div.remove();
      updatePdfTotal();
    });

    list.appendChild(div);
    updatePdfTotal();
  };

  addBtn.addEventListener("click", () => addRow());

  // Add one default row
  addRow("Standard Package", 0, "1 Month");
}


document.addEventListener("DOMContentLoaded", boot);

