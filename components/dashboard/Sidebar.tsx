// components/dashboard/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "📚 Library Decks", href: "/dashboard" },
    { label: "➕ Convert Passage", href: "/dashboard/convert" },
  ];

  return (
    <aside className="w-64 bg-[#070b14] border-r border-border-card/65 flex flex-col justify-between font-mono text-xs select-none">
      <div className="flex flex-col gap-8 p-6">
        {/* Sidebar Header Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-text hover:opacity-90">
          <span className="text-lg">💾</span>
          <span className="tracking-widest uppercase">RECALL.AI</span>
        </Link>

        {/* Sidebar Nav Items */}
        <nav className="flex flex-col gap-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-3 rounded text-text-muted hover:text-text border border-transparent hover:bg-surface/30 transition-all font-semibold",
                  isActive && "bg-surface/60 border-border-card text-text shadow-sm font-bold"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer details */}
      <div className="p-6 border-t border-border-card/30 flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded bg-surface/10 border border-border-card/20">
          <div className="w-7 h-7 rounded border border-border-card bg-gradient-to-br from-active to-correct flex items-center justify-center text-white text-xs font-bold">
            ∞
          </div>
          <div className="flex flex-col min-w-0 font-sans">
            <span className="text-[10px] text-text font-bold leading-tight truncate">
              Public User
            </span>
            <span className="text-[9px] text-correct leading-tight truncate font-mono font-bold animate-pulse">
              UNLIMITED FREE EDITION
            </span>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full py-2 bg-blue-950/20 border border-blue-900/40 text-blue-400 hover:bg-blue-500 hover:text-bg transition-colors font-bold uppercase rounded text-[10px] tracking-wider"
        >
          🏠 Return Home
        </button>
      </div>
    </aside>
  );
}
