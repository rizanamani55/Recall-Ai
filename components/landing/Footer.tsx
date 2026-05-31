// components/landing/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#050810] border-t border-border-card/60 py-12 text-center text-text-muted text-xs mono-game select-none">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo and signature */}
        <div className="flex flex-col gap-1.5 text-left">
          <div className="text-text font-bold text-sm flex items-center gap-1.5">
            <span>💾</span>
            <span>RECALL.AI</span>
          </div>
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
        <span>Built for serious professional exam students.</span>
      </div>
    </footer>
  );
}
