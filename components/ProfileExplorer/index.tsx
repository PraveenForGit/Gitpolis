"use client";
import { useState } from "react";
import { useGithubProfile } from "@/hooks/useGithubProfile";
import { aggregateLanguages } from "@/lib/languages";
import ProfileCard from "@/components/ProfileCard";
import RepoList from "@/components/RepoList";
import LanguageChart from "@/components/LanguageChart";
import CommitMixChart from "@/components/CommitMixChart";

const EXAMPLES = ["torvalds", "gaearon", "addyosmani"];

export default function ProfileExplorer() {
  const [username, setUsername] = useState("");
  const { state, search } = useGithubProfile();
  const loading = state.status === "loading";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(username);
  }

  function handleExample(name: string) {
    setUsername(name);
    search(name);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Enter the github profile</h1>
      <p className="text-muted mb-4 font-mono text-sm">$ git stats &lt;username&gt;</p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. torvalds"
          aria-label="GitHub username"
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

      {state.status === "idle" && (
        <div className="text-muted text-sm mb-6">
          Try:{" "}
          {EXAMPLES.map((name, i) => (
            <span key={name}>
              <button
                type="button"
                onClick={() => handleExample(name)}
                className="text-code hover:underline"
              >
                {name}
              </button>
              {i < EXAMPLES.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="bg-surface border border-docs rounded-2xl p-4 text-docs mb-6"
        >
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <ProfileCard user={state.data.user} />
          </div>

          <RepoList repos={state.data.repos} />

          <CommitMixChart
            commitMix={state.data.commitMix}
            repoName={state.data.repos[0]?.name}
          />

          <div className="md:col-span-2 bg-surface border border-border rounded-3xl p-6">
            <h2 className="font-semibold mb-4">Languages</h2>
            <LanguageChart data={aggregateLanguages(state.data.repos)} />
          </div>
        </div>
      )}
    </div>
  );
}