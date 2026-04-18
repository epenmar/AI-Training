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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          email={user.email ?? ""}
          displayName={profile?.display_name ?? user.email ?? "User"}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-gray-100 p-6 pb-28 sm:pb-6"
        >
          {children}
        </main>
      </div>
      <AiAssistant />
    </div>
  );
}
