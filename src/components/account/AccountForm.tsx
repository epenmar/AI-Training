"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, removeAvatar } from "@/app/(dashboard)/account/actions";

interface Props {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
  initialPublicContact: string;
  email: string;
  isSetup: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CONTACT_CHARS = 200;

export function AccountForm({
  initialDisplayName,
  initialAvatarUrl,
  initialPublicContact,
  email,
  isSetup,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [publicContact, setPublicContact] = useState(initialPublicContact);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const initials = (displayName || email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5MB.");
      e.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveProfile(formData);
      if (res && "error" in res && res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setPreview(null);
        if (isSetup) {
          router.push("/");
          router.refresh();
        } else {
          router.refresh();
        }
      }
    });
  };

  const handleRemoveAvatar = () => {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await removeAvatar();
      if (res.error) setError(res.error);
      else {
        setAvatarUrl(null);
        setPreview(null);
        router.refresh();
      }
    });
  };

  const currentImage = preview ?? avatarUrl;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
    >
      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile picture{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-4 flex-wrap">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt=""
              className="w-20 h-20 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-asu-maroon text-white flex items-center justify-center text-2xl font-semibold">
              {initials || "?"}
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-asu-maroon/10 file:text-asu-maroon hover:file:bg-asu-maroon/20 file:cursor-pointer cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPEG, WEBP, or GIF. Max 5MB.
            </p>
            {avatarUrl && !preview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={pending}
                className="text-xs text-red-600 hover:underline mt-2 disabled:opacity-50 cursor-pointer"
              >
                Remove current picture
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Display name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          What should we call you? <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your first name or preferred name"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Shown at the top of the dashboard and on any posts you share.
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <p className="text-sm text-gray-500">{email}</p>
      </div>

      {/* Public contact info */}
      <div className="pt-2 border-t border-gray-100">
        <label
          htmlFor="public_contact"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contact info{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="public_contact"
          name="public_contact"
          type="text"
          maxLength={MAX_CONTACT_CHARS}
          value={publicContact}
          onChange={(e) => setPublicContact(e.target.value)}
          placeholder="e.g., @yourhandle on Slack, or firstname@asu.edu"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Shown on your non-anonymous Community Look Book posts so peers can
          reach out about what you built.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-asu-green" role="status">
          Saved.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {pending ? "Saving..." : isSetup ? "Continue to dashboard" : "Save"}
        </button>
      </div>
    </form>
  );
}
