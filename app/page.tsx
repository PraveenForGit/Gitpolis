"use client";
import { useState } from "react";
import Image from "next/image";
import ProfileExplorer from "@/components/ProfileExplorer";
import PRTriage from "@/components/PRTriage";
import RateLimitBadge from "@/components/RateLimitBadge";

type Mode = "profile" | "triage";

const TABS: { id: Mode; label: string }[] = [
  { id: "profile", label: "Profile Explorer" },
  { id: "triage", label: "PR Triage" },
];

const Home = () => {
  const [mode, setMode] = useState<Mode>("profile");

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Image
            src="/images/gitpolis-logo.png"
            alt="Gitpolis logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          Gitpolis
        </div>

        <div className="flex items-center gap-3">
          <RateLimitBadge />
          <div
            role="tablist"
            aria-label="Gitpolis modes"
            className="flex gap-2 bg-surface rounded-full p-1 border border-border"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mode === tab.id ? "bg-white text-black" : "text-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel">
        {mode === "profile" ? <ProfileExplorer /> : <PRTriage />}
      </div>
    </main>
  );
};

export default Home;
