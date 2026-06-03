/**
 * Diagnostic pass for the self-healing pipeline.
 *
 * A single Claude call with CLAUDE.md as the system prompt (the "trust anchor"),
 * so a generic model becomes a domain expert on this app. Returns a structured
 * assessment. Cheap and read-only — it never changes code (that's the repair pass).
 *
 * Requires ANTHROPIC_API_KEY in the environment. If it's absent, the caller should
 * store the report and skip diagnosis rather than failing.
 */
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

export type Diagnosis = {
  severity: string;     // low | medium | high | critical
  confidence: string;   // low | medium | high
  root_cause: string;
  suspected_files: string[];
  proposed_fix: string;
  narrative: string;
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export function diagnosisAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function readClaudeMd(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "CLAUDE.md"), "utf-8");
  } catch {
    return "(CLAUDE.md not found — diagnosing without repo conventions)";
  }
}

function parseDiagnosis(text: string): Diagnosis {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  const json = s >= 0 && e >= 0 ? cleaned.slice(s, e + 1) : cleaned;
  const obj = JSON.parse(json) as Record<string, unknown>;
  return {
    severity: String(obj.severity ?? "unknown"),
    confidence: String(obj.confidence ?? "unknown"),
    root_cause: String(obj.root_cause ?? ""),
    suspected_files: Array.isArray(obj.suspected_files) ? obj.suspected_files.map(String) : [],
    proposed_fix: String(obj.proposed_fix ?? ""),
    narrative: String(obj.narrative ?? ""),
  };
}

export async function diagnose(input: {
  description: string;
  pageRoute?: string | null;
  contextBundle?: unknown;
}): Promise<{ diagnosis: Diagnosis; tokens: { input: number; output: number }; ms: number }> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const claudeMd = readClaudeMd();

  const system =
    `${claudeMd}\n\n---\n\n` +
    `You are the diagnostic agent for this application. A user reported a bug. Using the app's ` +
    `conventions, known patterns, and common pitfalls described above, assess it. Respond with ONLY ` +
    `a single JSON object (no prose, no markdown fences) with these keys: ` +
    `severity (one of low|medium|high|critical), confidence (one of low|medium|high), ` +
    `root_cause (string), suspected_files (array of repo-relative file paths), ` +
    `proposed_fix (string describing a minimal, surgical fix), narrative (a short explanation).`;

  const userMsg =
    `Bug description: ${input.description}\n` +
    `Page route: ${input.pageRoute ?? "unknown"}\n` +
    `Context bundle: ${JSON.stringify(input.contextBundle ?? {}).slice(0, 4000)}`;

  const start = Date.now();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userMsg }],
  });
  const ms = Date.now() - start;

  const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const diagnosis = parseDiagnosis(text);
  return {
    diagnosis,
    tokens: { input: resp.usage.input_tokens, output: resp.usage.output_tokens },
    ms,
  };
}
