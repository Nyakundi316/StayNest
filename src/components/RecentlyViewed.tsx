"use client";

import { useEffect, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { getProperties } from "@/lib/data";
import { authHeaders } from "@/lib/supabase-auth";
import type { Property } from "@/lib/types";

const GUEST_ID_KEY = "staynest_guest_id";
const RECENT_IDS_KEY = "staynest_recent_property_ids";
const MAX_ITEMS = 8;

function createGuestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now()}${Math.random().toString(36).slice(2, 14)}`;
}

function getGuestId() {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const next = createGuestId();
  localStorage.setItem(GUEST_ID_KEY, next);
  return next;
}

function updateLocalRecent(propertyId: string) {
  let existing: string[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_IDS_KEY) ?? "[]");
    existing = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    existing = [];
  }
  const next = [propertyId, ...existing.filter((id) => id !== propertyId)].slice(0, MAX_ITEMS);
  localStorage.setItem(RECENT_IDS_KEY, JSON.stringify(next));
  return next;
}

export default function RecentlyViewed({ currentPropertyId }: { currentPropertyId: string }) {
  const [items, setItems] = useState<Property[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const guestId = getGuestId();
      const localIds = updateLocalRecent(currentPropertyId);

      await fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ propertyId: currentPropertyId, guestId })
      }).catch(() => undefined);

      const recent = await fetch(`/api/recently-viewed?guestId=${encodeURIComponent(guestId)}`, {
        headers: await authHeaders()
      })
        .then((res) => res.json())
        .then((body) => (Array.isArray(body.properties) ? body.properties as Property[] : []))
        .catch(() => []);

      if (!alive) return;

      if (recent.length > 0) {
        setItems(recent.filter((p) => p.id !== currentPropertyId).slice(0, 4));
        setReady(true);
        return;
      }

      const all = await getProperties().catch(() => []);
      if (!alive) return;
      const byId = new Map(all.map((p) => [p.id, p]));
      setItems(
        localIds
          .filter((id) => id !== currentPropertyId)
          .map((id) => byId.get(id))
          .filter(Boolean)
          .slice(0, 4) as Property[]
      );
      setReady(true);
    };

    load();
    return () => {
      alive = false;
    };
  }, [currentPropertyId]);

  if (!ready || items.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Recently viewed
          </div>
          <h2 className="h-display mt-1 text-2xl">Pick up where you left off</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>
    </section>
  );
}
