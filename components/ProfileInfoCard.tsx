import React from "react";
import { GlassInfoCard, GlassInfoItem } from "@/design-system";
import { formatBirthday } from "@/utils";

interface ProfileInfoCardProps {
  birthday?: string;
  hometown?: string;
  hasLocation: boolean;
  humanReadableLocation: string | null;
  geocoding: boolean;
}

export function ProfileInfoCard({
  birthday,
  hometown,
  hasLocation,
  humanReadableLocation,
  geocoding,
}: ProfileInfoCardProps) {
  if (!birthday && !hometown && !hasLocation) return null;

  return (
    <GlassInfoCard className="w-full">
      {birthday && (
        <GlassInfoItem label="Birthday" value={formatBirthday(birthday)} />
      )}
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
