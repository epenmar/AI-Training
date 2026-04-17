import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths that don't require auth
  const publicPaths = ["/login", "/auth/callback", "/auth/error"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access login, redirect to dashboard
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // First-time setup: send users to /account?setup=1 until they've picked a
  // real name. Earlier code auto-filled display_name with the email or the
  // email prefix, so treat those as "not set."
  if (
    user &&
    !isPublicPath &&
    !request.nextUrl.pathname.startsWith("/account")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .single();
    const name = profile?.display_name?.trim();
    const emailPrefix = profile?.email?.split("@")[0];
    const needsSetup =
      !name || name === profile?.email || name === emailPrefix;
    if (needsSetup) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.searchParams.set("setup", "1");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
