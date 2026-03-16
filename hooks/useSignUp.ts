import { useMutation } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useSignupStore } from "@/stores/signupStore";
import { useCreateProfile } from "./useProfile";
import { fetchVibes, useUpdateVibe } from "./useVibe";
import { useRedeemInviteCode } from "./useInviteCodes";
import { useCreateFriend } from "./useFriends";

// --- Mutation hooks ---

export const useSignUpWithPhoneNumber = () => {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (input: { phone: string }) => {
      const { error } = await supabase.auth.signInWithOtp({
        phone: input.phone,
        options: { shouldCreateUser: true, channel: "sms" },
      });
      if (error) throw error;
    },
  });
};

export const useSignUpWithEmail = () => {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp(input);
      if (error) throw error;
    },
  });
};

export const useVerifyEmailOtp = () => {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (input: { email: string; token: string }) => {
      const { error } = await supabase.auth.verifyOtp({
        email: input.email,
        token: input.token,
        type: "email",
      });
      if (error) throw error;
    },
  });
};

export const useVerifyOtpAndCreateProfile = () => {
  const { supabase } = useSupabase();
  const createProfile = useCreateProfile();
  const updateVibe = useUpdateVibe();
  const redeemInviteCode = useRedeemInviteCode();
  const createFriend = useCreateFriend();
  const { signupData } = useSignupStore();

  return useMutation({
    mutationFn: async (input: { phone: string; token: string }) => {
      const { phone, token } = input;
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      if (error) throw error;
      if (!data.user) throw new Error("User not found");

      const userId = data.user.id;

      try {
        await createProfile.mutateAsync({
          id: userId,
          phone_number: phone,
          full_name: signupData.fullName,
          hometown: signupData.hometown,
          birthday: signupData.birthday,
          location: signupData.location,
          hometown_location: signupData.hometownLocation,
          invited_by: signupData.inviteCode.inviter_id,
        });
      } catch (error) {
        console.error("Failed to create profile:", error);
        throw error;
      }

      try {
        const { data: vibes } = await fetchVibes(supabase, { inviteCodeId: signupData.inviteCode.id });
        if (vibes.length > 0) {
          await updateVibe.mutateAsync({ vibeId: vibes[0].id, receiverId: userId });
        }
      } catch (error) {
        console.error("Failed to link vibes:", error);
      }

      try {
        await createFriend.mutateAsync({
          currentUserId: userId,
          targetUserId: signupData.inviteCode.inviter_id,
        });
      } catch (error) {
        console.error("Failed to create friend relationship:", error);
      }

      try {
        await redeemInviteCode({ code: signupData.inviteCode.code });
      } catch (error) {
        console.error("Failed to redeem invite code:", error);
      }
    },
  });
};
