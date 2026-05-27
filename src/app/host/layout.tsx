"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  clearHostSession,
  establishHostSession,
  guestAuth
} from "@/lib/guest-auth";
import { LogOut, KeyRound } from "lucide-react";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/host/login";

  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    guestAuth.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const hasSession = Boolean(data.session);
      if (!hasSession && !isLoginPage) {
        setAuthed(false);
        router.replace("/host/login");
        return;
      }
      if (!hasSession) {
        setAuthed(false);
        return;
      }

      try {
        await establishHostSession();
        if (!alive) return;
        setAuthed(true);
        if (isLoginPage) router.replace("/host");
      } catch {
        await clearHostSession();
        if (!alive) return;
        setAuthed(false);
        if (!isLoginPage) router.replace("/host/login");
      }
    });

    const { data: { subscription } } = guestAuth.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearHostSession();
        setAuthed(false);
        router.replace("/host/login");
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  const handleSignOut = async () => {
    await clearHostSession();
    await guestAuth.auth.signOut();
  };

  if (isLoginPage) return <>{children}</>;
  if (authed === null || !authed) return null;

  return (
    <div>
      <div className="bg-brand-600 text-white text-xs flex items-center justify-between px-6 py-2.5 sticky top-16 z-40">
        <div className="flex items-center gap-2">
          <KeyRound size={13} />
          <span className="font-semibold uppercase tracking-wider">Host mode</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
      {children}
    </div>
  );
}
