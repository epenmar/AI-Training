/**
 * wave-68-skill4-reviewer-notes-1.0.0.ts
 *
 * Skill 4 (Learning with AI) reviewer notes from the Coda feedback
 * form, approved 2026-06-22.
 *
 * A40 — Ask AI About AI (New -> Foundational): praise only, no change.
 *
 * A41 — Teach Me a Feature (Foundational -> Intermediate)
 *   "Chat gave me directions for the website version, and I was working
 *    from the app, so they did not match ... Maybe incorporate account
 *    type (Enterprise vs. free) and how you're accessing the AI (app
 *    vs. website)."
 *     -> Step 2: enrich the teaching prompt with access method, device,
 *        and account type so the AI aims its walkthrough at the
 *        learner's actual environment. Add a help note on why. (The
 *        genuine "UI changed / step skipped" breakdowns — the point of
 *        the activity — still surface in step 3.)
 *
 * A42 — Meta-Learning Protocol (Intermediate -> Advanced)
 *   "change 'Notice where AI alone isn't enough ...' to 'Determine where
 *    AI alone isn't enough ...'. It's stronger."
 *     -> Objective verb Notice -> Determine.
 *   Plus (owner-approved, not a reviewer note): the step instructions
 *   and their help text were misaligned (help ran one protocol-step
 *   ahead of each instruction). Rewrite each step's help so it matches
 *   the instruction it sits under.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ===================== A41 step 2 — environment context =====================
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**The teaching prompt is doing two things:** asking for a step-by-step (so you can follow), and asking the AI to assume zero knowledge (so it doesn't skip the obvious).\n\n" +
        "**Tell it your exact environment.** The app and the website often have different menus, and account tiers (free / Plus / Enterprise) unlock different features. If you don't say which you're on, the AI tends to default to the website's most common version — and you'll burn time on steps that don't match your screen. Name your access method, device, and account type up front.\n\n" +
        "**Push for specificity:** if the AI says \"go to settings,\" ask \"where is settings, top right? Left sidebar? What does it look like?\" Get the AI to describe the actual UI rather than handwave.",
      interactive_data: {
        hint: "Fill in every [bracket] — including app vs. website and your account type. Telling the AI your exact environment is what keeps it from walking you through a different version.",
        starter:
          "I want to learn how to [feature you picked] in [tool you're using]. I'm using it via [the app or the website], on [your device — e.g., Mac, Windows, iPhone], and my account is [account type if you know it — e.g., free, Plus, Enterprise].\n\n" +
          "Walk me through it step by step, assuming I've never done it before. Be specific about exactly where to click, what to type, and what to expect to see — and if the steps differ between the app and the website, give me the version for the one I named.",
      },
    })
    .eq("activity_id", 41)
    .eq("step_number", 2);
  console.log("✓ A41 step 2 — teaching prompt now carries app/website + account type");

  // ===================== A42 — objective verb + step/help realign =====================

  // Objective: Notice -> Determine (third objective).
  const { data: a42 } = await sb
    .from("level_up_activities")
    .select("objectives")
    .eq("id", 42)
    .single();
  const objectives = (a42?.objectives as string[] | null) ?? [];
  const newObjectives = objectives.map((o) =>
    o.startsWith("Notice where AI alone isn't enough")
      ? o.replace(/^Notice\b/, "Determine")
      : o
  );
  await sb
    .from("level_up_activities")
    .update({ objectives: newObjectives })
    .eq("id", 42);
  console.log(
    `✓ A42 objective — "Notice" -> "Determine" (objectives: ${JSON.stringify(newObjectives)})`
  );

  // Realign each step's help to the instruction it sits under. The
  // instructions are correct; only the help was shifted.
  const a42Help: Record<number, string> = {
    // Step 2 — "Pick something genuinely unfamiliar."
    2:
      "**Pick something genuinely unfamiliar — that's the stress test.** A protocol that works on something you already half-knew may quietly fail on something new. Choosing a capability you've never touched is the only honest way to find out whether the protocol actually holds up.\n\n" +
      "Good picks: a tool you've never opened, a technique you've only heard named, an advanced feature you've avoided. If it feels a little uncomfortable, it's the right choice.",
    // Step 3 — "Run steps 1–2: Get the explanation and example."
    3:
      "**Protocol steps 1–2: explain, then example.** First ask the AI to explain the capability; then ask for a worked example. The explanation gives you the shape; the example forces the AI past abstraction.\n\n" +
      "If the example doesn't quite fit your context, that's an early signal the capability may not transfer the way the explanation implied — note it.",
    // Step 4 — "Run step 3: Try it yourself."
    4:
      "**Protocol step 3: try it on a low-stakes task.** A real attempt on something where being wrong costs little is the only way to find where the AI's explanation broke down. Tutorial walkthroughs hide the rough edges; a real task surfaces them.\n\n" +
      "Don't aim for perfection — aim to reach the first point where something doesn't work.",
    // Step 5 — "Run step 4: Show the AI your result and ask it to evaluate."
    5:
      "**Protocol step 4: ask the AI to evaluate your attempt.** \"Here's what I produced. What would you change? What did I miss?\" The critique often catches things the AI's initial explanation glossed over.\n\n" +
      "Watch for empty praise. If it only flatters, push it: \"What's the weakest part, and why?\"",
    // Step 6 — "Run step 5: Find an external source."
    6:
      "**Protocol step 5: cross-check against a real source.** Official docs, a reputable tutorial, or a forum thread. Where the source and the AI disagree, the source wins — and the disagreement is itself signal about where the AI is blind in this area.\n\n" +
      "This is the step that catches what every earlier step missed; note what the external source added.",
    // Step 7 — "Capture your reusable protocol document."
    7:
      "**Annotate honestly — the value is in the seams.** Mark where AI carried the work and where you had to go outside it. A colleague picking up your protocol needs to know which steps to trust as-is and which to verify.",
  };
  for (const [stepNumber, help] of Object.entries(a42Help)) {
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: help })
      .eq("activity_id", 42)
      .eq("step_number", Number(stepNumber));
  }
  console.log("✓ A42 steps 2–7 — help realigned to match each instruction");

  // ============ Resolve any open reviewer notes on A40 / A41 / A42 ============
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [40, 41, 42]);
  const rowIds = ["40", "41", "42", ...(steps ?? []).map((s) => String(s.id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: admin?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) {
    console.warn("(could not resolve notes) " + error.message);
  } else {
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A40/A41/A42`);
  }
}

main();
