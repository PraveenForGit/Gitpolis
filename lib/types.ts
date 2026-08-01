export interface GithubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
    html_url: string;
    location: string | null;
    blog: string | null;
}

export interface GithubRepo {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    fork: boolean;
    updated_at: string;
}

export interface CommitMix {
  codeCommits: number;
  docsCommits: number;
  sampled: number;
  codePercent: number;
  docsPercent: number;
}