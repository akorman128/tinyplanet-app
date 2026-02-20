import { useState, useEffect, useCallback, useMemo } from "react";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useProfile } from "@/hooks/useProfile";
import { useVibe } from "@/hooks/useVibe";
import { useTravelPlan } from "@/hooks/useTravelPlan";
import { reverseGeocode } from "@/utils/reverseGeocode";
import { Profile } from "@/types/profile";
import { TravelPlan } from "@/types/travelPlan";

export function useProfileScreen(userId?: string) {
  const profile = useRequireProfile();
  const { getProfile } = useProfile();
  const { getTopVibes, isLoaded: vibeIsLoaded } = useVibe();
  const { getActiveTravelPlan } = useTravelPlan();

  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanReadableLocation, setHumanReadableLocation] = useState<
    string | null
  >(null);
  const [geocoding, setGeocoding] = useState(false);
  const [topVibes, setTopVibes] = useState<
    { emoji: string; count: number }[]
  >([]);
  const [totalVibeCount, setTotalVibeCount] = useState(0);
  const [activeTravelPlan, setActiveTravelPlan] =
    useState<TravelPlan | null>(null);

  const isViewingOwnProfile = !userId;
  const displayProfile = useMemo(
    () => (isViewingOwnProfile ? profile : otherUserProfile),
    [isViewingOwnProfile, profile, otherUserProfile]
  );
  const mutualCount =
    (!isViewingOwnProfile && displayProfile?.mutual_friend_count) || 0;

  // Fetch other user's profile if userId is provided
  const fetchOtherUserProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getProfile({ userId });
      setOtherUserProfile(result);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchOtherUserProfile();
  }, [fetchOtherUserProfile]);

  // Fetch secondary data in parallel when displayProfile is available
  useEffect(() => {
    if (!displayProfile?.id) return;

    const promises: Promise<void>[] = [];

    if (vibeIsLoaded) {
      promises.push(
        (async () => {
          try {
            const result = await getTopVibes({
              userId: displayProfile.id,
              limit: 5,
            });
            setTopVibes(result.data);
            setTotalVibeCount(result.totalCount);
          } catch {
            // Silently fail for vibes
          }
        })()
      );
    }

    if (
      displayProfile.latitude != null &&
      displayProfile.longitude != null
    ) {
      promises.push(
        (async () => {
          setGeocoding(true);
          try {
            const result = await reverseGeocode(
              displayProfile.longitude!,
              displayProfile.latitude!,
              (freshData) => {
                setHumanReadableLocation(freshData.formattedAddress);
              }
            );
            setHumanReadableLocation(result.formattedAddress);
          } catch {
            setHumanReadableLocation(
              `${displayProfile.latitude!.toFixed(4)}, ${displayProfile.longitude!.toFixed(4)}`
            );
          } finally {
            setGeocoding(false);
          }
        })()
      );
    } else {
      setHumanReadableLocation(null);
    }

    if (isViewingOwnProfile) {
      promises.push(
        (async () => {
          try {
            const { data } = await getActiveTravelPlan();
            setActiveTravelPlan(data);
          } catch (err) {
            console.error("Error loading travel plan:", err);
          }
        })()
      );
    }

    Promise.allSettled(promises);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProfile?.id, vibeIsLoaded]);

  return {
    displayProfile,
    isViewingOwnProfile,
    topVibes,
    totalVibeCount,
    humanReadableLocation,
    geocoding,
    activeTravelPlan,
    mutualCount,
    loading,
    error,
    setError,
  };
}
