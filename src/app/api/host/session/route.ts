import { NextRequest, NextResponse } from "next/server";
import { requireHost } from "@/lib/host-auth";
import {
  HOST_SESSION_COOKIE,
  createHostSessionCookie,
  hostSessionMaxAge
} from "@/lib/host-session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/host"
};

export async function POST(req: NextRequest) {
  const result = await requireHost(req);
  if (result.error) return result.error;
  const { host } = result;

  try {
    const value = await createHostSessionCookie(host.userId, host.ownerId, host.email);
    const res = NextResponse.json({ ok: true, ownerId: host.ownerId });
    res.cookies.set(HOST_SESSION_COOKIE, value, {
      ...cookieOptions,
      maxAge: hostSessionMaxAge()
    });
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Could not establish host session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(HOST_SESSION_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0
  });
  return res;
}
