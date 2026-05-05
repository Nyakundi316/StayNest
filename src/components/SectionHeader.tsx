import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export default function SectionHeader({ eyebrow, title, subtitle, ctaHref, ctaLabel }: Props) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
            {eyebrow}
          </div>
        )}
        <h2 className="h-display text-3xl sm:text-4xl text-ink-900">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-ink-500 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-brand-600"
        >
          {ctaLabel ?? "View all"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
