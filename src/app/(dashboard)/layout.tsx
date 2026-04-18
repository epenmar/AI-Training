import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { AiAssistant } from "@/components/assistant/AiAssistant";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col md:overflow-hidden">
        <TopNav
          email={user.email ?? ""}
          displayName={profile?.display_name ?? user.email ?? "User"}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main
          id="main-content"
          className="flex-1 bg-gray-100 p-6 pb-28 sm:pb-6 md:overflow-y-auto"
        >
          {children}
        </main>
      </div>
      <AiAssistant />
    </div>
  );
}
