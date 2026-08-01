import type { GithubRepo } from "@/lib/types";

export default function RepoList({ repos }: { repos: GithubRepo[] }) {
  return (
    <div className="bg-surface border border-border rounded-3xl p-6">
      <h2 className="font-semibold mb-4">Top Repos</h2>
      <div className="flex flex-col gap-3">
        {repos.slice(0, 5).map((repo) => (
          <a
            key={repo.full_name}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between border border-border rounded-2xl px-4 py-3 hover:border-code transition-colors"
          >
            <div>
              <div className="font-medium">{repo.name}</div>
              {repo.description && (
                <div className="text-muted text-sm line-clamp-1">{repo.description}</div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted shrink-0">
              {repo.language && <span>{repo.language}</span>}
              <span>★ {repo.stargazers_count}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}