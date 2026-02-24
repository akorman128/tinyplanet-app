import { useState, useEffect, useCallback } from "react";
import { useFriends } from "./useFriends";
import { useTravelPlan } from "./useTravelPlan";
import { useLists } from "./useLists";
import { useLocation } from "./useLocation";
import { GeoJSONFeatureCollection } from "@/types/friendship";
import { TravelPlanMapLocation } from "@/types/travelPlan";
import { ListLocation } from "@/types/list";

export const useMapData = () => {
  const { getFriendLocations, getFriendHometownLocations } = useFriends();
  const { getTravelPlanLocations } = useTravelPlan();
  const { getListLocations } = useLists();
  const {
    location: userLocationObj,
    getCurrentLocation,
    updateLocationInDatabase,
  } = useLocation();

  const [friendLocations, setFriendLocations] =
    useState<GeoJSONFeatureCollection | null>(null);
  const [hometownLocations, setHometownLocations] =
    useState<GeoJSONFeatureCollection | null>(null);
  const [travelPlanLocations, setTravelPlanLocations] = useState<
    TravelPlanMapLocation[]
  >([]);
  const [listLocations, setListLocations] = useState<ListLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert user location object to [longitude, latitude] tuple for Mapbox
  const userLocation: [number, number] | null = userLocationObj
    ? [userLocationObj.longitude, userLocationObj.latitude]
    : null;

  const loadFriendLocations = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setError(null);

        await getCurrentLocation(forceRefresh);
        await updateLocationInDatabase(forceRefresh);

        const [locations, hometowns, travelPlans, viewableLists] =
          await Promise.all([
            getFriendLocations(),
            getFriendHometownLocations(),
            getTravelPlanLocations(),
            getListLocations(),
          ]);

        setFriendLocations(locations);
        setHometownLocations(hometowns);
        setTravelPlanLocations(travelPlans.data);
        setListLocations(viewableLists);
      } catch (err) {
        console.error("Error loading friend locations:", err);
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        setError(errorMessage);
      }
    },
    [
      getFriendLocations,
      getFriendHometownLocations,
      getTravelPlanLocations,
      getListLocations,
      updateLocationInDatabase,
      getCurrentLocation,
    ]
  );

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadFriendLocations();
      setLoading(false);
    };
    initialLoad();
  }, [loadFriendLocations]);

  return {
    friendLocations,
    hometownLocations,
    travelPlanLocations,
    listLocations,
    userLocation,
    loading,
    error,
  };
};
