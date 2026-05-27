"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";

interface SocialShareProps {
  title: string;
  image?: string;
  url?: string;
}

export default function SocialShare({ title, image, url }: SocialShareProps) {
  const [currentUrl, setCurrentUrl] = useState(url ?? "");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (!url) setCurrentUrl(window.location.href);
    setCanNativeShare(Boolean(navigator.share));
  }, [url]);

  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);
    return {
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    };
  }, [currentUrl, title]);

  const copy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (!currentUrl || !navigator.share) return;
    await navigator.share({
      title,
      text: image ? `${title}\n${image}` : title,
      url: currentUrl
    });
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        <Share2 size={13} className="text-brand-500" />
        Share this listing
      </div>
      <div className="flex flex-wrap gap-2">
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className="btn-secondary px-3 py-2 text-sm">
            <Share2 size={14} className="mr-1.5" />
            Share
          </button>
        )}
        <button type="button" onClick={copy} className="btn-secondary px-3 py-2 text-sm">
          {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a href={links.whatsapp} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2 text-sm">
          <MessageCircle size={14} className="mr-1.5" />
          WhatsApp
        </a>
        <a href={links.facebook} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2 text-sm">
          <Send size={14} className="mr-1.5" />
          Facebook
        </a>
        <a href={links.x} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2 text-sm">
          X
        </a>
      </div>
    </div>
  );
}
