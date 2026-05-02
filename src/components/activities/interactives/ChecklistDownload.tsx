"use client";

import { useCallback } from "react";

// A pre-built checklist that the learner downloads in the format that
// fits their workflow. Renders the content inline (so they can see
// what they're getting) plus a row of download buttons that generate
// the file client-side from the same data — Markdown, plain text, an
// HTML page with checkable boxes, and a print-to-PDF flow that uses
// the same HTML.
type Section = { heading: string; items: string[] };

export type ChecklistDownloadData = {
  title: string;
  description?: string;
  sections: Section[];
  filenameBase?: string;
};

function toMarkdown(d: ChecklistDownloadData): string {
  let out = `# ${d.title}\n\n`;
  if (d.description) out += `${d.description}\n\n`;
  for (const s of d.sections) {
    out += `## ${s.heading}\n\n`;
    for (const i of s.items) out += `- [ ] ${i}\n`;
    out += "\n";
  }
  return out;
}

function toPlainText(d: ChecklistDownloadData): string {
  const underline = (s: string, ch: string) => ch.repeat(Math.max(s.length, 1));
  let out = `${d.title}\n${underline(d.title, "=")}\n\n`;
  if (d.description) out += `${d.description}\n\n`;
  for (const s of d.sections) {
    out += `${s.heading}\n${underline(s.heading, "-")}\n`;
    for (const i of s.items) out += `[ ] ${i}\n`;
    out += "\n";
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(d: ChecklistDownloadData): string {
  const sections = d.sections
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.heading)}</h2><ul>${s.items
          .map(
            (i) =>
              `<li><label><input type="checkbox" /> <span>${escapeHtml(
                i
              )}</span></label></li>`
          )
          .join("")}</ul></section>`
    )
    .join("");
  // Self-contained HTML — no external dependencies, prints cleanly,
  // checkboxes are interactive in any browser.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(
    d.title
  )}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, system-ui, "Segoe UI", sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1.25rem; color: #191919; line-height: 1.5; background: white; }
  h1 { color: #8C1D40; border-bottom: 3px solid #FFC627; padding-bottom: .5rem; margin-bottom: 1rem; }
  p.lead { color: #555; margin-top: 0; }
  h2 { color: #00A3E0; margin-top: 2rem; font-size: 1.05rem; }
  ul { list-style: none; padding: 0; margin: .5rem 0 0; }
  li { margin: .25rem 0; padding: .5rem .75rem; border: 1px solid #ddd; border-radius: 6px; background: white; }
  label { display: flex; gap: .6rem; align-items: flex-start; cursor: pointer; }
  input[type="checkbox"] { margin-top: .25rem; width: 1rem; height: 1rem; accent-color: #00A3E0; flex-shrink: 0; }
  @media print {
    body { margin: 0; padding: .75in; }
    li { break-inside: avoid; border-color: #999; }
    h1 { page-break-after: avoid; }
    h2 { page-break-after: avoid; }
  }
</style>
</head><body>
<h1>${escapeHtml(d.title)}</h1>
${d.description ? `<p class="lead">${escapeHtml(d.description)}</p>` : ""}
${sections}
</body></html>`;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ChecklistDownload({ data }: { data: ChecklistDownloadData }) {
  const base = data.filenameBase ?? "checklist";
  const onMd = useCallback(
    () => downloadBlob(`${base}.md`, toMarkdown(data), "text/markdown"),
    [data, base]
  );
  const onTxt = useCallback(
    () => downloadBlob(`${base}.txt`, toPlainText(data), "text/plain"),
    [data, base]
  );
  const onHtml = useCallback(
    () => downloadBlob(`${base}.html`, toHtml(data), "text/html"),
    [data, base]
  );
  const onPrint = useCallback(() => {
    // Open the HTML in a new tab and trigger the browser's print
    // dialog. Users save as PDF from there. Avoids bundling a PDF
    // generator and gets the system PDF settings users already know.
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(toHtml(data));
    w.document.close();
    w.focus();
    setTimeout(() => {
      try {
        w.print();
      } catch {
        // Some browsers block; the tab is open so the user can print
        // from the menu.
      }
    }, 350);
  }, [data]);

  const btnClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue";
  const btnSecondary =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-asu-blue text-asu-blue bg-white hover:bg-asu-blue/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue";

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      <p className="text-sm font-semibold text-gray-700 mb-1">{data.title}</p>
      {data.description && (
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          {data.description}
        </p>
      )}
      <div className="rounded-md bg-white border border-gray-200 p-3 space-y-3 max-h-[24rem] overflow-y-auto">
        {data.sections.map((s, idx) => (
          <section key={idx}>
            <h4 className="text-sm font-semibold text-asu-blue mb-1.5">
              {s.heading}
            </h4>
            <ul className="space-y-1.5">
              {s.items.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 items-start text-sm text-gray-700 leading-snug"
                >
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 h-4 mt-0.5 border border-gray-400 rounded-sm flex-shrink-0"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600 font-medium mr-1">
          Download as:
        </span>
        <button type="button" onClick={onMd} className={btnClass}>
          Markdown (.md)
        </button>
        <button type="button" onClick={onTxt} className={btnClass}>
          Plain text (.txt)
        </button>
        <button type="button" onClick={onHtml} className={btnClass}>
          HTML (.html)
        </button>
        <button type="button" onClick={onPrint} className={btnSecondary}>
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
