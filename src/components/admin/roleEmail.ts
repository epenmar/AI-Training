// Builds a mailto: link with a pre-filled template so a superadmin can
// notify someone about their new access from their own mail app.
// No email provider needed — the superadmin's default client opens
// with the recipient, subject, and body ready to send.

const ROLE_LABEL: Record<string, string> = {
  commenter: "Commenter",
  editor: "Editor",
  superadmin: "Superadmin",
};

const ROLE_CAPABILITY: Record<string, string> = {
  commenter:
    "You can leave reviewer notes on any activity page (the violet \"Reviewer notes\" panel at the top of each one).",
  editor:
    "You can leave reviewer notes AND edit page text directly with the \"Edit this page\" button.",
  superadmin:
    "You have full admin access, including managing other users in the Admin toolbox.",
};

// Roles worth emailing about (access grants). Demotion to "user" is
// intentionally not auto-emailed.
export function isAccessRole(role: string): boolean {
  return role === "commenter" || role === "editor" || role === "superadmin";
}

export function buildRoleMailto(email: string, role: string): string | null {
  if (!isAccessRole(role)) return null;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const label = ROLE_LABEL[role] ?? role;
  const capability = ROLE_CAPABILITY[role] ?? "";

  const subject = `You've been given ${label} access on AI Activate`;
  const body = [
    "Hi,",
    "",
    `I've given you ${label} access on AI Activate${
      origin ? ` (${origin})` : ""
    }.`,
    "",
    capability,
    "",
    `To get started, sign in${
      origin ? ` at ${origin}` : ""
    } with your ASU Google account. Your access is active right away.`,
    "",
    "Thanks,",
  ].join("\n");

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

// Open the templated email in the default mail app.
export function openRoleEmail(email: string, role: string): void {
  const url = buildRoleMailto(email, role);
  if (url && typeof window !== "undefined") {
    window.location.href = url;
  }
}
