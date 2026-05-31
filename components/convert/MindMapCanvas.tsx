// components/convert/MindMapCanvas.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import type { MindMapData } from "@/lib/summarize";

interface MindMapCanvasProps {
  data: MindMapData;
}

interface Point { x: number; y: number; }

function polar(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wrapText(text: string, maxChars = 14): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function MindMapCanvas({ data }: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [hoveredBranch, setHoveredBranch] = useState<number | null>(null);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = entry.contentRect.width;
        setDims({ w, h: Math.min(Math.max(w * 0.65, 420), 700) });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { w, h } = dims;
  const cx = w / 2;
  const cy = h / 2;

  const branches = data.branches;
  const numBranches = branches.length;

  // Responsive radii
  const branchR = Math.min(w, h) * 0.30;
  const leafR   = Math.min(w, h) * 0.47;
  const centerR = Math.min(w, h) * 0.09;

  // Build geometry
  const branchAngle = 360 / numBranches;

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="select-none"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial background */}
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a2340" />
            <stop offset="100%" stopColor="#0b101f" />
          </radialGradient>
          {/* Branch gradients */}
          {branches.map((b, i) => (
            <radialGradient key={i} id={`branchGrad${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={b.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={b.color} stopOpacity="0.05" />
            </radialGradient>
          ))}
          {/* Center gradient */}
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c5ef7" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width={w} height={h} rx="12" fill="url(#bgGrad)" />

        {/* Subtle grid rings */}
        {[0.22, 0.38, 0.52].map((rr, i) => (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={Math.min(w, h) * rr}
            fill="none"
            stroke="#ffffff08"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        ))}

        {branches.map((branch, bi) => {
          const angle = branchAngle * bi;
          const isHovered = hoveredBranch === bi;
          const branchPt = polar(cx, cy, branchR, angle);
          const numLeaves = branch.children.length;

          return (
            <g
              key={bi}
              onMouseEnter={() => setHoveredBranch(bi)}
              onMouseLeave={() => setHoveredBranch(null)}
              style={{ cursor: "default" }}
            >
              {/* Center → Branch spine */}
              <line
                x1={cx} y1={cy}
                x2={branchPt.x} y2={branchPt.y}
                stroke={branch.color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeOpacity={isHovered ? 0.9 : 0.5}
                filter={isHovered ? "url(#glow)" : undefined}
                style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s" }}
              />

              {/* Branch node circle */}
              <circle
                cx={branchPt.x} cy={branchPt.y}
                r={isHovered ? 28 : 24}
                fill={`url(#branchGrad${bi})`}
                stroke={branch.color}
                strokeWidth={isHovered ? 2 : 1.2}
                strokeOpacity={isHovered ? 1 : 0.7}
                filter={isHovered ? "url(#glow)" : undefined}
                style={{ transition: "r 0.2s" }}
              />

              {/* Branch label */}
              {wrapText(branch.label, 12).map((line, li, arr) => (
                <text
                  key={li}
                  x={branchPt.x}
                  y={branchPt.y + (li - (arr.length - 1) / 2) * 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isHovered ? "9.5" : "8.5"}
                  fontWeight="700"
                  fill={branch.color}
                  fillOpacity={isHovered ? 1 : 0.85}
                  style={{ transition: "font-size 0.2s" }}
                >
                  {line}
                </text>
              ))}

              {/* Leaf nodes */}
              {branch.children.map((child, ci) => {
                // Spread leaves in a fan around the branch direction
                const fanSpread = Math.min(50, 120 / numLeaves);
                const leafAngle = angle + fanSpread * (ci - (numLeaves - 1) / 2);
                const leafPt = polar(cx, cy, leafR, leafAngle);
                const leafLines = wrapText(child, 11);

                return (
                  <g key={ci}>
                    {/* Branch → Leaf connector */}
                    <line
                      x1={branchPt.x} y1={branchPt.y}
                      x2={leafPt.x} y2={leafPt.y}
                      stroke={branch.color}
                      strokeWidth={isHovered ? 1.5 : 0.8}
                      strokeOpacity={isHovered ? 0.6 : 0.3}
                      strokeDasharray={isHovered ? "none" : "3 4"}
                      style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s" }}
                    />

                    {/* Leaf pill background */}
                    <rect
                      x={leafPt.x - 36}
                      y={leafPt.y - leafLines.length * 7}
                      width={72}
                      height={leafLines.length * 14 + 4}
                      rx="6"
                      fill={branch.color}
                      fillOpacity={isHovered ? 0.18 : 0.09}
                      stroke={branch.color}
                      strokeWidth="0.8"
                      strokeOpacity={isHovered ? 0.5 : 0.25}
                      style={{ transition: "fill-opacity 0.2s" }}
                    />

                    {/* Leaf text */}
                    {leafLines.map((line, li) => (
                      <text
                        key={li}
                        x={leafPt.x}
                        y={leafPt.y - (leafLines.length - 1) * 7 + li * 14}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="7.5"
                        fontWeight="600"
                        fill={branch.color}
                        fillOpacity={isHovered ? 0.95 : 0.65}
                        style={{ transition: "fill-opacity 0.2s" }}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Center node (rendered last so it's always on top) */}
        <circle
          cx={cx} cy={cy} r={centerR + 6}
          fill="url(#centerGrad)"
          stroke="none"
          filter="url(#glowStrong)"
          opacity="0.4"
        />
        <circle
          cx={cx} cy={cy} r={centerR}
          fill="#0f1526"
          stroke="#4f8ef7"
          strokeWidth="2"
          filter="url(#glow)"
        />
        {wrapText(data.center, 10).map((line, li, arr) => (
          <text
            key={li}
            x={cx}
            y={cy + (li - (arr.length - 1) / 2) * 15}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="800"
            fill="#ffffff"
            letterSpacing="0.5"
          >
            {line}
          </text>
        ))}
      </svg>
    </div>
  );
}
