"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGuestSession } from "@/lib/guest-auth";

const PUBLIC_ACCOUNT_PATHS = new Set(["/account/login", "/account/signup"]);

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useGuestSession();
  const isPublic = PUBLIC_ACCOUNT_PATHS.has(pathname);

  useEffect(() => {
    if (session === undefined) return;
    if (!session && !isPublic) {
      const next = encodeURIComponent(pathname);
      router.replace(`/account/login?next=${next}`);
    }
  }, [session, isPublic, pathname, router]);

  if (session === undefined && !isPublic) {
    return <div className="pt-32 container-px text-sm text-ink-500">Loading…</div>;
  }
  if (!session && !isPublic) return null;

  return <div className="pt-24 pb-20">{children}</div>;
}
