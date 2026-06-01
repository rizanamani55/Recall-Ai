"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

interface UpgradeModalProps {
  onDismiss: () => void;
}

export function UpgradeModal({ onDismiss }: UpgradeModalProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Midnight local time
      
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "pro_monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border-card rounded-xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 select-none relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-active/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-correct/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col items-center text-center gap-3 relative z-10">
          <div className="w-16 h-16 rounded-full bg-active/10 flex items-center justify-center mb-2 border border-active/30">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="serif-header text-2xl font-bold text-text">Limit Reached</h2>
          <p className="text-text-muted text-sm font-sans leading-relaxed">
            You&apos;ve used all <strong className="text-active">3 free conversions</strong> today. 
            Upgrade to Pro for unlimited conversions, priority processing, and advanced exports.
          </p>
        </div>

        <div className="flex flex-col gap-3 relative z-10 w-full mt-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-active to-purple-600 text-white hover:brightness-110 disabled:opacity-50 transition-all rounded-lg font-bold uppercase tracking-wider text-sm shadow-lg shadow-active/20"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro — $9/mo"}
          </button>
          
          <button
            onClick={onDismiss}
            className="w-full py-3 px-4 flex items-center justify-center gap-2 border border-border-card text-text-muted hover:text-text hover:border-text-muted transition-colors rounded-lg font-mono text-xs uppercase"
          >
            <Clock size={14} />
            Remind me tomorrow ({timeLeft})
          </button>
        </div>
      </div>
    </div>
  );
}
