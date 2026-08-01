// app/api/pr-triage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { heuristicPass, type FileDiff } from "@/lib/prAnalysis";
import { analyzeWithGemini } from "@/lib/gemini";

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface PullRequest {
  number: number;
  title: string;
  user: { login: string };
  html_url: string;
}

export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo"); // expects "owner/repo"
  if (!repoParam || !repoParam.includes("/")) {
    return NextResponse.json(
      { error: "Provide a repo as owner/repo" },
      { status: 400 }
    );
  }
  const [owner, repo] = repoParam.split("/");

  try {
    // 1. Fetch open PRs (limit to most recent 20 to control API usage)
    const prsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=20`,
      { headers: authHeaders() }
    );
    if (!prsRes.ok) {
      throw new Error(prsRes.status === 404 ? "NOT_FOUND" : "GITHUB_ERROR");
    }
    const prs: PullRequest[] = await prsRes.json();

    // 2. For each PR, fetch its changed files, then classify
    const results = await Promise.all(
      prs.map(async (pr) => {
        const filesRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`,
          { headers: authHeaders() }
        );
        if (!filesRes.ok) {
          return {
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            url: pr.html_url,
            verdict: "review" as const,
            reason: "Could not fetch file changes",
            source: "heuristic" as const,
          };
        }

        const files: FileDiff[] = await filesRes.json();
        const heuristic = heuristicPass(files);

        let finalVerdict = heuristic.verdict;
        let reason = heuristic.reason;
        let source: "heuristic" | "ai" = "heuristic";

        if (heuristic.needsAI) {
          const mainFile = files[0];
          try {
            const ai = await analyzeWithGemini(mainFile.filename, mainFile.patch ?? "");
            finalVerdict = ai.verdict;
            reason = ai.reason;
            source = "ai";
          } catch(aiErr) {
            console.error("Gemini call failed for PR", pr.number, aiErr);
          }
        }

        return {
          number: pr.number,
          title: pr.title,
          author: pr.user.login,
          url: pr.html_url,
          verdict: finalVerdict,
          reason,
          source,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Something went wrong fetching PR data" },
      { status: 500 }
    );
  }
}