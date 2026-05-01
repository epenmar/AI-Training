"use client";

export type DownloadableAssetData = {
  url: string;
  filename: string;
  // Optional preview image — usually the same as the asset for image
  // assets, or a thumbnail for PDFs.
  previewUrl?: string;
  previewAlt?: string;
  title?: string;
  description?: string;
  // Defaults to "Download infographic"
  buttonLabel?: string;
};

export function DownloadableAsset({ data }: { data: DownloadableAssetData }) {
  const previewUrl = data.previewUrl ?? data.url;
  const buttonLabel = data.buttonLabel ?? "Download infographic";
  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.title && (
        <p className="text-sm font-semibold text-gray-700 mb-1">{data.title}</p>
      )}
      {data.description && (
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          {data.description}
        </p>
      )}
      <div className="rounded-md bg-white border border-gray-200 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={data.previewAlt ?? data.title ?? "Infographic preview"}
          className="w-full h-auto max-h-[28rem] object-contain rounded"
          loading="lazy"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={data.url}
          download={data.filename}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          {buttonLabel}
        </a>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-asu-maroon cursor-pointer"
        >
          Open in new tab
        </a>
        <span className="text-[11px] text-gray-500">
          Saves as <span className="font-mono">{data.filename}</span>
        </span>
      </div>
    </div>
  );
}
