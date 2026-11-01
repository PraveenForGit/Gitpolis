import type { CommitMix, GithubRepo, GithubUser } from "./types";
import { classifyFiles } from "./classify";
import { cached } from "./cache";

const GITHUB_API = "https://api.github.com";

export function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function throwForStatus(res: Response): void {
  if (res.ok) return;
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    throw new Error(remaining === "0" ? "RATE_LIMITED" : "FORBIDDEN");
  }
  throw new Error(`GITHUB_ERROR_${res.status}`);
}

const GITHUB_CACHE_TTL_MS = 5 * 60 * 1000;

export async function githubFetch<T>(path: string): Promise<T> {
  return cached<T>(`gh:${path}`, GITHUB_CACHE_TTL_MS, async () => {
    const res = await fetch(`${GITHUB_API}${path}`, { headers: authHeaders() });
    throwForStatus(res);
    return res.json() as Promise<T>;
  });
}

export async function githubFetchAll<T>(path: string, maxPages = 3): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const items = await githubFetch<T[]>(`${path}${sep}per_page=100&page=${page}`);
    all.push(...items);
    if (items.length < 100) break;
  }
  return all;
}

export async function fetchUser(username: string): Promise<GithubUser> {
  return githubFetch<GithubUser>(`/users/${encodeURIComponent(username)}`);
}

export async function fetchTopRepos(username: string): Promise<GithubRepo[]> {
  const repos = await githubFetchAll<GithubRepo>(
    `/users/${encodeURIComponent(username)}/repos?sort=updated`
  );
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count);
}


export async function fetchCommitMix(
  owner: string,
  repo: string,
  author: string
): Promise<CommitMix> {
  const commits = await githubFetch<{ sha: string }[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits` +
      `?author=${encodeURIComponent(author)}&per_page=20`
  );

  let codeCommits = 0;
  let docsCommits = 0;

  const batchSize = 5;
  for (let i = 0; i < commits.length; i += batchSize) {
    const batch = commits.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map((c) =>
        githubFetch<{ files?: { filename: string }[] }>(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${c.sha}`
        ).catch(() => null)
      )
    );
    for (const detail of details) {
      if (!detail?.files) continue;
      const kind = classifyFiles(detail.files.map((f) => f.filename));
      if (kind === "code") codeCommits += 1;
      else docsCommits += 1;
    }
  }

  const sampled = codeCommits + docsCommits;
  return {
    codeCommits,
    docsCommits,
    sampled,
    codePercent: sampled ? Math.round((codeCommits / sampled) * 100) : 0,
    docsPercent: sampled ? Math.round((docsCommits / sampled) * 100) : 0,
  };
}