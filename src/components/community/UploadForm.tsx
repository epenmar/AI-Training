"use client";

import { useRef, useState, useTransition } from "react";
import { createPost } from "@/app/(dashboard)/community/actions";
import { createClient } from "@/lib/supabase/client";

interface Skill {
  id: number;
  short_name: string;
}

interface Activity {
  id: number;
  title: string;
  skill_id: number;
}

interface Props {
  skills: Skill[];
  activities: Activity[];
  initialSkillId?: string;
  initialActivityId?: string;
}

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

const DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
]);

function classifyFile(file: File): "image" | "video" | "document" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (DOC_MIME_TYPES.has(file.type)) return "document";
  // Fallback to extension — some browsers send blank type for .pptx etc.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext)) {
    return "document";
  }
  return null;
}

export function UploadForm({
  skills,
  activities,
  initialSkillId = "",
  initialActivityId = "",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<
    "image" | "video" | "document" | null
  >(null);
  const [error, setError] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(initialSkillId);
  const [selectedActivity, setSelectedActivity] = useState(initialActivityId);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActivities = selectedSkill
    ? activities.filter((a) => a.skill_id === parseInt(selectedSkill, 10))
    : [];

  const applyFile = (file: File | null): boolean => {
    setError("");
    if (!file) {
      setPreview(null);
      setPreviewType(null);
      setFileName(null);
      return false;
    }
    const kind = classifyFile(file);
    if (!kind) {
      setError("Unsupported file type. Images, videos, PDFs, and Office docs are accepted.");
      return false;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 50MB");
      return false;
    }
    setPreview(kind === "document" ? null : URL.createObjectURL(file));
    setPreviewType(kind);
    setFileName(file.name);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const ok = applyFile(file);
    if (!ok && e.target.value) e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!applyFile(file)) return;
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const [uploadStatus, setUploadStatus] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("media") as File | null;
    const title = formData.get("title")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() || null;
    const skillIdRaw = formData.get("skill_id")?.toString();
    const activityIdRaw = formData.get("activity_id")?.toString();

    if (!file || file.size === 0) {
      setError("Choose a file to share");
      return;
    }
    if (!title) {
      setError("Give your post a title");
      return;
    }

    startTransition(async () => {
      setUploadStatus("Uploading file…");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadStatus("");
        setError("You're signed out. Refresh and try again.");
        return;
      }

      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("community-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadErr) {
        setUploadStatus("");
        setError(`Upload failed: ${uploadErr.message}`);
        return;
      }

      const kind = classifyFile(file) ?? "image";
      setUploadStatus("Saving post…");
      const res = await createPost({
        title,
        description,
        mediaPath: path,
        mediaType: kind,
        skillId: skillIdRaw ? parseInt(skillIdRaw, 10) : null,
        activityId: activityIdRaw ? parseInt(activityIdRaw, 10) : null,
      });
      setUploadStatus("");
      if (res && "error" in res && res.error) setError(res.error);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
    >
      {/* Media upload */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Screenshot, video, or document{" "}
          <span className="text-red-500">*</span>
        </p>
        <label
          htmlFor="media"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-asu-maroon focus-within:border-asu-maroon ${
            isDragging
              ? "border-asu-maroon bg-asu-maroon/5"
              : "border-gray-300 bg-gray-50 hover:border-asu-maroon/50 hover:bg-gray-100"
          }`}
        >
          <svg
            className={`w-8 h-8 pointer-events-none ${
              isDragging ? "text-asu-maroon" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.9A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <p className="text-sm text-gray-700 pointer-events-none">
            <span className="font-semibold text-asu-maroon">
              Drag and drop
            </span>{" "}
            or <span className="font-semibold text-asu-maroon">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 pointer-events-none">
            Images, videos, PDFs, or Office docs — up to 50MB
          </p>
          {fileName && (
            <p className="text-xs text-gray-600 mt-1 pointer-events-none break-all">
              Selected: {fileName}
            </p>
          )}
          <input
            ref={inputRef}
            id="media"
            name="media"
            type="file"
            accept="image/*,video/*,application/pdf,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
            required
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        {preview && previewType !== "document" && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 max-w-sm">
            {previewType === "video" ? (
              <video src={preview} controls className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="w-full" />
            )}
          </div>
        )}
        {previewType === "document" && fileName && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 max-w-sm">
            <svg
              className="w-6 h-6 text-asu-maroon flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-gray-700 break-all">{fileName}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="What is this?"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          placeholder="What did you build? What prompt or technique did you use?"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
      </div>

      {/* Skill tag */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="skill_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Related skill{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="skill_id"
            name="skill_id"
            value={selectedSkill}
            onChange={(e) => {
              setSelectedSkill(e.target.value);
              setSelectedActivity("");
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
          >
            <option value="">— None —</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                Skill {s.id}: {s.short_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="activity_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Related activity{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="activity_id"
            name="activity_id"
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            disabled={!selectedSkill}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent disabled:opacity-50"
          >
            <option value="">— None —</option>
            {filteredActivities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? uploadStatus || "Uploading…" : "Share post"}
        </button>
      </div>
    </form>
  );
}
