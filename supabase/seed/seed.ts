/**
 * Seed script for ASU AI Skills Training Dashboard
 *
 * Reads CSV files and inserts all static reference data into Supabase.
 * Run with: npx tsx supabase/seed/seed.ts
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { join } from "path";

const CSV_DIR = join(__dirname, "csv");

function readCsv(filename: string): Record<string, string>[] {
  const raw = readFileSync(join(CSV_DIR, filename), "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

// ─── Bloom Phase Definitions ────────────────────────────────

const BLOOM_PHASES = [
  { id: 0, name: "Welcome & Orient", bloom_levels: "Pre-phase", description: "Onboarding and orientation material.", sort_order: 0 },
  { id: 1, name: "Understand the Landscape", bloom_levels: "Remember / Understand", description: "Recognizing and comprehending the AI landscape.", sort_order: 1 },
  { id: 2, name: "Choose & Attribute", bloom_levels: "Understand / Apply", description: "Selecting tools, following policies, making ethical decisions.", sort_order: 2 },
  { id: 3, name: "Converse & Research", bloom_levels: "Apply", description: "Active application — brainstorming, researching, editing with AI.", sort_order: 3 },
  { id: 4, name: "Verify & Analyze", bloom_levels: "Analyze / Evaluate", description: "Critical analysis of AI output, data handling, and privacy.", sort_order: 4 },
  { id: 5, name: "Create & Innovate", bloom_levels: "Evaluate / Create", description: "Creative production and teaching application with AI.", sort_order: 5 },
  { id: 6, name: "Design AI Experiences", bloom_levels: "Apply → Create (Builder Track)", description: "AI-X Framework builder track for designing AI-mediated learning.", sort_order: 6 },
  { id: 7, name: "Build & Automate", bloom_levels: "Create", description: "Building AI agents and self-directed AI learning.", sort_order: 7 },
  { id: 8, name: "Reference & Community", bloom_levels: "Ongoing", description: "Ongoing resources and community support.", sort_order: 8 },
];

// ─── Skill → Bloom Phase Mapping ────────────────────────────

const SKILL_PHASE_MAP: Record<number, number> = {
  1: 2, 9: 2, 12: 2,   // Choose & Attribute (core 12 here; builder track items go to phase 6)
  10: 1, 13: 1,          // Understand the Landscape
  2: 3, 3: 3, 5: 3,     // Converse & Research
  4: 4, 7: 4,            // Verify & Analyze
  11: 5, 8: 5,           // Create & Innovate
  6: 7, 14: 7,           // Build & Automate
};

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // ── 1. Bloom Phases ─────────────────────────────────────
  console.log("Seeding bloom_phases...");
  const { error: phaseErr } = await supabase.from("bloom_phases").upsert(BLOOM_PHASES);
  if (phaseErr) throw phaseErr;
  console.log(`  ✓ ${BLOOM_PHASES.length} phases`);

  // ── 2. Skills ───────────────────────────────────────────
  console.log("Seeding skills...");
  const scoringKey = readCsv("Scoring_Key.csv");
  const skills = scoringKey.map((row) => {
    const skillId = parseInt(row["Maynard Skill #"]);
    return {
      id: skillId,
      statement: row["Skill Statement"],
      short_name: row["Skill Statement"].split(",")[0].replace("I can ", ""),
      bloom_phase_id: SKILL_PHASE_MAP[skillId] ?? 1,
      is_gap: row["Gap?"] === "YES",
    };
  });
  const { error: skillErr } = await supabase.from("skills").upsert(skills);
  if (skillErr) throw skillErr;
  console.log(`  ✓ ${skills.length} skills`);

  // ── 3. Assessment Questions ─────────────────────────────
  console.log("Seeding assessment_questions...");
  const selfAssessment = readCsv("Self-Assessment.csv");
  const questions = selfAssessment.map((row) => ({
    id: parseInt(row["Q#"]),
    skill_id: parseInt(row["Q#"]), // Q# matches skill # 1:1
    scenario: row["Scenario"],
  }));
  const { error: qErr } = await supabase.from("assessment_questions").upsert(questions);
  if (qErr) throw qErr;
  console.log(`  ✓ ${questions.length} questions`);

  // ── 4. Assessment Options ───────────────────────────────
  console.log("Seeding assessment_options...");
  const options: {
    question_id: number;
    option_key: string;
    option_text: string;
    level_label: string;
    score: number;
  }[] = [];

  for (let i = 0; i < selfAssessment.length; i++) {
    const qRow = selfAssessment[i];
    const skRow = scoringKey[i];
    const qId = parseInt(qRow["Q#"]);

    for (const key of ["A", "B", "C", "D"] as const) {
      options.push({
        question_id: qId,
        option_key: key,
        option_text: qRow[`Option ${key}`],
        level_label: skRow[`Option ${key} Level`],
        score: parseInt(skRow[`Option ${key} Score`]),
      });
    }
  }

  // Delete existing then insert (upsert needs unique id which is serial)
  await supabase.from("assessment_options").delete().neq("id", 0);
  const { error: optErr } = await supabase.from("assessment_options").insert(options);
  if (optErr) throw optErr;
  console.log(`  ✓ ${options.length} options`);

  // ── 5. Learning Items ───────────────────────────────────
  console.log("Seeding learning_items...");
  const allItems = readCsv("All.csv");
  const learningItems = allItems.map((row) => ({
    id: parseInt(row["ID"]),
    source: row["Source"],
    topic: row["Topic"],
    summary: row["Summary"],
    learning_level: row["Learning Level"],
    direct_link: row["Direct Link"],
    leveling_rationale: row["Leveling Rationale"],
  }));

  // Add gap-skill items (IDs starting from 200)
  const gapItems = [
    // Skill 7 — Data + Privacy
    { id: 200, source: "External (NMU)", topic: "Understanding FERPA in the Context of Generative AI", summary: "Faculty guide on how generative AI tools intersect with FERPA regulations.", learning_level: "Foundational", direct_link: "https://nmu.edu/ctl/understanding-ferpa-context-generative-ai-guide-faculty", leveling_rationale: "Introductory policy guide" },
    { id: 201, source: "External (NMU)", topic: "Artificial Intelligence and University Data Policy", summary: "University policy: FERPA-protected data cannot be inputted into AI without CISO permission.", learning_level: "Foundational", direct_link: "https://nmu.edu/policies/1560/Guideline", leveling_rationale: "Policy document" },
    { id: 202, source: "External (Microsoft)", topic: "Data Privacy and Security for Microsoft 365 Copilot", summary: "How Copilot protects data in Excel: encryption, retention, compliance.", learning_level: "Intermediate", direct_link: "https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy", leveling_rationale: "Technical documentation requiring applied understanding" },
    { id: 203, source: "External (Google)", topic: "Generative AI in Google Workspace Privacy Hub", summary: "Data privacy when using Gemini in Sheets: data isolation, compliance, DLP.", learning_level: "Intermediate", direct_link: "https://support.google.com/a/answer/15706919", leveling_rationale: "Technical documentation with admin controls" },
    { id: 204, source: "External (NMU)", topic: "AI Literacy: Faculty Ethics and Inclusivity", summary: "Ethical AI use in academic settings: privacy, transparency, responsible use.", learning_level: "Foundational", direct_link: "https://nmu.edu/ai-literacy-initiative/faculty-ethics-academia-and-inclusivity", leveling_rationale: "Introductory ethics resource" },
    // Skill 8 — Visuals
    { id: 205, source: "External (TTU)", topic: "Quick Guide to Creating Accessible Presentations", summary: "Accessibility for AI-generated visuals: alt text review and design consistency.", learning_level: "Foundational", direct_link: "https://www.ttu.edu/accessibility/digital-accessibility/docs/accessible-powerpoint-guide.html", leveling_rationale: "Introductory accessibility guide" },
    { id: 206, source: "External (UC)", topic: "AI Tools for Presentations (UC Library Guide)", summary: "Comparison of AI presentation tools, accuracy limitations, and best practices.", learning_level: "Foundational", direct_link: "https://guides.libraries.uc.edu/ai-education/presentation", leveling_rationale: "Survey/overview resource" },
    { id: 207, source: "External (UC)", topic: "AI Tools for Accessibility (UC Library Guide)", summary: "AI tools for accessibility: text-to-speech, image descriptions, inclusive design.", learning_level: "Intermediate", direct_link: "https://guides.libraries.uc.edu/ai-education/accessibility", leveling_rationale: "Applied accessibility tools" },
    { id: 208, source: "External (Open Source)", topic: "Mermaid Diagramming Tool", summary: "Open-source text-to-diagram tool for flowcharts, UML, architecture visuals.", learning_level: "Intermediate", direct_link: "https://mermaid.js.org/", leveling_rationale: "Requires applied technical skill" },
    { id: 209, source: "External (Eraser)", topic: "DiagramGPT — AI Diagram Generator", summary: "AI-powered diagram generation from natural language descriptions.", learning_level: "Intermediate", direct_link: "https://www.eraser.io/diagramgpt", leveling_rationale: "Applied AI tool use" },
    // Skill 14 — Meta-learning
    { id: 210, source: "External (Open Source)", topic: "Learn Prompting — Your Guide to Communicating with AI", summary: "Comprehensive free guide to prompt engineering and self-directed AI learning.", learning_level: "Foundational", direct_link: "https://learnprompting.org", leveling_rationale: "Beginner-friendly self-paced guide" },
    { id: 211, source: "External (Google)", topic: "Google AI Essentials", summary: "Self-paced program: AI fundamentals, practical application, responsible use.", learning_level: "Foundational", direct_link: "https://grow.google/ai-essentials/", leveling_rationale: "Introductory course" },
    { id: 212, source: "External (Open Source)", topic: "Prompt Engineering Guide (DAIR.AI)", summary: "Research-backed prompting guide with hands-on notebooks.", learning_level: "Intermediate", direct_link: "https://www.promptingguide.ai/", leveling_rationale: "Requires prior prompting experience" },
    { id: 213, source: "External (Anthropic)", topic: "Anthropic Interactive Prompt Engineering Tutorial", summary: "9-chapter interactive tutorial with exercises and playground.", learning_level: "Intermediate", direct_link: "https://github.com/anthropics/prompt-eng-interactive-tutorial", leveling_rationale: "Interactive hands-on exercises" },
    { id: 214, source: "External (DeepLearning.AI)", topic: "ChatGPT Prompt Engineering for Developers", summary: "Practical course: summarizing, inferring, transforming text, building apps.", learning_level: "Advanced", direct_link: "https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/", leveling_rationale: "Developer-oriented advanced course" },
  ];

  const allLearningItems = [...learningItems, ...gapItems];
  await supabase.from("learning_items").delete().neq("id", 0);
  const { error: liErr } = await supabase.from("learning_items").insert(allLearningItems);
  if (liErr) throw liErr;
  console.log(`  ✓ ${allLearningItems.length} learning items (${gapItems.length} new gap items)`);

  // ── 6. Lesson Flow (from BloomsMapping.csv) ─────────────
  console.log("Seeding lesson_flow...");
  const bloomsMapping = readCsv("BloomsMapping.csv");
  const lessonFlow = bloomsMapping.map((row) => {
    // Parse skill IDs from the "Maynard Skill(s)" column
    const skillStr = row["Maynard Skill(s)"] || "";
    const skillIds = skillStr
      .split(",")
      .map((s: string) => parseInt(s.trim()))
      .filter((n: number) => !isNaN(n));

    return {
      bloom_phase_id: parseInt(row["Bloom Phase"]),
      original_phase: row["Original Phase"],
      seq: parseInt(row["Seq"]),
      topic: row["Item"],
      learning_level: row["Learning Level"],
      modality: row["Modality"],
      source: row["Source"],
      item_title: row["Item"],
      link: row["Direct Link"],
      purpose: row["Purpose for the Learner"],
      id_guidance: null,
      skill_ids: skillIds,
      specific_location: row["Specific Location"],
    };
  });

  await supabase.from("lesson_flow").delete().neq("id", 0);
  const { error: lfErr } = await supabase.from("lesson_flow").insert(lessonFlow);
  if (lfErr) throw lfErr;
  console.log(`  ✓ ${lessonFlow.length} lesson flow items`);

  // ── 7. Level-Up Activities ──────────────────────────────
  console.log("Seeding level_up_activities...");
  const activitiesCsv = readCsv("Level-Up_Activities.csv");
  const activities = activitiesCsv.map((row, index) => {
    const linkedStr = row["Linked Phases"] || "";
    const linkedPhaseIds = linkedStr
      .replace(/[()]/g, "")
      .split(",")
      .map((s: string) => parseInt(s.trim()))
      .filter((n: number) => !isNaN(n));

    return {
      id: index + 1, // Sequential IDs starting from 1
      skill_id: parseInt(row["Skill #"]),
      band: row["Your Score → Activity For"],
      title: row["Activity Title"],
      description: row["What You'll Do"],
      time_estimate: row["Time"],
      deliverable: row["What You'll Produce"],
      linked_phase_ids: linkedPhaseIds,
    };
  });

  await supabase.from("activity_guide_steps").delete().neq("id", 0);
  await supabase.from("level_up_activities").delete().neq("id", 0);
  const { error: actErr } = await supabase.from("level_up_activities").insert(activities);
  if (actErr) throw actErr;
  console.log(`  ✓ ${activities.length} activities`);

  // ── 8. Activity Guide Steps ─────────────────────────────
  console.log("Seeding activity_guide_steps...");
  const guidesCsv = readCsv("Activity_Guides.csv");

  // Build a lookup from (skill#, band, title) → activity_id
  const activityLookup = new Map<string, number>();
  for (const act of activities) {
    const key = `${act.skill_id}|${act.band}`;
    activityLookup.set(key, act.id);
  }

  const steps = guidesCsv.map((row) => {
    const skillNum = parseInt(row["Skill #"]);
    const band = row["Level-Up Band"];
    const key = `${skillNum}|${band}`;
    const activityId = activityLookup.get(key);

    if (!activityId) {
      console.warn(`  ⚠ No activity found for skill ${skillNum}, band "${band}"`);
    }

    return {
      activity_id: activityId ?? 1,
      step_number: parseInt(row["Step #"]),
      instruction: row["Instruction"],
    };
  });

  const { error: stepErr } = await supabase.from("activity_guide_steps").insert(steps);
  if (stepErr) throw stepErr;
  console.log(`  ✓ ${steps.length} guide steps`);

  // ── Summary ─────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log(`   ${BLOOM_PHASES.length} bloom phases`);
  console.log(`   ${skills.length} skills`);
  console.log(`   ${questions.length} assessment questions`);
  console.log(`   ${options.length} assessment options`);
  console.log(`   ${allLearningItems.length} learning items`);
  console.log(`   ${lessonFlow.length} lesson flow items`);
  console.log(`   ${activities.length} level-up activities`);
  console.log(`   ${steps.length} activity guide steps`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
