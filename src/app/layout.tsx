import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "StayNest — Find your next stay",
  description:
    "StayNest helps travellers find trusted BnBs, apartments, villas and short-stay rooms across Kenya and beyond."
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream text-ink-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
