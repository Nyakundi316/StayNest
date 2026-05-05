import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-32 pb-20 container-px text-center">
      <div className="text-7xl mb-3">🏚️</div>
      <h1 className="h-display text-4xl mb-2">Page not found</h1>
      <p className="text-ink-500 mb-6">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link href="/" className="btn-primary px-5 py-2.5 text-sm inline-flex">
        Back to home
      </Link>
    </div>
  );
}
