import type {GithubRepo, GithubUser} from './types';

const GITUB_API = 'https://api.github.com';
const DOCS_ONLY_PATTERN = 
/\.(md|mdx|txt|rest)$|^(readme|contributing|license|licence|changelog|code_of_conduct|security)(\.|$)/i;

function authHeaders(): HeadersInit {
    const token = process.env.GITHUB_TOKEN;
    return {
        Accept: "application/vnd.github+json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
    };
}

function classifyFiles(filenames: string[]): "code" | "docs" {
  if(filenames.length === 0) return "docs";
  return filenames.every((name) => DOCS_ONLY_PATTERN.test(name)) ? "docs" : "code";
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

export async function fetchCommitMix(owner: string, repo: string) {
  const commits = await githubFetch<{ sha: string }[]>(
    `/repos/${owner}/${repo}/commits?per_page=20`
  );

  let codeCommits = 0;
  let docsCommits = 0;

  const batchSize = 5;
  for (let i = 0; i < commits.length; i += batchSize) {
    const batch = commits.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map((c) =>
        githubFetch<{ files?: { filename: string }[] }>(
          `/repos/${owner}/${repo}/commits/${c.sha}`
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
