import {
  useGetFriendLocations,
  useGetFriendHometownLocations,
} from "./useFriends";
import { useGetTravelPlanLocations } from "./useTravelPlan";
import { useGetHangLocations } from "./useHangs";
import { useGetListLocations } from "./useLists";
import { useLocation } from "./useLocation";
import { useEffect } from "react";

export const useMapData = () => {
  const friendLocations = useGetFriendLocations();
  const hometownLocations = useGetFriendHometownLocations();
  const travelPlanLocations = useGetTravelPlanLocations();
  const hangLocations = useGetHangLocations();
  const listLocations = useGetListLocations();
  const {
    location: userLocationObj,
    getCurrentLocation,
    updateLocationInDatabase,
  } = useLocation();

  // Convert user location to [longitude, latitude] tuple for Mapbox
  const userLocation: [number, number] | null = userLocationObj
    ? [userLocationObj.longitude, userLocationObj.latitude]
    : null;

  // Initial location fetch + DB update on mount
  useEffect(() => {
    const init = async () => {
      await getCurrentLocation(false);
      await updateLocationInDatabase(false);
    };
    init();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    friendLocations: friendLocations.data ?? null,
    hometownLocations: hometownLocations.data ?? null,
    travelPlanLocations: travelPlanLocations.data?.data ?? [],
    hangLocations: hangLocations.data?.data ?? [],
    listLocations: listLocations.data ?? [],
    userLocation,
    loading:
      friendLocations.isLoading ||
      hometownLocations.isLoading ||
      travelPlanLocations.isLoading ||
      hangLocations.isLoading ||
      listLocations.isLoading,
    error:
      (
        friendLocations.error ||
        hometownLocations.error ||
        travelPlanLocations.error ||
        hangLocations.error ||
        listLocations.error
      )?.message ?? null,
  };
};
