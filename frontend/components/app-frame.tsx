"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getAccessToken } from "@/lib/api/client";
import { HubProvider } from "@/lib/hub-provider";

const PUBLIC_ROUTES = new Set(["/", "/login", "/auth/callback"]);

function isPublic(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PUBLIC_ROUTES.has(normalized);
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <HubProvider>
      <div className="shell">
        <Sidebar />
        <div className="content">
          <Topbar />
          {children}
        </div>
      </div>
    </HubProvider>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicRoute = isPublic(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || publicRoute) return;
    if (!getAccessToken()) router.replace("/login");
  }, [mounted, publicRoute, pathname, router]);

  if (publicRoute) return <Shell>{children}</Shell>;
  if (!mounted) return null;
  if (!getAccessToken()) return null;

  return <Shell>{children}</Shell>;
}
