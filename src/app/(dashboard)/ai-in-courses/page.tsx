import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Paste the Airtable share URL here when the base is ready.
// Get it from Airtable: Share view → Create a shareable link →
// Embed this view on your site → copy the src URL of the iframe.
const AIRTABLE_EMBED_URL: string | null = null;

export default async function AiInCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-700">AI in Courses</h2>
        <p className="mt-1 text-gray-500">
          A look book of how AI is being used in ASU courses — screenshots,
          links, and notes submitted by faculty and staff.
        </p>
      </section>

      {AIRTABLE_EMBED_URL ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <iframe
            src={AIRTABLE_EMBED_URL}
            title="AI in Courses — submissions"
            className="w-full border-0"
            style={{ height: "80vh", minHeight: 600 }}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-asu-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-asu-turquoise"
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
          </div>
          <p className="text-gray-700 font-medium mb-1">
            Coming soon
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            We&apos;re building an Airtable-powered form for faculty and staff
            to submit examples of AI in their courses. Once the base is live,
            submissions will show up here.
          </p>
        </div>
      )}
    </div>
  );
}
