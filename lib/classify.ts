export const DOCS_PATTERN = /\.(md|mdx|txt|rst)$|(^|\/)(readme|contributing|license|licence|changelog|code_of_conduct|security)(\.|$)/i;

export function isDocsFile(filename: string): boolean {
    return DOCS_PATTERN.test(filename);
}

export type ChangeKind = "code" | "docs";

export function classifyFiles(filenames: string[]): ChangeKind {
    if (filenames.length === 0) return "docs";
    return filenames.every(isDocsFile) ? "docs" : "code";
}