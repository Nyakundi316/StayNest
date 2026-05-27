import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionMaxAge,
  createAdminSessionCookie
} from "@/lib/admin-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/admin"
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const value = await createAdminSessionCookie(auth.user.email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, value, {
      ...cookieOptions,
      maxAge: adminSessionMaxAge()
    });
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Could not establish admin session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0
  });
  return res;
}
