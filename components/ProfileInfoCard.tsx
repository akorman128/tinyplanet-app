import React from "react";
import { GlassInfoCard, GlassInfoItem } from "@/design-system";
import { formatBirthday } from "@/utils";

interface ProfileInfoCardProps {
  hometown?: string;
  hasLocation: boolean;
  humanReadableLocation: string | null;
  geocoding: boolean;
}

export function ProfileInfoCard({
  hometown,
  hasLocation,
  humanReadableLocation,
  geocoding,
}: ProfileInfoCardProps) {
  if (!hometown && !hasLocation) return null;

  return (
    <GlassInfoCard className="w-full">
      {hometown && <GlassInfoItem label="Hometown" value={hometown} />}
      {hasLocation && (
        <GlassInfoItem
          label="Current Location"
          value={humanReadableLocation || "Unknown location"}
          loading={geocoding}
        />
      )}
    </GlassInfoCard>
  );
}
