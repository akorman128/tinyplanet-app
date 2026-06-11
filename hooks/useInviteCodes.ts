import { SupabaseClient } from "@supabase/supabase-js";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

import { useProfileStore } from "@/stores/profileStore";
import { useRequireProfile } from "./useRequireProfile";
import { useSupabase } from "./useSupabase";
import { queryKeys } from "@/lib/queryKeys";
import { InviteCode, InviteCodeStatus } from "../types/invite_code";
import { generateInviteCode } from "../utils/inviteCode";
import { logger } from "@/utils/logger";

// --- Types ---

export interface GetInviteCodesDto {
  filters: {
    userId?: string;
    code?: string;
    startDate?: Date;
    endDate?: Date;
    status?: InviteCodeStatus;
  };
}

export interface GetInviteCodesOutputDto {
  data: InviteCode[];
}

interface CreateInviteCodeDto {
  code?: string;
  expires_at: Date;
}

interface CreateInviteCodeOutputDto {
  data: InviteCode;
  code: string;
}

interface SendInviteCodeDto {
  phone_number: string;
  invite_code: string;
  inviter_name?: string;
}

interface SendInviteCodeOutputDto {
  success: boolean;
  message: string;
  messageSid?: string;
}

interface UpdateInviteCodeDto {
  inviteCodeId: string;
  status: InviteCodeStatus;
  redeemed_at?: string;
}

interface UpdateInviteCodeOutputDto {
  data: InviteCode;
}

// --- Standalone fetch function ---

export async function fetchInviteCodes(
  supabase: SupabaseClient,
  filters: GetInviteCodesDto["filters"]
): Promise<GetInviteCodesOutputDto> {
  let query = supabase
    .from("invite_codes")
    .select("*")
    .eq("status", filters?.status ?? InviteCodeStatus.ACTIVE)
    .order("created_at", { ascending: false });

  if (filters?.code) query = query.eq("code", filters.code);
  if (filters?.userId) query = query.eq("inviter_id", filters.userId);
  if (filters?.startDate)
    query = query.gte("created_at", filters.startDate.toISOString());
  if (filters?.endDate)
    query = query.lte("created_at", filters.endDate.toISOString());

  const { data, error } = await query;
  if (error) {
    logger.error("Supabase error:", error);
    throw error;
  }
  return { data };
}

// --- Mutation hooks ---

export const useCreateInviteCode = () => {
  const { supabase } = useSupabase();
  const { profileState } = useProfileStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateInviteCodeDto
    ): Promise<CreateInviteCodeOutputDto> => {
      if (!profileState) throw new Error("Profile required");
      const { code: providedCode, expires_at } = input;

      if (providedCode) {
        const { data, error } = await supabase
          .from("invite_codes")
          .insert({
            code: providedCode,
            inviter_id: profileState.id,
            status: "active",
            expires_at,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505")
            throw new Error("Code already exists, please try again");
          throw error;
        }
        return { data, code: providedCode };
      }

      const maxRetries = 5;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const generatedCode = generateInviteCode();
        const { data, error } = await supabase
          .from("invite_codes")
          .insert({
            code: generatedCode,
            inviter_id: profileState.id,
            status: "active",
            expires_at,
          })
          .select()
          .single();

        if (!error) return { data, code: generatedCode };
        if (error.code === "23505" && attempt < maxRetries - 1) continue;
        if (error.code === "23505")
          throw new Error(
            "Failed to generate unique invite code after multiple attempts"
          );
        throw error;
      }
      throw new Error("Failed to create invite code");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes.all });
    },
  });
};

export const useSendInviteCode = () => {
  const { supabase } = useSupabase();
  const { profileState } = useProfileStore();

  return useMutation({
    mutationFn: async (
      input: SendInviteCodeDto
    ): Promise<SendInviteCodeOutputDto> => {
      if (!profileState) throw new Error("Profile required");
      const { phone_number, invite_code, inviter_name } = input;

      const { data, error } = await supabase.functions.invoke(
        "send-invite-sms",
        {
          body: {
            phone_number,
            invite_code,
            inviter_name: inviter_name || profileState.full_name,
          },
        }
      );

      if (error) throw new Error(`Failed to send invite: ${error}`);
      if (!data.success) throw new Error(data.error || "Failed to send invite");

      return {
        success: true,
        message: data.message || "Invite sent successfully",
        messageSid: data.messageSid,
      };
    },
  });
};

export const useUpdateInviteCode = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: UpdateInviteCodeDto
    ): Promise<UpdateInviteCodeOutputDto> => {
      const { inviteCodeId, status, redeemed_at } = input;

      const updateData: { status: InviteCodeStatus; redeemed_at?: string } = {
        status,
      };
      if (redeemed_at) updateData.redeemed_at = redeemed_at;

      const { data, error } = await supabase
        .from("invite_codes")
        .update(updateData)
        .eq("id", inviteCodeId)
        .select();

      if (error) throw error;
      if (data.length === 0) throw new Error("Code not found ");
      return { data: data[0] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inviteCodes.all });
    },
  });
};

// --- Query hooks ---

export const useGetInviteCodes = (
  filters?: GetInviteCodesDto["filters"]
): UseQueryResult<GetInviteCodesOutputDto> => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.inviteCodes.list(filters as Record<string, unknown>),
    queryFn: () => fetchInviteCodes(supabase, filters ?? {}),
  });
};

export const useGetInviteCountThisMonth = (): UseQueryResult<number> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  return useQuery({
    queryKey: queryKeys.inviteCodes.monthlyCount,
    queryFn: async () => {
      const { data } = await fetchInviteCodes(supabase, {
        userId: profile.id,
        startDate: startOfMonth,
        endDate: endOfMonth,
      });
      return data.length;
    },
  });
};

export const useRedeemInviteCode = () => {
  const { supabase } = useSupabase();
  const updateInviteCode = useUpdateInviteCode();

  return async (input: { code: string }): Promise<boolean> => {
    const { code } = input;

    const { data } = await fetchInviteCodes(supabase, {
      code,
      status: InviteCodeStatus.ACTIVE,
    });

    const inviteCode = data[0];

    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      await updateInviteCode.mutateAsync({
        inviteCodeId: inviteCode.id,
        status: InviteCodeStatus.EXPIRED,
      });
      throw new Error("Code has expired");
    }

    await updateInviteCode.mutateAsync({
      inviteCodeId: inviteCode.id,
      status: InviteCodeStatus.REDEEMED,
      redeemed_at: new Date().toISOString(),
    });

    return true;
  };
};
