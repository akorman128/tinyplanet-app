import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";

import { Profile } from "@/types/profile";
import { useProfileStore } from "@/stores/profileStore";
import { useSupabase } from "./useSupabase";
import { queryKeys } from "@/lib/queryKeys";
import { useLocationStore } from "@/stores/locationStore";
import { applyLocationNoise } from "@/utils/locationNoise";

// --- Types ---

interface CreateProfileDto {
  id: string;
  phone_number: string;
  full_name: string;
  hometown: string;
  birthday: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  hometown_location?: {
    latitude: number;
    longitude: number;
  };
  invited_by?: string;
}

interface UpdateProfileDto {
  updateData: Partial<Profile>;
}

// --- Mutation hooks ---

export const useCreateProfile = () => {
  const { supabase } = useSupabase();
  const { setProfileState } = useProfileStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProfileDto): Promise<Profile> => {
      const {
        id,
        phone_number,
        full_name,
        hometown,
        birthday,
        location,
        hometown_location,
        invited_by,
      } = input;

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id,
          phone_number,
          full_name,
          avatar_url: "",
          website: "",
          hometown,
          birthday,
          location: location
            ? (() => {
                const radiusMiles =
                  useLocationStore.getState().locationPrivacyRadiusMiles;
                const noised = applyLocationNoise(location, radiusMiles);
                return `POINT(${noised.longitude} ${noised.latitude})`;
              })()
            : null,
          hometown_location: hometown_location
            ? `POINT(${hometown_location.longitude} ${hometown_location.latitude})`
            : null,
          invited_by,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setProfileState(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
};

export const useUpdateProfile = () => {
  const { supabase } = useSupabase();
  const { profileState, setProfileState } = useProfileStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileDto): Promise<Profile> => {
      if (!profileState) {
        throw new Error("Profile not loaded. Cannot update profile.");
      }

      const updatePayload = {
        ...input.updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", profileState.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      if (!profileState) return { previousState: null, previousQuery: null };

      const previousState = profileState;
      const optimisticProfile = {
        ...profileState,
        ...input.updateData,
        updated_at: new Date().toISOString(),
      };
      setProfileState(optimisticProfile);

      // Also update the query cache so displayProfile reflects changes immediately
      const queryKey = queryKeys.profile.detail(profileState.id);
      await queryClient.cancelQueries({ queryKey });
      const previousQuery = queryClient.getQueryData<Profile>(queryKey);
      if (previousQuery) {
        queryClient.setQueryData<Profile>(queryKey, {
          ...previousQuery,
          ...input.updateData,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousState, previousQuery };
    },
    onError: (_error, _input, context) => {
      if (context?.previousState) {
        setProfileState(context.previousState);
      }
      if (context?.previousQuery && context?.previousState) {
        queryClient.setQueryData(
          queryKeys.profile.detail(context.previousState.id),
          context.previousQuery
        );
      }
    },
    onSuccess: (data) => {
      setProfileState(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
};

// --- Query functions ---

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
  currentUserId: string | null
): Promise<Profile> {
  const { data, error } = await supabase.rpc("get_profile", {
    p_user_id: userId,
    p_current_user_id: currentUserId,
  });
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Profile not found for user ${userId}`);
  }
  return data[0];
}

// --- Query hooks ---

export const useGetProfile = (userId?: string): UseQueryResult<Profile> => {
  const { supabase } = useSupabase();
  const { profileState } = useProfileStore();

  return useQuery({
    queryKey: queryKeys.profile.detail(userId!),
    queryFn: () => fetchProfile(supabase, userId!, profileState?.id ?? null),
    enabled: !!userId,
  });
};
