// components/landing/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-[#050810] border-t border-border-card/60 py-12 text-center text-text-muted text-xs mono-game select-none">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo and signature */}
        <div className="flex flex-col gap-1.5 text-left">
          <Logo />
          <div className="text-[10px] text-text-muted">
            The mechanical typewriter active recall utility.
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-6 text-xs justify-center">
          <Link href="/pricing" className="hover:text-text transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-text transition-colors">
            Start Free
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="h-px bg-border-card/20 w-full my-8" />

      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-text-muted/60">
        <span>&copy; {new Date().getFullYear()} Recall.ai Inc. All transmissions secured.</span>
        <div className="flex items-center gap-2">
          <span>Created by</span>
          <div className="flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <polygon points="20,85 60,15 90,15 50,85" fill="#FCB839" stroke="#FCB839" strokeWidth="5" strokeLinejoin="round" />
              <rect x="55" y="55" width="30" height="30" rx="8" fill="#9C1AFF" />
            </svg>
            <span className="font-bold text-sm tracking-tight text-white flex items-center">
              <span className="font-light text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.7)" }}>after</span>
              <span className="text-[#9C1AFF]">bell</span>
            </span>
          </div>
          <span>by rendrlabs</span>
        </div>
      </div>
    </footer>
  );
}
