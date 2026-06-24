import { useState, useEffect } from "react";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useGetProfile } from "@/hooks/useProfile";
import { useGetTopVibes } from "@/hooks/useVibe";
import { useGetActiveTravelPlan } from "@/hooks/useTravelPlan";
import { reverseGeocode } from "@/utils/reverseGeocode";

export function useProfileScreen(userId?: string) {
  const profile = useRequireProfile();
  const isViewingOwnProfile = !userId;
  const targetId = userId || profile.id;

  // Declarative queries
  const profileQuery = useGetProfile(targetId);
  const topVibesQuery = useGetTopVibes(profileQuery.data?.id);
  const activeTravelPlanQuery = useGetActiveTravelPlan(
    isViewingOwnProfile ? profile.id : undefined
  );

  // The display profile: prefer the fetched profile, fall back to store for own profile
  const displayProfile =
    profileQuery.data ?? (isViewingOwnProfile ? profile : null);

  // Derived from query results
  const topVibes = topVibesQuery.data?.data ?? [];
  const totalVibeCount = topVibesQuery.data?.totalCount ?? 0;
  const activeTravelPlan = activeTravelPlanQuery.data?.data ?? null;

  // Geocoding — this is NOT a Supabase read, so it stays as useState/useEffect
  const [humanReadableLocation, setHumanReadableLocation] = useState<
    string | null
  >(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (displayProfile?.latitude == null || displayProfile?.longitude == null) {
      setHumanReadableLocation(null);
      return;
    }

    setGeocoding(true);
    reverseGeocode(
      displayProfile.longitude!,
      displayProfile.latitude!,
      (freshData) => {
        setHumanReadableLocation(freshData.formattedAddress);
      }
    )
      .then((result) => {
        setHumanReadableLocation(result.formattedAddress);
      })
      .catch(() => {
        setHumanReadableLocation(
          `${displayProfile.latitude!.toFixed(4)}, ${displayProfile.longitude!.toFixed(4)}`
        );
      })
      .finally(() => {
        setGeocoding(false);
      });
  }, [displayProfile?.latitude, displayProfile?.longitude]);

  return {
    displayProfile,
    isViewingOwnProfile,
    topVibes,
    totalVibeCount,
    humanReadableLocation,
    geocoding,
    activeTravelPlan,
    loading: profileQuery.isPending,
    error: profileQuery.error?.message ?? null,
    setError: () => {}, // Keep interface compatible — consumers may call setError(null)
  };
}
