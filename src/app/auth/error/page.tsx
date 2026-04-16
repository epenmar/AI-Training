import Link from "next/link";

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const messages: Record<string, { title: string; body: string }> = {
    domain: {
      title: "ASU Account Required",
      body: "This application is restricted to ASU accounts. Please sign in with your @asu.edu Google account.",
    },
    unknown: {
      title: "Authentication Error",
      body: "Something went wrong during sign-in. Please try again.",
    },
  };

  const { title, body } = messages[reason ?? "unknown"] ?? messages.unknown;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-asu-maroon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-700 mb-2">{title}</h1>
        <p className="text-gray-500 mb-6">{body}</p>
        <Link
          href="/login"
          className="inline-block bg-asu-maroon text-white px-6 py-3 rounded-lg font-medium hover:bg-sidebar-hover transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
