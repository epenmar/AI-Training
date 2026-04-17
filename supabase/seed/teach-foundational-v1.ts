/**
 * Rewrites detailed_help on foundational-tier activity steps to teach
 * concepts inline — term definitions, "why this matters" framings, and
 * clickable links to source content from lesson_flow.
 *
 * Rendering: the activity detail page parses [text](url) and **bold**
 * in detailed_help. Do not use other markdown; it will render literally.
 *
 * Run with: npx tsx --env-file=.env.local supabase/seed/teach-foundational-v1.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type StepHelp = { step_number: number; detailed_help: string };
type ActivityUpdate = { activity_id: number; steps: StepHelp[] };

const updates: ActivityUpdate[] = [
  // =========================================================================
  // Activity 1: AI Tool Safari (Skill 1 — choose the right tool)
  // =========================================================================
  {
    activity_id: 1,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**What an AI chat tool is:** a program where you type a question or request in plain English and the AI types back. ChatGPT, Microsoft Copilot, Claude, and Google Gemini are the most common ones.\n\nYou're opening three at once because the whole point here is comparison. Each tool was trained differently and has different defaults — one might be chatty, another terse, another cautious. You won't notice any of that unless you see them side-by-side.\n\n**Which three to pick:** the easiest starting point is the **Suggest tools** button above — it gives you a short list of free, accessible tools matched to this activity. ASU's [AI foundations hub](https://lx.asu.edu/ai/foundations) also has resources on tool options if you'd like more context before choosing.\n\n**What ready looks like:** each tool shows an empty chat box. Don't send anything yet — just get all three waiting.",
      },
      {
        step_number: 2,
        detailed_help:
          "**What a prompt is:** the thing you type to the AI. Any question, request, or instruction you send counts as a prompt.\n\nWhat you're doing in this activity is called **zero-shot prompting** — you give the AI a task without showing it any examples of what a good answer looks like. Just the ask. This is how most people use AI tools in practice, so it's a useful baseline. More on the concept in the [Zero-Shot Prompting reference (PDF, p. 2)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=2).\n\nUse the prompt exactly as written — \"Write a 3-sentence explanation of active learning suitable for a course syllabus.\" Copy, don't retype; even tiny wording differences can change what comes back.",
      },
      {
        step_number: 3,
        detailed_help:
          "**Why identical wording matters:** if you tweak the prompt between tools, you're no longer comparing the tools — you're comparing your prompts. The goal is a controlled test: same input, see how the outputs differ.\n\nResist the urge to edit based on what Tool 1 gave you. If a tool asks a clarifying question or offers suggestions before answering, that's useful data — note it down, but still send the original prompt. You can always iterate later; this step is just the baseline capture.",
      },
      {
        step_number: 4,
        detailed_help:
          "Four things to notice in each response:\n\n**Length.** Did it stick to three sentences, or did it pad the answer?\n\n**Tone.** How formal is it? Would you put this in a syllabus as-is, or does it read like a marketing brochure? Tone = word choice + sentence rhythm + how directly it addresses the reader.\n\n**Constraint-following.** The prompt said three sentences. Some tools treat that as a hard rule, others as a loose suggestion. That tells you how literal or flexible each one is.\n\n**Accuracy.** Do the claims sound right to you? Any definitions of active learning that seem off? You don't need to fact-check exhaustively yet — just flag anything that surprised you. ([Key terms for evaluating AI outputs](https://canvas.asu.edu/courses/157584/pages/key-terms-for-evaluating-genai-outputs) has more on what to look for.)\n\nNo tool will be best on all four. That's the point.",
      },
      {
        step_number: 5,
        detailed_help:
          "You're not writing a review — just capturing what each tool *did*, specifically enough that you could predict how it'd behave next time.\n\n**Good observation:** \"ChatGPT gave five sentences, ignored the constraint, and used jargon like student-centered pedagogy.\"\n\n**Weak observation:** \"ChatGPT was good.\"\n\nThe more specific your notes, the more useful this is six months from now when you're picking a tool for a different task.",
      },
      {
        step_number: 6,
        detailed_help:
          "**The underlying skill:** learning to pick a tool based on the task, not on brand recognition. \"I liked Claude\" is a starting point; \"Claude held the three-sentence constraint and matched a syllabus voice\" is a reason that transfers to the next decision.\n\nAs you use more tools, you'll develop a mental map: which one to reach for when you need concise, when you need structure, when you want to be pushed back on. That map is what \"choosing the right tool\" actually means.\n\nGo deeper: [Module 1 — Experimenting with GenAI at ASU](https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/J4bNGWxtic5oznXuy5BC_gwfhfAMsE1A) covers the ASU-specific tool landscape in ~15 minutes, and [Module 2 — Do you know what AI can do?](https://rise.articulate.com/share/fRP7fjoWsWuSXljLxc2dF011IycTdmdL#/lessons/_3dr-VqskB18C8sq3TPuSG2e-zUIxdTC) walks through capabilities you just observed in action.",
      },
    ],
  },
];

async function run() {
  for (const { activity_id, steps } of updates) {
    for (const { step_number, detailed_help } of steps) {
      const { error } = await supabase
        .from("activity_guide_steps")
        .update({ detailed_help })
        .eq("activity_id", activity_id)
        .eq("step_number", step_number);
      if (error) {
        console.error(`A${activity_id} step ${step_number}: ${error.message}`);
      }
    }
    console.log(`Updated activity ${activity_id} (${steps.length} steps)`);
  }
  console.log("\n✅ Foundational teach pass v1 applied");
}

run();
