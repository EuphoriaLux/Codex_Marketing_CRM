"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PublicFrame } from "@/components/public-frame";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getAccessToken } from "@/lib/api/client";
import { HubProvider } from "@/lib/hub-provider";

// Routes rendered with the marketing/public chrome (no sidebar, no auth required).
const PUBLIC_FRAME_ROUTES = ["/partnership"];

// Routes that render full-screen (no shell, no public chrome, no auth required).
const FULL_SCREEN_ROUTES = new Set(["/"]);

// Routes that render in the standard Shell but don't require a logged-in user.
const AUTH_OPEN_ROUTES = new Set(["/login", "/auth/callback", "/legacy"]);

function isPublicFrameRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_FRAME_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isFullScreen(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return FULL_SCREEN_ROUTES.has(normalized);
}

function isAuthOpen(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return AUTH_OPEN_ROUTES.has(normalized);
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
  const publicFrame = isPublicFrameRoute(pathname);
  const fullScreen = isFullScreen(pathname);
  const authOpen = isAuthOpen(pathname);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || publicFrame || fullScreen || authOpen) return;
    if (!getAccessToken()) router.replace("/login");
  }, [mounted, publicFrame, fullScreen, authOpen, pathname, router]);

  if (publicFrame) return <PublicFrame>{children}</PublicFrame>;
  if (fullScreen) return <>{children}</>;
  if (authOpen) return <Shell>{children}</Shell>;
  if (!mounted) return null;
  if (!getAccessToken()) return null;

  return <Shell>{children}</Shell>;
}
