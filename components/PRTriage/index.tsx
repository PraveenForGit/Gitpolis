"use client";
import { useState } from "react";

interface PRResult {
  number: number;
  title: string;
  author: string;
  url: string;
  verdict: "spam" | "legit" | "review";
  reason: string;
  source: "heuristic" | "ai";
}

const VERDICT_STYLES: Record<PRResult["verdict"], { label: string; color: string }> = {
  spam: { label: "🔴 Spam", color: "text-code" },
  legit: { label: "🟢 Legit", color: "text-docs" },
  review: { label: "⚠️ Review required", color: "text-lang" },
};

export default function PRTriage() {
  const [repo, setRepo] = useState("");
  const [results, setResults] = useState<PRResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleTriage(e: React.FormEvent) {
    e.preventDefault();
    if (!repo.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/pr-triage?repo=${encodeURIComponent(repo.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setResults([]);
        return;
      }

      setResults(data.results);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Triage open pull requests</h1>
      <p className="text-muted mb-4 font-mono text-sm">$ git triage &lt;owner/repo&gt;</p>

      <form onSubmit={handleTriage} className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="e.g. facebook/react"
          className="flex-1 bg-surface border border-border rounded-full px-4 py-2 outline-none focus:border-code"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-full bg-code text-black font-medium disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Triage PRs"}
        </button>
      </form>

      {error && (
        <div className="bg-surface border border-docs rounded-2xl p-4 text-docs mb-6">
          {error}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="text-muted text-sm">No open pull requests found for this repo.</div>
      )}

      {results.length > 0 && (
        <div className="bg-surface border border-border rounded-3xl overflow-hidden">
          {results.map((pr) => {
            const style = VERDICT_STYLES[pr.verdict] ?? VERDICT_STYLES.review;
            return (
              <a
                key={pr.number}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4 border-b border-border last:border-b-0 hover:bg-background transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    #{pr.number} {pr.title}
                  </div>
                  <div className="text-muted text-sm">
                    by {pr.author} · {pr.reason}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-medium ${style.color}`}>
                    {style.label}
                  </span>
                  {pr.source === "ai" && (
                    <span className="text-xs bg-background border border-border rounded-full px-2 py-0.5 text-muted">
                      AI-reviewed
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}