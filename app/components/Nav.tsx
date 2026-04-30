"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";

const links = [
  { href: "/conference", label: "Conference" },
  { href: "/pit", label: "Pit" },
  { href: "/mentor", label: "Mentor" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <span className="text-xs font-bold text-white">RC</span>
          </div>
          <span className="text-sm font-bold text-slate-900">NYC Scout <span className="text-blue-600">2026</span></span>
        </div>

        <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {links
            .filter((l) => !(l.href === "/mentor" && (pathname === "/conference" || pathname === "/pit")))
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  pathname === l.href
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {l.label}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
