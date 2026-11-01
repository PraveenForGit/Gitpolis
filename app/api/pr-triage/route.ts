import { NextRequest, NextResponse } from "next/server";
import { heuristicPass, pickMainFile, type FileDiff, type Verdict } from "@/lib/pranalysis";
import { analyzeWithGemini } from "@/lib/gemini";
import { githubFetch, githubFetchAll } from "@/lib/github";
import { mapLimit } from "@/lib/async";
import { cached } from "@/lib/cache";
import { checkRateLimit, clientKey } from "@/lib/throttle";

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const MAX_PRS = 20;
const CONCURRENCY = 4;

const TRIAGE_TTL_MS = 10 * 60 * 1000;
const LIMIT = 10; 
const WINDOW_MS = 10 * 60 * 1000; 

interface PullRequest {
  number: number;
  title: string;
  user: { login: string };
  html_url: string;
}

interface TriageResult {
  number: number;
  title: string;
  author: string;
  url: string;
  verdict: Verdict;
  reason: string;
  source: "heuristic" | "ai";
}

interface TriageRun {
  results: TriageResult[];
  complete: boolean;
}

async function runTriage(owner: string, repo: string): Promise<TriageRun> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const prs = await githubFetch<PullRequest[]>(
    `${base}/pulls?state=open&per_page=${MAX_PRS}`
  );

  let complete = true;

  const results = await mapLimit<PullRequest, TriageResult>(prs, CONCURRENCY, async (pr) => {
    const common = {
      number: pr.number,
      title: pr.title,
      author: pr.user.login,
      url: pr.html_url,
    };

    let files: FileDiff[];
    try {
      files = await githubFetchAll<FileDiff>(`${base}/pulls/${pr.number}/files`, 1);
    } catch {
      complete = false;
      return {
        ...common,
        verdict: "review",
        reason: "Could not fetch file changes",
        source: "heuristic",
      };
    }

    const heuristic = heuristicPass(files);
    let verdict = heuristic.verdict;
    let reason = heuristic.reason;
    let source: "heuristic" | "ai" = "heuristic";

    if (heuristic.needsAI) {
      const mainFile = pickMainFile(files);
      if (mainFile) {
        try {
          const ai = await analyzeWithGemini(mainFile.filename, mainFile.patch ?? "");
          verdict = ai.verdict;
          reason = ai.reason;
          source = "ai";
        } catch (aiErr) {
          complete = false;
          console.error("Gemini call failed for PR", pr.number, aiErr);
        }
      }
    }

    return { ...common, verdict, reason, source };
  });

  return { results, complete };
}

export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo")?.trim();
  if (!repoParam || !REPO_PATTERN.test(repoParam)) {
    return NextResponse.json(
      { error: "Provide a repo as owner/repo" },
      { status: 400 }
    );
  }
  const [owner, repo] = repoParam.split("/");

  const throttle = checkRateLimit(`triage:${clientKey(request)}`, LIMIT, WINDOW_MS);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: `Too many triage runs. Try again in ${throttle.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSec) } }
    );
  }

  try {
    const run = await cached<TriageRun>(
      `triage:${owner}/${repo}`.toLowerCase(),
      TRIAGE_TTL_MS,
      () => runTriage(owner, repo),
      (value) => value.complete
    );
    return NextResponse.json({ results: run.results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }
    if (message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "GitHub rate limit reached. Add a GITHUB_TOKEN or try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong fetching PR data" },
      { status: 500 }
    );
  }
}