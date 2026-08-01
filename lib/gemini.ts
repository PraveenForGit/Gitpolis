export async function analyzeWithGemini(
  filename: string,
  patch: string
): Promise<{ verdict: "spam" | "legit" | "review"; reason: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are reviewing a GitHub pull request diff for a maintainer during a high-volume open-source contribution event. Some contributors submit trivial/placeholder edits just to claim credit, rather than genuine improvements.

File: ${filename}
Diff:
${patch}

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

  const data = await res.json();
  console.log("Gemini API response:", JSON.stringify(data, null, 2));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    const normalizedVerdict = String(parsed.verdict ?? "").toLowerCase().trim();
    if (normalizedVerdict === "spam" || normalizedVerdict === "legit") {
      return { verdict: normalizedVerdict, reason: parsed.reason ?? "No reason given" };
    }
    return { verdict: "review", reason: "AI response unclear, flagged for manual review" };
  } catch {
    return { verdict: "review", reason: "Could not parse AI response, defaulting to review" };
  }
}