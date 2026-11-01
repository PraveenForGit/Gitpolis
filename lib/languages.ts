import type { GithubRepo } from "./types";

export function aggregateLanguages(repos: GithubRepo[]) {
    const counts = new Map<string, number>();
    for (const repo of repos) {
        if (!repo.language) continue;
        counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    return Array.from(counts.entries())
    .map(([language, repoCount]) => ({ language, repoCount}))
    .sort((a, b) => b.repoCount - a.repoCount);
}