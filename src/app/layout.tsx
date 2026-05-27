import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "StayNest - Find your next stay",
  description:
    "StayNest helps travellers find trusted BnBs, apartments, villas and short-stay rooms across Kenya and beyond.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const themeScript = `
    (function() {
      try {
        var saved = localStorage.getItem("staynest-theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var dark = saved ? saved === "dark" : prefersDark;
        document.documentElement.classList.toggle("dark", dark);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-cream text-ink-900 transition-colors duration-200">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <PWARegister />
      </body>
    </html>
  );
}
