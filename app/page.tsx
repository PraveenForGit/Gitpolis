"use client";
import { useState } from "react";
import type { CommitMix, GithubRepo, GithubUser } from "@/lib/types";
import { aggregateLanguages } from "@/lib/github";
import LanguageChart from "@/components/LanguageChart";
import ProfileCard from "@/components/ProfileCard";
import RepoList from "@/components/RepoList";


const Home = () => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<GithubUser | null>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitMix, setCommitMix] = useState<CommitMix | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError(null);
    setUser(null);

    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setUser(data.user);
      setRepos(data.repos);
      setCommitMix(data.commitMix);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="w-8 h-8 rounded-full bg-code items-center justify-center">*</span>
          Gitpolis
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Enter the github profile</h1>
      <p className="text-muted mb-4 font-mono text-sm">$ git stats &lt;username&gt;</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. torvalds"
          className="flex-1 bg-surface border border-border rounded-full px-4 py-2 outline-none focus:border-code"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-full bg-code text-black font-medium disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="bg-surface border border-docs rounded-2xl p-4 text-docs mb-6">
          {error}
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <ProfileCard user={user} />
          </div>

          <RepoList repos={repos} />

          <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col items-center justify-center">
            <h2 className="font-semibold mb-4 self-start">Commit Mix</h2>
            <div className="relative w-40 h-40 rounded-full"
               style={{
                       background: commitMix
                       ? `conic-gradient(#FF6B35 0% ${commitMix.codePercent}%, #2ECC71 ${commitMix.codePercent}% 100%)`
                       : `conic-gradient(#24262B 0% 100%)`
                     }}
            >
              <div className="absolute inset-4 rounded-full bg-surface flex items-center justify-center text-xl font-semibold">
                {commitMix ? `${commitMix.codePercent}%` : "—"}
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <span className="text-code">● Code</span>
              <span className="text-docs">● Docs</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-surface border border-border rounded-3xl p-6">
            <h2 className="font-semibold mb-4">Languages</h2>
            <LanguageChart data={aggregateLanguages(repos)} />
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;