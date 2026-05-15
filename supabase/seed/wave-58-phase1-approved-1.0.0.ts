/**
 * wave-58-phase1-approved-1.0.0.ts
 *
 * All Phase 1 audit fixes the user approved on 2026-05-04:
 *
 *   1a — A28 step 1: drop the "Save in your browser; you'll come back
 *        to these" sentence in detailed_help — the widget grey-text
 *        already covers it.
 *
 *   1b — Four "going deeper / bookmark" mentions:
 *        1. A2 step 2: drop the next-level VITRA bridge sentence
 *           (also handled by 1c).
 *        2. A25 step 1: reword to "Save the URL where you'll find it
 *           again. Bookmark it in your browser or save it here by
 *           pasting it below." Add a URL paste field to the widget.
 *        3. A28 step 4: link the bolded Canvas Module 1 / Module 2
 *           overview mentions.
 *        4. A37 step 4: link the bolded Course Glossary, Cheat
 *           Sheet, and Support & Community mentions.
 *
 *   1c — Strip every "Where this goes next" / "Where this comes from"
 *        cross-activity bridge across 28 locations. A18 step 1's
 *        /activities/17 references handled as an edge case (kept
 *        the workflow-option framing, dropped the explicit link).
 *
 *   1d — Source URL specificity fixes (12 entries flagged "Fix";
 *        17 flagged "Keep" stay as-is per the audit).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Strip a "Where this goes next" / "Where this comes from" paragraph
// and everything after. Markers come bolded with **; we match either
// form. Returns the trimmed text or the original if no marker found.
function stripBridge(text: string | null): {
  next: string | null;
  changed: boolean;
} {
  if (text == null) return { next: null, changed: false };
  const markers = [
    "**Where this goes next.**",
    "**Where this goes next**",
    "**Where this comes from.**",
    "**Where this comes from**",
  ];
  for (const m of markers) {
    const i = text.indexOf(m);
    if (i >= 0) {
      const trimmed = text.slice(0, i).replace(/\s+$/, "");
      return { next: trimmed, changed: trimmed !== text };
    }
  }
  return { next: text, changed: false };
}

type Source = {
  title: string;
  url: string;
  source?: string;
  meta?: string;
  where?: string;
};

// Rewrite rules for the 1d source URL fixes. Keyed by (activity_id,
// match on title OR url) → patch.
const SOURCE_FIXES: Array<{
  activityIds: number[];
  matchTitle: string;
  patch: Partial<Source>;
}> = [
  {
    activityIds: [7, 8, 12],
    matchTitle: "Civic Online Reasoning (Stanford SHEG)",
    patch: { url: "https://cor.stanford.edu/curriculum/" },
  },
  {
    activityIds: [17, 18, 22],
    matchTitle: "Create AI custom assistant builder",
    patch: {
      title: "Create AI (institutional platform)",
    },
  },
  {
    activityIds: [17, 18, 22],
    matchTitle: "Mermaid.js — text-to-diagrams",
    patch: {
      title: "Mermaid Live — text-to-diagram editor",
      url: "https://mermaid.live",
    },
  },
  {
    activityIds: [31, 32, 33],
    matchTitle: "AI Creative Learning Lab",
    patch: { url: "https://lx.asu.edu/ai/ai-enhanced-learning" },
  },
  {
    activityIds: [37],
    matchTitle: "lx.asu.edu/ai",
    patch: {
      title: "ASU AI Creative Learning Lab — Community",
      url: "https://lx.asu.edu/ai/community",
    },
  },
  {
    activityIds: [38, 39],
    matchTitle: "AI Creative Learning Lab",
    patch: {
      url: "https://lx.asu.edu/ai/community",
      title: "ASU AI Creative Learning Lab — Community",
    },
  },
  {
    activityIds: [40, 41, 42],
    matchTitle: "Learn Prompting — Your Guide to Communicating with AI",
    patch: { url: "https://learnprompting.org/docs/intro" },
  },
  {
    activityIds: [41, 42],
    matchTitle: "Prompt Engineering Guide (DAIR.AI)",
    patch: { url: "https://www.promptingguide.ai/introduction" },
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ====================================================================
  // 1a — A28 step 1: drop the "Save in your browser" line
  // ====================================================================
  const a28s1Help =
    "**Why predict first.** Your guesses are a fingerprint of your current mental model. Once you test in the next step, the gap between what you predicted and what actually happened is what you'll learn from.\n\n" +
    "**What to write.** Concrete enough that you could test it in five minutes. \"AI can summarize a long article\" is testable. \"AI is helpful\" is not.\n\n" +
    "**One per box**, six predictions total, three per side.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a28s1Help })
    .eq("activity_id", 28)
    .eq("step_number", 1);
  console.log("✓ 1a — A28 step 1: \"Save in your browser\" sentence dropped");

  // ====================================================================
  // 1b #1 — A2 step 2: drop the next-level VITRA bridge sentence
  // (this is the same fix as 1c surgical for A2 step 2)
  // ====================================================================
  const a2s2Help =
    "**The four questions that usually decide which tool fits:**\n\n" +
    "**Input length.** Long readings or large datasets need tools with bigger {{context windows:The amount of text the AI can hold in mind at once. Older parts of long chats start to drop off when the conversation exceeds it.}} (Claude, Gemini Pro). Short {{prompts:Anything you type into an AI to get a response — a question, an instruction, or a request.}} work anywhere.\n\n" +
    "**File support.** Does the task involve uploading PDFs, images, or spreadsheets? ASU's [vetted AI tool list](https://ai.asu.edu/ai-tools) shows which tools support what.\n\n" +
    "**Sensitive data.** If student data is involved, the tool needs to be VITRA-approved before you put real data in. See **ASU's VITRA process (Canvas, ~5 min)**. **VITRA at this level just means: if the tool isn't approved, use de-identified data only.**\n\n" +
    "**Speed of iteration.** If you'll be revising 5+ times, a fast tool with strong follow-up handling matters more than getting the perfect first draft.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a2s2Help })
    .eq("activity_id", 2)
    .eq("step_number", 2);
  console.log(
    "✓ 1b#1 + 1c — A2 step 2: dropped next-level VITRA bridge sentence"
  );

  // ====================================================================
  // 1b #2 — A25 step 1: reword bookmark line + add URL paste field
  // ====================================================================
  const a25s1Help =
    "**Why disclosure matters:** disclosure is what separates using AI as a tool (legitimate, widely accepted) from passing off AI output as your own (misconduct). Policies exist so there's a shared expectation of where the line is.\n\n" +
    "**Where to look at ASU:** start with the Provost's AI page or ASU's main AI hub. The policy landscape is evolving — different colleges and units sometimes have more specific guidance than the university-wide statement. The [Module 3 overview — ethical AI, fairness, transparency (~10 min skim)](https://canvas.asu.edu/courses/157584/pages/module-3-overview-2) page in the [Teaching and Learning with Generative AI](https://canvas.asu.edu/courses/157584) Canvas course is a useful companion if you want to understand what the policies are actually protecting against.\n\n" +
    "**Save the URL where you'll find it again.** Bookmark it in your browser or save it here by pasting it below.";
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a25s1Help,
      interactive_data: {
        storageKey: "activity-25-asu-policy-v2",
        prompt:
          "Paste the URL plus your one-sentence summary. Saves in your browser.",
        groups: [
          {
            id: "url",
            count: 1,
            label: "URL — paste it here",
            placeholder: "https://…",
          },
          {
            id: "summary",
            count: 1,
            label: "ASU policy — source + 1-sentence summary",
            placeholder:
              "e.g., ASU AI Hub — \"Disclose AI use in any work submitted under your name; no university-wide ban on tools.\"",
          },
        ],
      },
    })
    .eq("activity_id", 25)
    .eq("step_number", 1);
  console.log("✓ 1b#2 — A25 step 1: bookmark reword + URL paste field");

  // ====================================================================
  // 1b #3 — A28 step 4: link the bolded Canvas Module mentions
  // ====================================================================
  // First fetch current help, then both link the bolded text and strip
  // the trailing bridge (handled by the 1c bulk pass, but doing both
  // here so the link replacement and the bridge strip happen atomically).
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 28)
      .eq("step_number", 4)
      .single();
    let h = cur?.detailed_help ?? "";
    h = h.replace(
      "**Canvas Module 1 (overview) — GPTs, terminology, capabilities (~10 min skim)**",
      "[Canvas Module 1 overview — GPTs, terminology, capabilities (~10 min skim)](https://canvas.asu.edu/courses/157584/pages/module-1-overview-3)"
    );
    h = h.replace(
      "**Canvas Module 2 (overview) — types of GenAI applications and uses (~10 min skim)**",
      "[Canvas Module 2 overview — types of GenAI applications and uses (~10 min skim)](https://canvas.asu.edu/courses/157584/pages/module-2-overview-2)"
    );
    const stripped = stripBridge(h);
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: stripped.next })
      .eq("activity_id", 28)
      .eq("step_number", 4);
    console.log(
      "✓ 1b#3 + 1c — A28 step 4: Canvas Module links + bridge stripped"
    );
  }

  // ====================================================================
  // 1b #4 — A37 step 4: link the bolded bookmarkables
  // ====================================================================
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 37)
      .eq("step_number", 4)
      .single();
    let h = cur?.detailed_help ?? "";
    h = h.replace(
      "**Course Glossary of key terms**",
      "[Course Glossary of key terms](https://canvas.asu.edu/courses/157584/pages/look-up-key-terms-in-the-course-glossary-2)"
    );
    h = h.replace(
      "**Quick Reference Cheat Sheet (PDF, p. 10)**",
      "[Quick Reference Cheat Sheet (PDF, p. 10)](/pdf/genai101-takehome-reference?page=10)"
    );
    h = h.replace(
      "**Support & Community page**",
      "[Support & Community page](https://lx.asu.edu/ai/community)"
    );
    const stripped = stripBridge(h);
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: stripped.next })
      .eq("activity_id", 37)
      .eq("step_number", 4);
    console.log("✓ 1b#4 + 1c — A37 step 4: three bookmark links + bridge stripped");
  }

  // ====================================================================
  // 1c surgical — A17 description: drop the "next-level activity does the build"
  // ====================================================================
  {
    const { data: a17 } = await sb
      .from("level_up_activities")
      .select("description")
      .eq("id", 17)
      .single();
    const d = (a17?.description ?? "").replace(
      "Don't build it yet; the next-level activity does the build.",
      "Don't build it yet — this activity is the paper design."
    );
    await sb.from("level_up_activities").update({ description: d }).eq("id", 17);
    console.log("✓ 1c surgical — A17 description: cross-activity phrase removed");
  }

  // ====================================================================
  // 1c surgical — A17 step 6: drop the trailing bridge sentence
  // ====================================================================
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 17)
      .eq("step_number", 6)
      .single();
    const before = cur?.detailed_help ?? "";
    // The bridge here is a trailing sentence inside the last paragraph,
    // not a separate "Where this goes next." block — surgical regex.
    const after = before.replace(
      /\s*The Intermediate → Advanced activity for this skill, \[Build and Test a Simple Agent\]\(\/activities\/18\), turns this blueprint into a working agent\.?/,
      ""
    );
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: after.replace(/\s+$/, "") })
      .eq("activity_id", 17)
      .eq("step_number", 6);
    console.log("✓ 1c surgical — A17 step 6: trailing A18 mention removed");
  }

  // ====================================================================
  // 1c edge case — A18 step 1: drop /activities/17 links, keep workflow framing
  // ====================================================================
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Draft the agent's purpose and workflow in the space below. A one-sentence purpose plus 3-6 numbered steps is enough to feed step 2.",
      detailed_help:
        "**You don't have to start from scratch.** If you already have a workflow design drafted somewhere, pull it in. If not, the space below is enough to get going — a one-sentence purpose and 3-6 numbered steps will turn into a system prompt in step 2.\n\n**Most platforms support roughly the same primitives:** a system prompt, persistent instructions, sometimes attached files or tools. The workflow you draft here maps to those primitives. Step 2 is where you turn it into the system prompt and pick the platform — the Create AI callout and the Suggest tools button there will help.",
    })
    .eq("activity_id", 18)
    .eq("step_number", 1);
  console.log("✓ 1c edge — A18 step 1: /activities/17 links removed, framing kept");

  // ====================================================================
  // 1c bulk — strip every other "Where this goes next" / "Where this comes
  // from" bridge across the remaining flagged locations. The strip
  // function is a no-op if the marker isn't present, so safe to run
  // broadly.
  // ====================================================================
  const bulkLocations: Array<[number, number]> = [
    [1, 5],
    [4, 5],
    [5, 6],
    [6, 1],
    [7, 5],
    [12, 1],
    [13, 5],
    [15, 1],
    [17, 1],
    [19, 5],
    [20, 4],
    [21, 1],
    [25, 4],
    [26, 5],
    [27, 1],
    [31, 4],
    [33, 1],
    [35, 5],
    [36, 1],
    [38, 5],
    [40, 4],
    [41, 6],
  ];
  let bulkChanged = 0;
  for (const [aid, sn] of bulkLocations) {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", aid)
      .eq("step_number", sn)
      .single();
    const stripped = stripBridge(cur?.detailed_help ?? null);
    if (!stripped.changed) continue;
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: stripped.next })
      .eq("activity_id", aid)
      .eq("step_number", sn);
    bulkChanged++;
  }
  console.log(`✓ 1c bulk — stripped bridge blocks on ${bulkChanged} steps`);

  // ====================================================================
  // 1c surgical — A6 step 1: cross-ref to A5 is mid-paragraph, not a
  // bridge block, so the bulk pass missed it. Drop the last paragraph.
  // ====================================================================
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 6)
      .eq("step_number", 1)
      .single();
    let h = cur?.detailed_help ?? "";
    // The cross-ref is the final paragraph that begins with "[The
    // Anchoring Breaker]". Strip it (and any trailing whitespace).
    const idx = h.indexOf("[The Anchoring Breaker]");
    if (idx >= 0) {
      h = h.slice(0, idx).replace(/\s+$/, "");
      await sb
        .from("activity_guide_steps")
        .update({ detailed_help: h })
        .eq("activity_id", 6)
        .eq("step_number", 1);
      console.log("✓ 1c surgical — A6 step 1: cross-ref to A5 removed");
    }
  }

  // ====================================================================
  // 1d — source URL specificity fixes
  // ====================================================================
  let sourceFixesApplied = 0;
  for (const fix of SOURCE_FIXES) {
    for (const aid of fix.activityIds) {
      const { data: a } = await sb
        .from("level_up_activities")
        .select("extra_sources")
        .eq("id", aid)
        .single();
      const sources = Array.isArray(a?.extra_sources)
        ? (a!.extra_sources as Source[])
        : [];
      let changed = false;
      const next = sources.map((s) => {
        if (!s || s.title !== fix.matchTitle) return s;
        changed = true;
        return { ...s, ...fix.patch };
      });
      if (changed) {
        await sb
          .from("level_up_activities")
          .update({ extra_sources: next })
          .eq("id", aid);
        sourceFixesApplied++;
      }
    }
  }
  console.log(
    `✓ 1d — source URL fixes applied to ${sourceFixesApplied} activity entries`
  );
}

main();
