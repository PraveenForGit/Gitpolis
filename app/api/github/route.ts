import { NextResponse, NextRequest } from "next/server";
import { fetchUser, fetchTopRepos, fetchCommitMix } from "@/lib/github";

export async function GET(request: NextRequest) {
    const username = request.nextUrl.searchParams.get("username");
    if (!username) {
        return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
    }

    try {
        const [user, repos] = await Promise.all([
            fetchUser(username),
            fetchTopRepos(username)
        ]);

        const topRepo = repos[0];
        let commitMix = null;
        if (topRepo) {
            try {
                commitMix = await fetchCommitMix(user.login, topRepo.name);
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
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}