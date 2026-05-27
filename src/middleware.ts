import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import { HOST_SESSION_COOKIE, verifyHostSessionCookie } from "@/lib/host-session";

export const config = {
  matcher: ["/admin/:path*", "/host/:path*"]
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = await verifyAdminSessionCookie(cookie);
    if (session) return NextResponse.next();
    return redirectToLogin(req, "/admin/login", pathname + search, !!cookie, ADMIN_SESSION_COOKIE, "/admin");
  }

  if (pathname.startsWith("/host")) {
    if (pathname === "/host/login") return NextResponse.next();
    const cookie = req.cookies.get(HOST_SESSION_COOKIE)?.value;
    const session = await verifyHostSessionCookie(cookie);
    if (session) return NextResponse.next();
    return redirectToLogin(req, "/host/login", pathname + search, !!cookie, HOST_SESSION_COOKIE, "/host");
  }

  return NextResponse.next();
}

function redirectToLogin(
  req: NextRequest,
  loginPath: string,
  next: string,
  hadCookie: boolean,
  cookieName: string,
  cookiePath: string
) {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = `?next=${encodeURIComponent(next)}`;

  const res = NextResponse.redirect(url);
  if (hadCookie) {
    res.cookies.set(cookieName, "", { path: cookiePath, maxAge: 0 });
  }
  return res;
}
