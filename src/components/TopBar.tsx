"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const title = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Dashboard";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8">
      <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
      >
        <LogOut className="h-4 w-4" />
        Çıkış
      </button>
    </header>
  );
}
