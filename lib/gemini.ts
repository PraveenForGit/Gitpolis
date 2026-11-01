const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
const MAX_PATCH_CHARS = 6000;

export type AiVerdict = { verdict: "spam" | "legit" | "review"; reason: string };

export async function analyzeWithGemini(
  filename: string,
  patch: string
): Promise<AiVerdict> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const trimmedPatch =
    patch.length > MAX_PATCH_CHARS
      ? `${patch.slice(0, MAX_PATCH_CHARS)}\n... [diff truncated]`
      : patch;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are reviewing a GitHub pull request diff for a maintainer during a high-volume open-source contribution event. Some contributors submit trivial/placeholder edits just to claim credit, rather than genuine improvements.

File: ${filename}
Diff:
${trimmedPatch}

Judge whether this is a substantive, genuine contribution ("legit") or a trivial/low-effort edit ("spam"). You must pick one of these two options — there is no third option.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              verdict: { type: "string", enum: ["spam", "legit"] },
              reason: { type: "string" },
            },
            required: ["verdict", "reason"],
          },
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini request failed with status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    const verdict = String(parsed.verdict ?? "").toLowerCase().trim();
    if (verdict === "spam" || verdict === "legit") {
      return { verdict, reason: parsed.reason ?? "No reason given" };
    }
    return { verdict: "review", reason: "AI response unclear, flagged for manual review" };
  } catch {
    return { verdict: "review", reason: "Could not parse AI response, defaulting to review" };
  }
}