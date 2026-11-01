import { NextResponse, NextRequest } from "next/server";
import { fetchUser, fetchTopRepos, fetchCommitMix } from "@/lib/github";
import { checkRateLimit, clientKey } from "@/lib/throttle";


const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000; 

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: "That doesn't look like a valid GitHub username" }, { status: 400 });
  }

  const throttle = checkRateLimit(`profile:${clientKey(request)}`, LIMIT, WINDOW_MS);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: `Too many searches. Try again in ${throttle.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSec) } }
    );
  }

  try {
    const [user, repos] = await Promise.all([
      fetchUser(username),
      fetchTopRepos(username),
    ]);

    const topRepo = repos[0];
    let commitMix = null;
    if (topRepo) {
      try {
        commitMix = await fetchCommitMix(user.login, topRepo.name, user.login);
      } catch {
        commitMix = null;
      }
    }

    return NextResponse.json({ user, repos, commitMix });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "GitHub rate limit reached. Add a GITHUB_TOKEN or try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}