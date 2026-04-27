"use client";

import { useMemo, useState } from "react";

export type AdminTab = "orders" | "leads" | "appointments" | "settings";

export default function AdminShell({
  userEmail,
  initialTab = "orders",
  onLogout,
  children,
}: {
  userEmail: string;
  initialTab?: AdminTab;
  onLogout: () => void;
  children: (args: { tab: AdminTab; setTab: (t: AdminTab) => void; title: string }) => React.ReactNode;
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab);

  const title = useMemo(() => {
    const titles: Record<AdminTab, string> = {
      orders: "Orders Dashboard",
      leads: "Leads Management",
      appointments: "Appointments Management",
      settings: "Account Settings",
    };
    return titles[tab];
  }, [tab]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-top">
          <img
            className="admin-sidebar-logo"
            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695861fb4062b42c0bd5c2cd_Logo%20Main.png"
            alt="Uptura"
          />
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-link${tab === "orders" ? " active" : ""}`} onClick={() => setTab("orders")}>
            <i className="fa-solid fa-cart-shopping" />
            <span>Orders</span>
          </button>
          <button className={`admin-nav-link${tab === "leads" ? " active" : ""}`} onClick={() => setTab("leads")}>
            <i className="fa-solid fa-users" />
            <span>Leads</span>
          </button>
          <button className={`admin-nav-link${tab === "appointments" ? " active" : ""}`} onClick={() => setTab("appointments")}>
            <i className="fa-solid fa-calendar-check" />
            <span>Appointments</span>
          </button>
          <button className={`admin-nav-link${tab === "settings" ? " active" : ""}`} onClick={() => setTab("settings")}>
            <i className="fa-solid fa-gear" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button className="admin-nav-link danger" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-title">{title}</h1>
          <div className="admin-header-meta">
            <span className="admin-user">{userEmail}</span>
          </div>
        </header>

        {children({ tab, setTab, title })}
      </main>
    </div>
  );
}

