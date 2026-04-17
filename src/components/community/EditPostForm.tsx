"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePost } from "@/app/(dashboard)/community/actions";

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
  postId: string;
  initialTitle: string;
  initialDescription: string;
  initialSkillId: string;
  initialActivityId: string;
  skills: Skill[];
  activities: Activity[];
}

export function EditPostForm({
  postId,
  initialTitle,
  initialDescription,
  initialSkillId,
  initialActivityId,
  skills,
  activities,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [selectedSkill, setSelectedSkill] = useState(initialSkillId);
  const [selectedActivity, setSelectedActivity] = useState(initialActivityId);
  const [error, setError] = useState("");

  const filteredActivities = selectedSkill
    ? activities.filter((a) => a.skill_id === parseInt(selectedSkill, 10))
    : [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give your post a title");
      return;
    }

    startTransition(async () => {
      const res = await updatePost({
        postId,
        title: trimmedTitle,
        description: description.trim() || null,
        skillId: selectedSkill ? parseInt(selectedSkill, 10) : null,
        activityId: selectedActivity ? parseInt(selectedActivity, 10) : null,
      });
      if (res && "error" in res && res.error) setError(res.error);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
    >
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
      </div>

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
          type="button"
          onClick={() => router.push(`/community/${postId}`)}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
