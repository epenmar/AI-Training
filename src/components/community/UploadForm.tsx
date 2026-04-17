"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/app/(dashboard)/community/actions";

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

export function UploadForm({
  skills,
  activities,
  initialSkillId = "",
  initialActivityId = "",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [error, setError] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(initialSkillId);
  const [selectedActivity, setSelectedActivity] = useState(initialActivityId);

  const filteredActivities = selectedSkill
    ? activities.filter((a) => a.skill_id === parseInt(selectedSkill, 10))
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setPreviewType(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 50MB");
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setPreviewType(file.type.startsWith("video/") ? "video" : "image");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPost(formData);
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
        <label
          htmlFor="media"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Screenshot or video <span className="text-red-500">*</span>
        </label>
        <input
          id="media"
          name="media"
          type="file"
          accept="image/*,video/*"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-asu-maroon file:text-white hover:file:bg-sidebar-hover file:cursor-pointer cursor-pointer"
        />
        <p className="text-xs text-gray-400 mt-1">
          Max 50MB. Images or videos.
        </p>
        {preview && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 max-w-sm">
            {previewType === "video" ? (
              <video src={preview} controls className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="w-full" />
            )}
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
          {pending ? "Uploading..." : "Share post"}
        </button>
      </div>
    </form>
  );
}
