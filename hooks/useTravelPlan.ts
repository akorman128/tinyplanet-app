import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  TravelPlan,
  TravelPlanWithCoordinates,
  CreateTravelPlanInput,
  CreateTravelPlanOutput,
  UpdateTravelPlanInput,
  GetActiveTravelPlanOutput,
  GetTravelPlanLocationsOutput,
  TravelPlanMapLocation,
} from "@/types/travelPlan";

// --- Mutation hooks ---

export const useCreateTravelPlan = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateTravelPlanInput
    ): Promise<CreateTravelPlanOutput> => {
      const { destination, start_date, duration_days, post_visibility, text } =
        input;

      if (duration_days < 1 || duration_days > 31) {
        throw new Error("Duration must be between 1 and 31 days");
      }

      const [year, month, day] = start_date.split("-").map(Number);
      const startDate = new Date(year, month - 1, day);
      if (isNaN(startDate.getTime())) throw new Error("Invalid start date");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today)
        throw new Error("Start date cannot be in the past");

      const { data, error } = await supabase.rpc(
        "create_travel_plan_with_post",
        {
          p_user_id: profile.id,
          p_destination_location_lng: destination.longitude,
          p_destination_location_lat: destination.latitude,
          p_destination_name: destination.name,
          p_start_date: start_date,
          p_duration_days: duration_days,
          p_post_visibility: post_visibility || "friends",
          p_text: text || null,
        }
      );

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Failed to create travel plan");

      return data[0] as CreateTravelPlanOutput;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.travelPlans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useUpdateTravelPlan = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: UpdateTravelPlanInput
    ): Promise<CreateTravelPlanOutput> => {
      const {
        travel_plan_id,
        destination,
        start_date,
        duration_days,
        post_visibility,
        text,
      } = input;

      if (duration_days < 1 || duration_days > 31) {
        throw new Error("Duration must be between 1 and 31 days");
      }

      const startDate = new Date(start_date);
      if (isNaN(startDate.getTime())) throw new Error("Invalid start date");

      const { data, error } = await supabase.rpc(
        "update_travel_plan_with_post",
        {
          p_travel_plan_id: travel_plan_id,
          p_destination_location_lng: destination.longitude,
          p_destination_location_lat: destination.latitude,
          p_destination_name: destination.name,
          p_start_date: start_date,
          p_duration_days: duration_days,
          p_post_visibility: post_visibility || null,
          p_text: text || null,
        }
      );

      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Failed to update travel plan");

      return data[0] as CreateTravelPlanOutput;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.travelPlans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useCancelTravelPlan = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (travelPlanId: string) => {
      const { error } = await supabase.rpc("cancel_travel_plan_with_post", {
        p_travel_plan_id: travelPlanId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.travelPlans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

// --- Query hooks ---

export const useGetActiveTravelPlan = (
  userId?: string
): UseQueryResult<GetActiveTravelPlanOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const targetUserId = userId ?? profile.id;

  return useQuery({
    queryKey: queryKeys.travelPlans.active(targetUserId),
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("travel_plans")
        .select("*")
        .eq("user_id", targetUserId)
        .gte("end_date", today)
        .maybeSingle();
      if (error) throw error;
      return { data: data as TravelPlan | null };
    },
  });
};

export const useGetTravelPlans = (
  userId?: string
): UseQueryResult<{ data: TravelPlan[] }> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const targetUserId = userId ?? profile.id;

  return useQuery({
    queryKey: queryKeys.travelPlans.byUser(targetUserId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("travel_plans")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data: (data as TravelPlan[]) || [] };
    },
  });
};

export const useGetTravelPlanLocations =
  (): UseQueryResult<GetTravelPlanLocationsOutput> => {
    const { supabase } = useSupabase();
    const profile = useRequireProfile();

    return useQuery({
      queryKey: queryKeys.travelPlans.locations,
      queryFn: async () => {
        const { data, error } = await supabase.rpc(
          "get_active_travel_plan_locations",
          {
            p_user_id: profile.id,
          }
        );
        if (error) throw error;
        return { data: (data as TravelPlanMapLocation[]) || [] };
      },
    });
  };

export const useGetTravelPlanByPostId = (
  postId?: string
): UseQueryResult<TravelPlanWithCoordinates | null> => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.travelPlans.byPostId(postId!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_travel_plan_by_post_id", {
        p_post_id: postId!,
      });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as TravelPlanWithCoordinates;
    },
    enabled: !!postId,
  });
};
