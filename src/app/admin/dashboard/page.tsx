"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { type AdminTab } from "@/components/admin/AdminShell";
import OrdersView from "@/components/admin/OrdersView";
import LeadsView from "@/components/admin/LeadsView";
import SettingsView from "@/components/admin/SettingsView";

type VerifyResponse = { success: true } | { success: false; message?: string };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("uptura_admin_token");
    const isAuth = localStorage.getItem("uptura_admin_auth");
    if (!token || isAuth !== "true") {
      localStorage.removeItem("uptura_admin_auth");
      localStorage.removeItem("uptura_admin_token");
      router.replace("/admin");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/admin-auth?action=verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as VerifyResponse;
        if (!data.success) {
          localStorage.removeItem("uptura_admin_auth");
          localStorage.removeItem("uptura_admin_token");
          router.replace("/admin");
          return;
        }
      } catch {
        // If verification fails due to transient issues, keep the user in place.
      } finally {
        setVerifying(false);
      }
    };

    run();
  }, [router]);

  function logout() {
    localStorage.removeItem("uptura_admin_auth");
    localStorage.removeItem("uptura_admin_token");
    router.replace("/admin");
  }

  return (
    <AdminShell userEmail="admin@uptura.net" onLogout={logout}>
      {({ tab }: { tab: AdminTab }) =>
        verifying ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <div>Verifying session…</div>
          </div>
        ) : tab === "orders" ? (
          <OrdersView />
        ) : tab === "leads" ? (
          <LeadsView mode="leads" />
        ) : tab === "appointments" ? (
          <LeadsView mode="appointments" />
        ) : (
          <SettingsView />
        )
      }
    </AdminShell>
  );
}

