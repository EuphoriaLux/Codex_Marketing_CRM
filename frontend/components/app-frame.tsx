"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { HubProvider } from "@/lib/hub-provider";

export function AppFrame({ children }: { children: ReactNode }) {
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
