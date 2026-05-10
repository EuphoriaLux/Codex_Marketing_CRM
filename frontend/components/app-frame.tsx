"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PublicFrame } from "@/components/public-frame";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { HubProvider } from "@/lib/hub-provider";

const PUBLIC_ROUTES = ["/partnership"];

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isPublicRoute(pathname)) {
    return <PublicFrame>{children}</PublicFrame>;
  }

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
