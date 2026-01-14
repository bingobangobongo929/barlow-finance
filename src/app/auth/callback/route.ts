import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// SECURITY: Whitelist of safe redirect paths to prevent open redirect attacks
const SAFE_REDIRECT_PATHS = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/projects",
  "/loans",
  "/vehicles",
  "/upcoming",
  "/analytics",
  "/settings",
  "/calendar",
];

function getSafeRedirectPath(next: string | null): string {
  // Default to dashboard
  if (!next) return "/dashboard";

  // Must start with / and not contain protocol markers
  if (!next.startsWith("/") || next.includes("://") || next.includes("//")) {
    return "/dashboard";
  }

  // Check if path starts with any whitelisted path
  const isAllowed = SAFE_REDIRECT_PATHS.some(
    (safePath) => next === safePath || next.startsWith(`${safePath}/`)
  );

  return isAllowed ? next : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // SECURITY: Validate redirect path
  const safeRedirect = getSafeRedirectPath(next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
