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

const DOCS_PATTERN = /\.(md|mdx|txt|rst)$|^(readme|contributing|license|changelog)(\.|$)/i;

export function heuristicPass(files: FileDiff[]): HeuristicResult {
    const totalChanges = files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
    const allDocsOnly = files.every((f) => DOCS_PATTERN.test(f.filename));
    const isWhiteSpaceOnly = files.every(
        (f) => !f.patch || f.patch.replace(/[\s+\@]/g, "").length === 0
    );

    if (isWhiteSpaceOnly) {
        return {
            verdict: "spam",
            reason: "Whitespace-only change, no actual content.",
            needsAI: false
        };
    }
    if (!allDocsOnly && totalChanges > 20) {
        return {
            verdict: "legit",
            reason: "Substantial code change across files.",
            needsAI: false
        };
    }
    return {
        verdict: "review",
        reason: "Needs review",
        needsAI: true
    };
}