"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CommitMix } from "@/lib/types";
import { THEME } from "@/lib/theme";

interface Props {
  commitMix: CommitMix | null;
  repoName?: string;
}

export default function CommitMixChart({ commitMix, repoName }: Props) {
  const hasData = commitMix !== null && commitMix.sampled > 0;

  const data = hasData
    ? [
        { name: "Code", value: commitMix.codeCommits, color: THEME.code },
        { name: "Docs", value: commitMix.docsCommits, color: THEME.docs },
      ]
    : [{ name: "No data", value: 1, color: THEME.border }];

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col items-center justify-center">
      <h2 className="font-semibold mb-1 self-start">Commit Mix</h2>
      {repoName && (
        <p className="text-muted text-xs mb-3 self-start font-mono">{repoName}</p>
      )}

      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={55}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold pointer-events-none">
          {hasData ? `${commitMix.codePercent}%` : "—"}
        </div>
      </div>

      {hasData ? (
        <>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-code">● Code ({commitMix.codeCommits})</span>
            <span className="text-docs">● Docs ({commitMix.docsCommits})</span>
          </div>
          <p className="text-muted text-xs mt-2">
            Based on their last {commitMix.sampled} commits in this repo
          </p>
        </>
      ) : (
        <p className="text-muted text-sm mt-4 text-center">
          {commitMix === null
            ? "Couldn't load commit data (possibly rate limited)."
            : "No recent commits by this user in their top repo."}
        </p>
      )}
    </div>
  );
}
