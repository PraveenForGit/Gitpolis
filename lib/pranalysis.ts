import { isDocsFile } from "./classify";
export interface FileDiff {
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
}

export type Verdict = "spam" | "legit" | "review";

export interface HeuristicResult {
    verdict: Verdict;
    reason: string;
    needsAI: boolean;
}

function changedLines(patch: string): {added: string[]; removed: string[]} {
    const added: string[] = [];
    const removed: string[] = [];
    for (const line of patch.split("\n")) {
        if (line.startsWith("+++") || line.startsWith("---")) continue;
        if (line.startsWith("+")) added.push(line.slice(1).replace(/\s+/g, ""));
        if (line.startsWith("-")) removed.push(line.slice(1).replace(/\s+/g, ""));
    }
    return {
        added: added.filter(Boolean).sort(),
        removed: removed.filter(Boolean).sort(),
    };
}

function isWhitespaceOnly(file: FileDiff): boolean {
    if(!file.patch) return false;
    const { added, removed } = changedLines(file.patch);
    return added.join("\n") === removed.join("\n");
}

export function heuristicPass(files: FileDiff[]): HeuristicResult {
    if (files.length === 0) {
        return {
            verdict: "review",
            reason: "No file changes found.",
            needsAI: false
        };
    }

    const totalChanges = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
    const allDocsOnly = files.every((f) => isDocsFile(f.filename));

   if (files.every(isWhitespaceOnly)) {
    return {
      verdict: "spam",
      reason: "Whitespace-only change, no actual content.",
      needsAI: false,
    };
  }
  if (!allDocsOnly && totalChanges > 20) {
    return {
      verdict: "legit",
      reason: "Substantial code change across files.",
      needsAI: false,
    };
  }
    return {
        verdict: "review",
        reason: "Needs review",
        needsAI: true
    };
}

export function pickMainFile(files: FileDiff[]): FileDiff | null {
  const withPatch = files.filter((f) => f.patch);
  if (withPatch.length === 0) return null;
  return withPatch.reduce((best, f) =>
    f.additions + f.deletions > best.additions + best.deletions ? f : best
  );
}