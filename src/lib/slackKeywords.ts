// Derives search keywords for a skill / activity so the Slack feature
// can surface relevant posts. Bots can't use Slack's search API, so we
// pull channel history and filter by these keywords instead.

const STOPWORDS = new Set([
  "the","a","an","and","or","but","to","of","in","on","for","with","as","at",
  "by","from","into","about","your","you","you'll","will","this","that","these",
  "those","it","its","is","are","be","can","cant","can't","do","does","what",
  "when","where","how","why","who","which","each","one","two","three","then",
  "than","not","no","yes","use","using","used","activity","overview","step",
  "steps","ai","genai","tool","tools","i","my","me","we","our","they","their",
  "them","so","if","up","out","more","most","some","any","all","real","work",
  "based","draft","write","writing","make","makes","get","gets","go","goes",
  "things","thing","first","new","good","better","best","whatever","want",
  "wants","need","needs","also","just","like","still","without","across",
]);

// Curated boost keywords per skill_id. These widen the net beyond what
// the title/statement text alone would catch (synonyms / related terms).
const SKILL_BOOST: Record<number, string[]> = {
  17: ["judgment", "critical", "principled", "ethics", "ethical", "evaluate", "decision"],
  2: ["prompt", "prompting", "conversation", "iterate", "dialogue", "chatbot"],
  1: ["tool", "compare", "model", "selection", "vitra", "choose"],
  14: ["learn", "feature", "tutorial", "meta", "self-directed"],
  5: ["voice", "tone", "style", "edit", "revise", "draft", "writing"],
  11: ["creative", "assignment", "redesign", "lesson", "course design"],
  15: ["verify", "citation", "fabrication", "hallucination", "accuracy", "source", "fact-check"],
  7: ["data", "privacy", "ferpa", "vitra", "spreadsheet", "deidentify", "de-identify"],
  16: ["agent", "build", "visual", "diagram", "image", "mermaid", "automation"],
  9: ["disclosure", "policy", "syllabus", "attribution", "transparency"],
  18: ["bias", "equity", "fairness", "discrimination", "inclusive"],
  13: ["news", "current", "update", "newsletter", "curate", "brief"],
};

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // strip markdown links
    .replace(/\{\{[^}]*\}\}/g, " ") // strip vocab markup
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

// Returns a de-duplicated keyword list for a skill.
export function skillKeywords(input: {
  id: number;
  short_name: string;
  statement: string | null;
}): string[] {
  const fromText = tokenize(`${input.short_name} ${input.statement ?? ""}`);
  const boost = SKILL_BOOST[input.id] ?? [];
  return [...new Set([...boost, ...fromText])].slice(0, 14);
}

// Returns a de-duplicated keyword list for an activity. Strips the
// "Overview: In this activity, you will" boilerplate and the optional
// extension before tokenizing.
export function activityKeywords(input: {
  title: string;
  description: string | null;
  skill_id?: number | null;
}): string[] {
  const desc = (input.description ?? "")
    .replace(/^Overview:\s*/i, "")
    .split(/\n\nOptional extension:/i)[0]
    .replace(/In this activity, you will/i, " ");
  const fromText = tokenize(`${input.title} ${desc}`);
  const boost =
    input.skill_id != null ? (SKILL_BOOST[input.skill_id] ?? []) : [];
  return [...new Set([...fromText, ...boost])].slice(0, 14);
}

// Derives keywords from a free-text question (drops stopwords + short
// words). Used by the "ask a question" mode.
export function questionKeywords(text: string): string[] {
  return [...new Set(tokenize(text))].slice(0, 12);
}

// Count distinct keyword matches in a message (whole-word-ish,
// case-insensitive). Returns the matched keywords.
export function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = (text || "").toLowerCase();
  const hits: string[] = [];
  for (const k of keywords) {
    // word-boundary-ish: keyword surrounded by non-letter or string edge
    const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) hits.push(k);
  }
  return hits;
}
