"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase-auth";
import { LogOut, ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data }) => {
      const hasSession = Boolean(data.session);
      setAuthed(hasSession);
      if (!hasSession && !isLoginPage) {
        router.replace("/admin/login");
      }
      // Already logged in, redirect away from login page
      if (hasSession && isLoginPage) {
        router.replace("/admin");
      }
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuthed(false);
        router.replace("/admin/login");
      }
      if (event === "SIGNED_IN") {
        setAuthed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  const handleSignOut = async () => {
    await supabaseAuth.auth.signOut();
  };

  // Login page: render immediately, no auth bar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Still resolving session — render nothing to prevent flash
  if (authed === null || !authed) return null;

  return (
    <div>
      <div className="bg-ink-900 text-white text-xs flex items-center justify-between px-6 py-2.5 sticky top-16 z-40">
        <div className="flex items-center gap-2 text-ink-300">
          <ShieldCheck size={13} className="text-brand-400" />
          <span className="font-semibold uppercase tracking-wider">Admin mode</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-ink-400 hover:text-white transition-colors"
        >
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
      {children}
    </div>
  );
}
