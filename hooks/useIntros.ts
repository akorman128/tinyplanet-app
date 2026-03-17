import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  IntroWithIntroducer,
  CreateIntroInput,
  GetIntroOutput,
} from "@/types/intro";

// --- Helpers ---

const orderUserIds = (userId1: string, userId2: string): [string, string] => {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
};

// --- Query hooks ---

export const useGetIntro = (friendId?: string) => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery<GetIntroOutput>({
    queryKey: queryKeys.intros.byFriend(friendId!),
    queryFn: async () => {
      const [user_a, user_b] = orderUserIds(profile.id, friendId!);

      const { data, error } = await supabase
        .from("intros")
        .select(
          `*, introducer:profiles!intros_introducer_id_fkey(id, full_name, avatar_url)`
        )
        .eq("user_id_a", user_a)
        .eq("user_id_b", user_b)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return { data: (data as unknown as IntroWithIntroducer) ?? null };
    },
    enabled: !!friendId,
  });
};

// --- Mutation hooks ---

export const useCreateIntro = () => {
  const { supabase } = useSupabase();
  useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIntroInput) => {
      const { data, error } = await supabase.rpc("create_intro", {
        p_user_a_id: input.userAId,
        p_user_b_id: input.userBId,
        p_message: input.message,
      });

      if (error) throw error;
      return { introId: data as string };
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.intros.byFriend(input.userAId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.intros.byFriend(input.userBId),
      });
    },
  });
};
