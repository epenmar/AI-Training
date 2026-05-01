import Link from "next/link";

// Wrapper around Google Drive's preview URL so PDF links can deep-link to a
// specific page. Drive's /file/d/.../view URL ignores #page=N anchors, but
// /file/d/.../preview honors ?page=N when rendered inside an iframe.
//
// Usage: /pdf/{driveFileId}?page=N&title=...
export default async function PdfViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ fileId: string }>;
  searchParams: Promise<{ page?: string; title?: string; back?: string }>;
}) {
  const { fileId } = await params;
  const sp = await searchParams;
  const pageStr = sp.page;
  const pageNum =
    pageStr && /^\d+$/.test(pageStr) ? parseInt(pageStr, 10) : null;

  // Defensive, only allow Drive-style file IDs (alphanumeric + - and _).
  if (!/^[A-Za-z0-9_-]+$/.test(fileId)) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-red-600">Invalid PDF reference.</p>
      </div>
    );
  }

  const previewUrl = `https://drive.google.com/file/d/${encodeURIComponent(
    fileId
  )}/preview${pageNum ? `?page=${pageNum}` : ""}`;
  const directUrl = `https://drive.google.com/file/d/${encodeURIComponent(
    fileId
  )}/view${pageNum ? `#page=${pageNum}` : ""}`;
  const title = sp.title?.trim() || "Reference PDF";
  const backHref = sp.back?.startsWith("/") ? sp.back : "/learning-paths";

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-asu-maroon mb-4"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </Link>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
          {pageNum != null && (
            <p className="text-sm text-gray-500">
              Skipping to page {pageNum}.
            </p>
          )}
        </div>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          Open in Google Drive
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      <iframe
        title={title}
        src={previewUrl}
        className="w-full rounded-lg border border-gray-200 bg-white"
        style={{ height: "80vh" }}
        loading="lazy"
        allow="fullscreen"
      />
      <p className="mt-2 text-xs text-gray-400">
        If the embedded viewer doesn&apos;t load, use &ldquo;Open in Google
        Drive&rdquo; above.
      </p>
    </div>
  );
}
