// components/convert/MindMapCanvas.tsx
"use client";

import React, { useRef, useState } from "react";
import { Download, ZoomIn, ZoomOut, Maximize } from "lucide-react";
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredBranch, setHoveredBranch] = useState<number | null>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.3, 3.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.3, 0.4));
  const handleReset = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  // Fixed internal coordinate system guarantees no cropping
  const w = 1000;
  const h = 1000;
  const cx = w / 2;
  const cy = h / 2;

  const downloadAsImage = () => {
    if (!svgRef.current) return;
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    
    const img = new Image();
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // High-res 2000x2000 PNG export
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 2000;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.fillStyle = "#0b101f"; 
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        
        const a = document.createElement("a");
        a.download = `${data.center.replace(/[^a-zA-Z0-9]/g, "_")}_mindmap.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const branches = data.branches;
  const numBranches = branches.length;

  // Calibrated radii so max extension (390 + 35 + 36 = 461) fits easily within 500 radius (leaves 39px padding)
  const branchR = 210;
  const leafR   = 390;
  const centerR = 60;

  const branchAngle = 360 / numBranches;

  return (
    <div 
      ref={containerRef} 
      className={`w-full relative group overflow-hidden rounded-xl border border-border-card/30 bg-[#0b101f] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex bg-blue-500/10 border border-blue-500/30 rounded-lg p-1">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-blue-500/20 text-blue-300 rounded" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-1.5 hover:bg-blue-500/20 text-blue-300 rounded" title="Reset View">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-blue-500/20 text-blue-300 rounded" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={downloadAsImage}
          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 flex items-center gap-2 text-sm font-medium"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Transform Layer */}
      <div 
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transformOrigin: "center"
        }}
        className="w-full h-full flex items-center justify-center"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto select-none pointer-events-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", maxHeight: "75vh" }}
        >
        <defs>
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
                // Prevent overlap by restricting fan spread to less than the branch angle
                const maxFanSpread = branchAngle * 0.85; 
                const actualFanSpread = Math.min(maxFanSpread, numLeaves > 1 ? 120 : 0);
                const step = numLeaves > 1 ? actualFanSpread / (numLeaves - 1) : 0;
                
                const leafAngle = angle + (ci - (numLeaves - 1) / 2) * step;
                
                // Stagger distance significantly (35px) to prevent text boxes bumping radially
                const isStaggered = ci % 2 !== 0;
                const currentLeafR = leafR + (isStaggered ? 35 : 0);
                
                const leafPt = polar(cx, cy, currentLeafR, leafAngle);
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
    </div>
  );
}
