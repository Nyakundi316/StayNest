"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Home as HomeIcon, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useGuestSession } from "@/lib/guest-auth";

const links = [
  { href: "/listings", label: "Stays" },
  { href: "/listings?listingType=sale", label: "For sale" },
  { href: "/listings?listingType=lease", label: "For lease" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const session = useGuestSession();
  const signedIn = Boolean(session);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !isHome || scrolled || open;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-cream/95 dark:bg-[#11151c]/95 backdrop-blur border-b border-ink-100 dark:border-white/10 text-ink-900 dark:text-ink-50"
          : "bg-transparent text-white"
      }`}
    >
      <div className="container-px h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className={`w-9 h-9 rounded-xl grid place-items-center ${
            solid ? "bg-brand-500 text-white" : "bg-white/95 text-brand-600"
          }`}>
            <HomeIcon size={18} />
          </span>
          <span className="font-semibold tracking-tight">StayNest</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                solid
                  ? "hover:bg-ink-100 dark:hover:bg-white/10 text-ink-700 dark:text-ink-100"
                  : "hover:bg-white/15 text-white/95"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={signedIn ? "/account/bookings" : "/account/login"}
            className={`ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
              solid
                ? "border-ink-200 dark:border-white/15 text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-white/10"
                : "border-white/30 text-white hover:bg-white/15"
            }`}
          >
            <User size={14} />
            {signedIn ? "My account" : "Sign in"}
          </Link>
          <Link
            href="/contact"
            className="ml-1 btn-primary px-4 py-2 text-sm"
          >
            List your property
          </Link>
          <ThemeToggle
            className={
              solid
                ? "border-ink-200 dark:border-white/15 text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-white/10"
                : "border-white/30 text-white hover:bg-white/15"
            }
          />
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle
            className={
              solid
                ? "border-ink-200 dark:border-white/15 text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-white/10"
                : "border-white/30 text-white hover:bg-white/15"
            }
          />
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 hover:bg-ink-100/50 dark:hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-cream dark:bg-[#11151c] border-t border-ink-100 dark:border-white/10">
          <div className="container-px py-3 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl hover:bg-ink-100 dark:hover:bg-white/10 text-ink-700 dark:text-ink-100"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={signedIn ? "/account/bookings" : "/account/login"}
              onClick={() => setOpen(false)}
              className="px-3 py-3 rounded-xl hover:bg-ink-100 dark:hover:bg-white/10 text-ink-700 dark:text-ink-100 inline-flex items-center gap-2"
            >
              <User size={15} />
              {signedIn ? "My account" : "Sign in"}
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-2 btn-primary py-3 text-sm"
            >
              List your property
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
