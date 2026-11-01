import { NextResponse } from "next/server";
import { authHeaders } from "@/lib/github";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

interface CoreLimit {
  limit: number;
  remaining: number;
  reset: number; 
}

export async function GET() {
  try {
    const core = await cached<CoreLimit>("gh:rate-limit", 15_000, async () => {
      const res = await fetch("https://api.github.com/rate_limit", {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`GITHUB_ERROR_${res.status}`);
      const json = await res.json();
      return json.resources.core as CoreLimit;
    });
    return NextResponse.json(core);
  } catch {
    return NextResponse.json({ error: "Could not read rate limit" }, { status: 502 });
  }
}