import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/navigation";

const intlMiddleware = createMiddleware(routing);

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/invite"];

// Routes that are completely public (no locale prefix handling needed)
const staticRoutes = ["/api", "/_next", "/favicon.ico", "/icon", "/apple-icon"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static routes
  if (staticRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle Supabase session
  const { supabaseResponse, user } = await updateSession(request);

  // Extract locale from path or use default
  const localeMatch = pathname.match(/^\/(en|da)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "en";
  const pathWithoutLocale = localeMatch
    ? pathname.replace(/^\/(en|da)/, "") || "/"
    : pathname;

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute && pathWithoutLocale !== "/") {
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicRoute && !pathWithoutLocale.startsWith("/invite")) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Redirect root to dashboard for authenticated users
  if (isAuthenticated && (pathWithoutLocale === "/" || pathWithoutLocale === "")) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Redirect root to login for unauthenticated users
  if (!isAuthenticated && (pathWithoutLocale === "/" || pathWithoutLocale === "")) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Apply internationalization middleware
  const intlResponse = intlMiddleware(request);

  // Merge cookies from Supabase response
  if (intlResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie);
    });
    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
