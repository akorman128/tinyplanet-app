import { useCallback, useEffect, useState } from "react";
import {
  useQuery,
  UseQueryResult,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  CreateHangInput,
  CreateHangOutput,
  UpdateHangInput,
  HangDetail,
  HangMapLocation,
  GetHangLocationsOutput,
} from "@/types/hang";
import { HANG_MAX_ADVANCE_MS, HANG_PAST_GRACE_MS } from "@/utils/hangTime";
import { hapticLight } from "@/utils";
import { logger } from "@/utils/logger";

const validateStartsAt = (startsAt: string) => {
  const t = new Date(startsAt).getTime();
  if (isNaN(t)) throw new Error("Invalid date/time");
  if (t < Date.now() - HANG_PAST_GRACE_MS) {
    throw new Error("Hang time cannot be in the past");
  }
  if (t > Date.now() + HANG_MAX_ADVANCE_MS) {
    throw new Error("Hangs can be scheduled at most 7 days in advance");
  }
};

// RSVP changes touch the hang detail, the map pins, and the feed card.
const invalidateAfterRsvp = (queryClient: QueryClient, hangId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.hangs.detail(hangId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.hangs.locations });
  queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed() });
};

// --- Mutation hooks ---

export const useCreateHang = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHangInput): Promise<CreateHangOutput> => {
      const { location, title, description, starts_at, post_visibility } =
        input;

      if (!title.trim()) throw new Error("Title is required");
      validateStartsAt(starts_at);

      const { data, error } = await supabase.rpc("create_hang_with_post", {
        p_user_id: profile.id,
        p_location_lng: location.longitude,
        p_location_lat: location.latitude,
        p_location_name: location.name,
        p_title: title.trim(),
        p_description: description?.trim() || null,
        p_starts_at: starts_at,
        p_post_visibility: post_visibility || "mutuals",
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to create hang");
      return data[0] as CreateHangOutput;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.locations });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useUpdateHang = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateHangInput): Promise<CreateHangOutput> => {
      const {
        hang_id,
        location,
        title,
        description,
        starts_at,
        post_visibility,
      } = input;

      if (!title.trim()) throw new Error("Title is required");
      validateStartsAt(starts_at);

      const { data, error } = await supabase.rpc("update_hang_with_post", {
        p_hang_id: hang_id,
        p_location_lng: location.longitude,
        p_location_lat: location.latitude,
        p_location_name: location.name,
        p_title: title.trim(),
        p_description: description?.trim() || null,
        p_starts_at: starts_at,
        p_post_visibility: post_visibility || null,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Failed to update hang");
      return data[0] as CreateHangOutput;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.locations });
      queryClient.invalidateQueries({
        queryKey: queryKeys.hangs.detail(input.hang_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useDeleteHang = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hangId: string) => {
      const { error } = await supabase.rpc("delete_hang_with_post", {
        p_hang_id: hangId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hangs.locations });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
};

export const useRsvpToHang = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hangId: string) => {
      const { error } = await supabase
        .from("hang_attendees")
        .insert({ hang_id: hangId, user_id: profile.id, status: "going" });
      if (error) throw error;
    },
    onSuccess: (_data, hangId) => invalidateAfterRsvp(queryClient, hangId),
  });
};

export const useRemoveHangRsvp = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hangId: string) => {
      const { error } = await supabase
        .from("hang_attendees")
        .delete()
        .eq("hang_id", hangId)
        .eq("user_id", profile.id);
      if (error) throw error;
    },
    onSuccess: (_data, hangId) => invalidateAfterRsvp(queryClient, hangId),
  });
};

/**
 * Optimistic RSVP toggle shared by the feed card and the detail screen. Tracks a
 * local going/count for instant feedback and rolls back on error; the underlying
 * mutations invalidate the feed/detail so the optimistic state is reconciled.
 */
export const useHangRsvpToggle = (
  hangId: string,
  initial: { going: boolean; count?: number },
  options?: { disabled?: boolean }
) => {
  const rsvp = useRsvpToHang();
  const unrsvp = useRemoveHangRsvp();
  const [going, setGoing] = useState(initial.going);
  const [count, setCount] = useState(initial.count ?? 0);

  const pending = rsvp.isPending || unrsvp.isPending;

  // Resync from server state, but never while a toggle is in flight — otherwise
  // an unrelated refetch (e.g. realtime fired by another attendee) would revert
  // the optimistic value mid-action.
  useEffect(() => {
    if (pending) return;
    setGoing(initial.going);
    setCount(initial.count ?? 0);
  }, [initial.going, initial.count, pending]);

  const toggle = async () => {
    if (pending || options?.disabled) return;
    hapticLight();
    const wasGoing = going;
    setGoing(!wasGoing);
    setCount((c) => (wasGoing ? Math.max(0, c - 1) : c + 1));
    try {
      if (wasGoing) await unrsvp.mutateAsync(hangId);
      else await rsvp.mutateAsync(hangId);
    } catch (err) {
      setGoing(wasGoing);
      setCount((c) => (wasGoing ? c + 1 : Math.max(0, c - 1)));
      logger.error("Error toggling RSVP:", err);
    }
  };

  return { going, count, pending, toggle };
};

// --- Query hooks ---

export const useGetHangDetail = (
  hangId?: string
): UseQueryResult<HangDetail | null> => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.hangs.detail(hangId!),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_hang_detail", {
        p_hang_id: hangId!,
      });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as HangDetail;
    },
    enabled: !!hangId,
  });
};

export const useGetHangLocations =
  (): UseQueryResult<GetHangLocationsOutput> => {
    const { supabase } = useSupabase();
    const profile = useRequireProfile();

    return useQuery({
      queryKey: queryKeys.hangs.locations,
      queryFn: async () => {
        const { data, error } = await supabase.rpc(
          "get_active_hang_locations",
          {
            p_user_id: profile.id,
          }
        );
        if (error) throw error;
        return { data: (data as HangMapLocation[]) || [] };
      },
    });
  };

// --- Realtime subscription ---

export const useSubscribeToHangAttendees = () => {
  const { isLoaded, supabase } = useSupabase();

  return useCallback(
    (hangId: string, onChange: () => void): (() => void) => {
      if (!isLoaded) return () => {};

      const channel = supabase
        .channel(`hang:${hangId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "hang_attendees",
            filter: `hang_id=eq.${hangId}`,
          },
          () => onChange()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [isLoaded, supabase]
  );
};
