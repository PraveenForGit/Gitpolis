import type {GithubRepo, GithubUser} from './types';

const GITUB_API = 'https://api.github.com';

function authHeaders(): HeadersInit {
    const token = process.env.GITHUB_TOKEN;
    return {
        Accept: "application/vnd.github+json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
    };
}

async function githubFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${GITUB_API}${path}`, {
        headers: authHeaders(),
    });
    if (res.status === 404) throw new Error("NOT_FOUND");
    if (res.status === 403) throw new Error("RATE_LIMITED");
    if(!res.ok) throw new Error(`GITHUB_ERROR_${res.status}`);
    return res.json() as Promise<T>;
} 

export async function fetchUser(username: string): Promise<GithubUser> {
  return githubFetch<GithubUser>(`/users/${encodeURIComponent(username)}`);
}

export async function fetchTopRepos(username: string): Promise<GithubRepo[]> {
  const repos = await githubFetch<GithubRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
  );
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count);
}

export function aggregateLanguages(repos: GithubRepo[]) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([language, repoCount]) => ({ language, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount);
}
