// Helpers for deciding how (or whether) to embed a URL in an iframe.
// Supports Office Online for uploaded .ppt/.pptx/.doc/.docx/.xls/.xlsx,
// native PDF embedding, and Google/YouTube/Vimeo links shared by URL.

export type LinkKind =
  | "google-slides"
  | "google-docs"
  | "google-sheets"
  | "google-drive"
  | "youtube"
  | "vimeo"
  | "generic";

export function getLinkKind(url: string): LinkKind {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "docs.google.com") {
      if (u.pathname.startsWith("/presentation")) return "google-slides";
      if (u.pathname.startsWith("/document")) return "google-docs";
      if (u.pathname.startsWith("/spreadsheets")) return "google-sheets";
    }
    if (host === "drive.google.com") return "google-drive";
    if (
      host === "www.youtube.com" ||
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com"
    ) {
      return "youtube";
    }
    if (host === "vimeo.com" || host === "www.vimeo.com") return "vimeo";
  } catch {
    // Fall through
  }
  return "generic";
}

export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const kind = getLinkKind(url);
    if (kind === "google-slides") {
      const m = u.pathname.match(/^\/presentation\/d\/([^/]+)/);
      if (m) return `https://docs.google.com/presentation/d/${m[1]}/embed`;
    }
    if (kind === "google-docs") {
      const m = u.pathname.match(/^\/document\/d\/([^/]+)/);
      if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
    }
    if (kind === "google-sheets") {
      const m = u.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
      if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/preview`;
    }
    if (kind === "google-drive") {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    if (kind === "youtube") {
      let id = "";
      if (u.hostname === "youtu.be") {
        id = u.pathname.slice(1);
      } else {
        id = u.searchParams.get("v") ?? "";
        if (!id) {
          const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
          if (m) id = m[1];
        }
      }
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (kind === "vimeo") {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
  } catch {
    // Fall through
  }
  return null;
}

const OFFICE_EXTS = new Set(["ppt", "pptx", "doc", "docx", "xls", "xlsx"]);

function getExt(url: string): string | null {
  try {
    const u = new URL(url);
    const ext = u.pathname.split(".").pop()?.toLowerCase();
    return ext ?? null;
  } catch {
    return null;
  }
}

export function getOfficeEmbedUrl(fileUrl: string): string | null {
  const ext = getExt(fileUrl);
  if (!ext || !OFFICE_EXTS.has(ext)) return null;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export function isPdf(fileUrl: string): boolean {
  return getExt(fileUrl) === "pdf";
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
