import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  const Wrapper = href ? Link : "div";
  
  return (
    <Wrapper 
      href={href} 
      className={cn("flex items-center select-none font-bold tracking-tight", className)}
    >
      <span className="text-[#101828] dark:text-white text-2xl tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        recc
      </span>
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mx-[1px] mt-[3px]"
      >
        {/* The 'a' active recall arrow symbol */}
        {/* Center dot */}
        <circle cx="12" cy="13" r="2.5" fill="#0084FF" />
        {/* Outer circular arrow */}
        <path 
          d="M10 5.5 C15 4, 21 8, 20 14 C19 19, 14 21, 9 19 C5 17, 3 12, 5 8" 
          stroke="#0084FF" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Arrow head */}
        <polygon points="12,3 4,5 7,12" fill="#0084FF" />
        {/* Tail of the 'a' */}
        <path d="M20 14 L20 19 L21.5 20.5" stroke="#0084FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="text-[#101828] dark:text-white text-2xl tracking-tighter" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        ll
      </span>
      <span className="text-[#0084FF] text-2xl tracking-tighter font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        .ai
      </span>
    </Wrapper>
  );
}
