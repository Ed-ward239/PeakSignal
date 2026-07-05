"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { placeImage } from "@/lib/images";
import { cn } from "@/lib/cn";

/** Place photo for an itinerary slot, with a tasteful gradient fallback. */
export function SlotImage({
  activity,
  destination,
  imageUrl,
  className,
}: {
  activity: string;
  destination: string;
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl ?? placeImage(activity, destination);

  if (failed) {
    return (
      <div className={cn("grid place-items-center bg-gradient-to-br from-accent/30 to-accent-soft/10", className)}>
        <MapPin className="text-white/60" size={22} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={activity}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
