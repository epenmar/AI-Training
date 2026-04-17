import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account/AccountForm";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const { setup } = await searchParams;
  const isSetup = setup === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, email, show_in_community, public_contact")
    .eq("id", user.id)
    .single();

  // On first sign-in the trigger stores email in display_name. Treat that
  // as "not yet set" so the form starts blank for a clean first impression.
  const initialDisplayName =
    profile?.display_name && profile.display_name !== profile.email
      ? profile.display_name
      : "";

  return (
    <div className="max-w-xl mx-auto">
      {isSetup ? (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Welcome!</h2>
          <p className="text-gray-500 mt-1">
            Let&apos;s set up your profile. Takes about 30 seconds.
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Your account</h2>
          <p className="text-gray-500 mt-1">
            Update your name, profile picture, and how peers can reach you.
          </p>
        </div>
      )}

      <AccountForm
        initialDisplayName={initialDisplayName}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initialShowInCommunity={profile?.show_in_community ?? true}
        initialPublicContact={profile?.public_contact ?? ""}
        email={user.email ?? ""}
        isSetup={isSetup}
      />
    </div>
  );
}
