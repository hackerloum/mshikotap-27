import { NextResponse, type NextRequest } from "next/server";

/**
 * Soft gate for role dashboards.
 * Full Firebase session-cookie verification lands later.
 * Do NOT block demo client auth — the client auth guard + localStorage
 * session still owns access control in demo mode.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  let roleHint = "anonymous";
  if (path.startsWith("/admin")) roleHint = "admin";
  else if (path.startsWith("/advertiser")) roleHint = "advertiser";
  else if (path.startsWith("/user")) roleHint = "user";

  response.headers.set("x-mshiko-dashboard-role", roleHint);
  response.headers.set("x-mshiko-pathname", path);

  // Soft cookie presence check only — never redirect away in demo mode.
  const sessionHint =
    request.cookies.get("__session")?.value ||
    request.cookies.get("mshikotap_session")?.value;
  if (sessionHint) {
    response.headers.set("x-mshiko-session", "present");
  } else {
    response.headers.set("x-mshiko-session", "absent");
  }

  return response;
}

export const config = {
  matcher: ["/user/:path*", "/advertiser/:path*", "/admin/:path*"],
};
