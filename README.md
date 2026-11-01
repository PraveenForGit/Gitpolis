# Gitpolis

A GitHub analyzer that looks past stars and languages. It tells you whether someone ships real code or mostly docs edits, and helps maintainers triage open pull requests during high-volume events like Hacktoberfest.

## Features

**Profile Explorer**
- Look up any public GitHub user: profile, top repos by stars (forks excluded), language breakdown.
- **Commit Mix**: samples the user's own recent commits in their top repo and classifies each as a code change or a docs-only change (README, CONTRIBUTING, markdown, etc.).

**PR Triage**
- Enter `owner/repo` to classify its open PRs as  "legit",  "spam", or  "review required".
- A fast heuristic pass handles obvious cases (whitespace-only edits, large code changes). Only ambiguous PRs are sent to Gemini, so AI calls stay few.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · GitHub REST API · Google Gemini

## Running locally

```bash
npm install
cp .env.example .env.local   # fill your own key
npm run dev
```

Open http://localhost:3000.

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Recommended | Fine-grained token, public repos read-only. Raises the limit from 60 to 5,000 requests/hour. |
| `GEMINI_API_KEY` | Optional | Enables AI review of ambiguous PRs. |
| `GEMINI_MODEL` | Optional | Override the default Gemini model. |

## How it stays within API limits

- GitHub responses are cached in memory for 5 minutes, and a finished PR triage for 10, so repeat lookups cost nothing. Identical simultaneous requests share one call.
- Failed AI calls are never cached, so a temporary Gemini outage doesn't stick.
- Each visitor is limited (30 profile lookups and 10 triage runs per 10 minutes) to protect your token and Gemini quota.
- The header shows your remaining GitHub API requests.

## Known limitations

- The cache and visitor limits are in-memory and per server instance. On serverless hosts they are best-effort; use Redis/Upstash for a hard guarantee.
- Commit Mix samples at most 20 commits in a single repo, so treat it as a signal, not a verdict.
- Triage reads up to 20 open PRs per repo and the first 100 files of each.