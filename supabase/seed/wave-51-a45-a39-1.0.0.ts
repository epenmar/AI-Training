/**
 * wave-51-a45-a39-1.0.0.ts
 *
 * A45 (Systematic Bias Audit) — surface the missing widgets:
 *   - Step 1: text_list_entry for "what / who produced / who consumes."
 *   - Step 2: chip_selector (multi-select) for the bias dimensions —
 *     gender / race / age / ability / cultural / linguistic + Other.
 *   - Step 3: prompt_sandbox — the instruction said "paste the prompt
 *     below" but no prompt sandbox (with copy button) was rendered.
 *
 * A39 (Curate a Team Brief) — full pivot:
 *   The activity used to walk a learner through hand-drafting a
 *   monthly newsletter. The new shape is "build an agent that
 *   auto-curates AI development news for your team and pushes a
 *   fresh brief into Coda / Google Doc / Notion / Slack on whatever
 *   cadence you set." The pivot:
 *
 *   - Description + deliverable rewritten to the agent shape.
 *   - Step 1: chip_selector — pick your AI tool (ChatGPT / Claude /
 *     Gemini / Compare AI / Other) + follow-up textareas for
 *     destination, cadence, and topics. Establishes the stack.
 *   - Step 2: prompt_sandbox — ask AI to confirm what's possible
 *     with your specific stack and outline the integration path.
 *     The setup is genuinely different per pair (ChatGPT custom
 *     GPT + Coda Pack vs. Claude API + Apps Script triggers vs.
 *     Zapier in the middle); AI is the right tool for tool-specific
 *     instructions.
 *   - Step 3: text_list_entry — wire the integrations following
 *     AI's walkthrough; capture what you set up + any auth steps
 *     for future reference.
 *   - Step 4: prompt_sandbox — draft the agent's system prompt
 *     (curation rules, summary format, "try this" item per issue).
 *   - Step 5: text_list_entry — manual test run; document what the
 *     first generated issue captured well and where to tighten the
 *     prompt.
 *   - Step 6: schedule + capture in deliverable box.
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

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ====================================================================
  // A45 (Systematic Bias Audit)
  // ====================================================================

  // Step 1: text_list_entry for what + who produced + who consumes.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-45-artifact",
        prompt:
          "Lock in the artifact you're auditing. Steps 2-5 work from this exact artifact.",
        groups: [
          {
            id: "what",
            count: 1,
            label: "What it is",
            placeholder:
              "e.g., a semester's set of AI-assisted feedback notes (de-identified, ~80 items)",
          },
          {
            id: "produced_by",
            count: 1,
            label: "Who produced it",
            placeholder: "e.g., me + AI assistant during the spring term",
          },
          {
            id: "consumed_by",
            count: 1,
            label: "Who consumes it",
            placeholder:
              "e.g., 80 students across two sections, mixed backgrounds",
          },
        ],
      },
    })
    .eq("activity_id", 45)
    .eq("step_number", 1);
  console.log("✓ A45 step 1 — text_list_entry for artifact context");

  // Step 2: chip_selector (multi-select) for bias dimensions.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "chip_selector",
      interactive_data: {
        storageKey: "activity-45-dimensions",
        prompt:
          "Pick 2-4 dimensions to audit for. Multi-select — choose the ones most relevant to this artifact's audience.",
        chipsLabel: "Bias dimensions to audit",
        singleSelect: false,
        allowOther: true,
        otherLabel: "Other dimension",
        otherPlaceholder:
          "Describe the bias dimension you'll audit for that isn't listed above.",
        options: [
          {
            id: "gender",
            label: "Gender (pronouns, qualifications, examples)",
          },
          {
            id: "race",
            label: "Race / ethnicity (representation, dialect framing)",
          },
          { id: "age", label: "Age (tech-fluency, life-stage assumptions)" },
          {
            id: "ability",
            label: "Ability (language, examples, format accessibility)",
          },
          {
            id: "cultural",
            label: "Cultural / regional (whose references count as universal)",
          },
          {
            id: "linguistic",
            label: "Linguistic (assumptions about reader's first language)",
          },
        ],
      },
    })
    .eq("activity_id", 45)
    .eq("step_number", 2);
  console.log("✓ A45 step 2 — chip_selector (multi) for bias dimensions");

  // Step 3: prompt_sandbox with the bias-audit starter (the "copy text" callout).
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Replace [artifact type] and [dimensions] with what you locked in above. Attach or paste the artifact.",
        starter:
          "Role: bias auditor for a [artifact type] used by a higher-ed audience.\n\n" +
          "Audit the artifact below for systematic bias along these dimensions: [list the dimensions you picked in step 2 — e.g., gender, age, cultural].\n\n" +
          "For each potential pattern you find:\n" +
          "1. Quote the specific phrase or item (verbatim).\n" +
          "2. Name the bias dimension.\n" +
          "3. Rate the pattern's apparent severity (subtle / moderate / overt).\n" +
          "4. Note whether the pattern repeats across the artifact or appears once.\n\n" +
          "Do NOT rewrite the artifact. Identify only — verification happens in step 4.\n\n" +
          "Artifact:\n[paste or attach the artifact here]",
      },
    })
    .eq("activity_id", 45)
    .eq("step_number", 3);
  console.log("✓ A45 step 3 — prompt_sandbox added (copyable starter)");

  // ====================================================================
  // A39 (Curate a Team Brief) — full pivot to "build an auto-curating agent"
  // ====================================================================

  await sb
    .from("level_up_activities")
    .update({
      description:
        "Build an AI agent that auto-curates AI development news for your team and pushes a fresh issue into Coda, Google Docs, Notion, or your destination of choice on a cadence you set (daily, weekly, biweekly). Use AI itself to walk you through the integration path — every tool combo (ChatGPT vs. Claude × Coda vs. Google Docs) has a different setup.\n\n" +
        "Optional extension: Ship issue 2, tighten the system prompt based on what drifted, and post the agent's setup recipe in the Community Look Book so other units can fork it.",
      deliverable:
        "A working agent + a short writeup: which AI tool, which destination, the cadence, the system prompt, and one issue the agent produced.",
    })
    .eq("id", 39);
  console.log("✓ A39 description + deliverable updated for agent pivot");

  // Step 1: chip_selector for AI tool + follow-ups for destination, cadence, topics.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Pick your stack: which AI tool will run the agent, where the brief will land, how often it should refresh, and what AI dev news matters to your team.",
      detailed_help:
        "**Yes, this is doable today.** The platforms below all support some form of scheduled, agentic execution that can write to a doc on a cadence — the path is just genuinely different per pair.\n\n" +
        "**Which AI tool.** ChatGPT (custom GPT + Tasks + Actions), Claude (Projects + API + an automation runner), Gemini (Workspace integrations), or ASU's Compare AI for prompt iteration. Pick the one your team already has access to.\n\n" +
        "**Where it lands.** Coda, Google Doc, Notion, Slack, or even an email digest. The destination decides the integration shape (Coda Pack / Google Docs API or Apps Script / Notion API / webhook).\n\n" +
        "**Cadence.** Daily for fast-moving research feeds; weekly for most teams; biweekly if attention is the limiting resource.\n\n" +
        "**Topics.** Be specific — \"new model releases relevant to higher-ed,\" \"FERPA-relevant AI policy news,\" \"prompt-engineering techniques worth piloting.\" Vague topics produce vague briefs.",
      interactive_type: "chip_selector",
      interactive_data: {
        storageKey: "activity-39-stack",
        prompt:
          "Single-select the AI tool, then capture destination, cadence, and topics in the follow-ups.",
        chipsLabel: "AI tool that runs the agent",
        singleSelect: true,
        allowOther: true,
        otherLabel: "Other AI tool",
        otherPlaceholder:
          "e.g., Perplexity, Copilot, an open-source LLM you self-host",
        options: [
          { id: "chatgpt", label: "ChatGPT (custom GPT + Tasks)" },
          { id: "claude", label: "Claude (Projects + API)" },
          { id: "gemini", label: "Gemini (Workspace integrations)" },
          {
            id: "compare-ai",
            label: "ASU Compare AI (for prompt iteration first)",
          },
        ],
        followUps: [
          {
            id: "destination",
            label: "Destination — where the brief lands",
            placeholder:
              "e.g., Coda doc, Google Doc, Notion page, Slack channel #ai-brief",
          },
          {
            id: "cadence",
            label: "Cadence",
            placeholder: "e.g., weekly on Monday morning",
          },
          {
            id: "topics",
            label: "Topics that matter to your team",
            placeholder:
              "e.g., new model releases relevant to higher-ed, FERPA-relevant AI policy, prompt-eng techniques to pilot",
          },
        ],
      },
    })
    .eq("activity_id", 39)
    .eq("step_number", 1);
  console.log(
    "✓ A39 step 1 — chip_selector (stack picker) + destination/cadence/topics follow-ups"
  );

  // Step 2: prompt_sandbox — ask AI to map the integration path for THIS stack.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Ask AI to confirm what's possible with your specific stack and outline the integration path. Paste your stack from step 1; AI returns a tool-specific build plan.",
      detailed_help:
        "**Why ask AI.** Every AI-tool × destination combination has a different setup — ChatGPT custom GPTs use Actions (OpenAPI specs); Claude usually goes through the API + a runner like Zapier, Make, or n8n; Coda has Packs; Google Docs needs the Docs API or an Apps Script trigger. There's no single tutorial that covers your exact pair, but each tool's docs are well-indexed by the AI.\n\n" +
        "**Verify, don't trust.** AI will sometimes invent integration steps that don't exist on a current platform. After you get the outline, sanity-check the named features against the platform's actual docs (linked in the response if you ask for citations).",
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Replace [tool], [destination], and [cadence] with your picks from step 1.",
        starter:
          "Role: integration architect for AI workflow automation.\n\n" +
          "I want to build an agent that auto-curates AI development news and pushes a brief into [destination] on a [cadence] cadence, driven by [tool].\n\n" +
          "Walk me through, in order:\n" +
          "1. What this looks like at the platform level (what feature of [tool] handles scheduled runs and what feature of [destination] receives writes).\n" +
          "2. The specific integrations / API / OAuth flows I'll need to set up. Name the docs page or settings panel for each.\n" +
          "3. Whether a workflow runner (Zapier, Make, n8n, Apps Script) sits in the middle and why.\n" +
          "4. Cite the official docs page for each step you name. If a feature has changed names recently, flag it.\n" +
          "5. Anything that's NOT possible today with this stack — what would force me to pick a different tool.\n\n" +
          "Plain text. No code yet — just the build plan and the integration map.",
      },
    })
    .eq("activity_id", 39)
    .eq("step_number", 2);
  console.log("✓ A39 step 2 — prompt_sandbox: ask AI to map the integration path");

  // Step 3: text_list_entry — wire the integrations.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Wire up the integrations the AI outlined. Capture each connection below — what you authorized, where you stored credentials, and any setting you tweaked. Step 5 references this when you test.",
      detailed_help:
        "**Capture as you go, not after.** OAuth tokens, API keys, webhook URLs, scope permissions — when something breaks in step 5, this log is what tells you whether you wired auth wrong or the system prompt is the issue.\n\n" +
        "**Don't paste real secrets here.** Use placeholders or names — \"OpenAI API key stored in 1Password vault X\", not the key itself.",
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-39-integrations",
        prompt:
          "One row per integration. Name the platform, what you authorized, where the credential lives.",
        groups: [
          {
            id: "ai-auth",
            count: 1,
            label: "AI tool — auth + scheduling",
            placeholder:
              "e.g., ChatGPT Plus, custom GPT created, Tasks enabled, OpenAI API key stored in 1Password",
          },
          {
            id: "destination-auth",
            count: 1,
            label: "Destination — write access",
            placeholder:
              "e.g., Coda Pack installed; doc-write scope granted; target doc URL noted",
          },
          {
            id: "runner",
            count: 1,
            label: "Workflow runner (if any)",
            placeholder:
              "e.g., Zapier zap created; trigger = ChatGPT Task complete; action = Coda row append",
          },
          {
            id: "notes",
            count: 1,
            label: "Any quirks worth noting",
            placeholder:
              "e.g., feature X has a different name than the docs say; rate-limit Y kicked in at run 3",
          },
        ],
      },
    })
    .eq("activity_id", 39)
    .eq("step_number", 3);
  console.log("✓ A39 step 3 — text_list_entry: integration log");

  // Step 4: prompt_sandbox — draft the agent's system prompt.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Draft the agent's system prompt — the durable instructions that shape every issue. Use AI to draft the first version; you tighten it based on what your team needs.",
      detailed_help:
        "**The system prompt is what makes the brief feel like yours.** Voice, length, what to include, what to skip, how to format the \"try this\" action item. Without it, every issue reads like generic AI summary.\n\n" +
        "**What you'll still own.** Whether the topic-relevance bar is set right for your team, whether the format actually fits in your destination (e.g., Coda blocks vs. Google Doc paragraphs), and the editorial voice.",
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Replace the bracketed sections with your team's specifics. The output is the system prompt the agent will run on every issue.",
        starter:
          "Role: editor of an AI development brief for [audience description].\n\n" +
          "Draft a system prompt for an AI agent that produces a [cadence] brief on AI development relevant to my team. The agent will be triggered on schedule, and its output will be appended to [destination] as a new section.\n\n" +
          "The system prompt should specify:\n\n" +
          "- Topic scope: what to include (e.g., new model releases, AI-in-higher-ed news, prompt-eng techniques) and what to skip (hype, vendor announcements without substance).\n" +
          "- Source bar: what counts as a real source — peer-reviewed work, primary releases, established outlets — and what doesn't.\n" +
          "- Per-item format: 2 sentences (what changed / why it matters for [audience]) + a relevance tag.\n" +
          "- Issue structure: 3-5 items max, one \"try this\" action item, optional 1-paragraph editor's note.\n" +
          "- Voice: [direct / casual / formal — pick one].\n" +
          "- Refusals: don't fabricate sources; if nothing meaningful happened that period, say so explicitly rather than padding.\n\n" +
          "Return the system prompt only, ready to paste into [tool]'s system-prompt or instructions field. No commentary.",
      },
    })
    .eq("activity_id", 39)
    .eq("step_number", 4);
  console.log("✓ A39 step 4 — prompt_sandbox: draft the agent's system prompt");

  // Step 5: text_list_entry — manual test run + iteration notes.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Run the agent manually once. Read the issue it produces and capture what worked, what missed, and the one-line tweak you'd make to the system prompt for issue 2.",
      detailed_help:
        "**Always test manually before scheduling.** A scheduled agent that drifts is a slow-rolling embarrassment. One on-demand run with the full system prompt + a real time window catches the obvious failures — wrong format, missing topic coverage, hallucinated sources, formatting that breaks in your destination.",
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-39-test-run",
        prompt:
          "One manual run, three captures. Saves in your browser; informs the deliverable.",
        groups: [
          {
            id: "worked",
            count: 1,
            label: "What worked",
            placeholder:
              "e.g., relevance bar held, format dropped cleanly into Coda",
          },
          {
            id: "missed",
            count: 1,
            label: "What missed",
            placeholder:
              "e.g., padded with hype, cited a paper that doesn't exist, \"try this\" was generic",
          },
          {
            id: "tweak",
            count: 1,
            label: "One-line system-prompt tweak for issue 2",
            placeholder:
              "e.g., add 'cite the official release URL or do not include' to the source bar",
          },
        ],
      },
    })
    .eq("activity_id", 39)
    .eq("step_number", 5);
  console.log("✓ A39 step 5 — text_list_entry: manual test run notes");

  // Step 6: schedule + deliverable pointer.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Schedule the agent at the cadence you set in step 1. Capture the setup recipe — AI tool, destination, cadence, system prompt, plus a link to the first issue — in the deliverable box at the bottom of this page.",
      detailed_help:
        "**A working agent + a written-down recipe is the deliverable.** The recipe is what lets a colleague fork your setup for their team without re-doing the integration archaeology.\n\n" +
        "**Sustainable cadence beats ambitious cadence.** Better to ship a clean weekly brief that stays accurate than a daily one that quietly drifts.",
    })
    .eq("activity_id", 39)
    .eq("step_number", 6);
  console.log("✓ A39 step 6 — schedule + deliverable pointer");
}

main();
