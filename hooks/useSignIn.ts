import { useMutation } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useProfileStore } from "@/stores/profileStore";
import { fetchProfile } from "./useProfile";
import { useLocation } from "./useLocation";

// --- Mutation hooks ---

export const useSignInWithPhoneNumber = () => {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (input: { phone: string }) => {
      const { error } = await supabase.auth.signInWithOtp({
        phone: input.phone,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
    },
  });
};

export const useVerifySignInOtp = () => {
  const { supabase } = useSupabase();
  const { updateLocationInDatabase } = useLocation();
  const { setProfileState } = useProfileStore();

  return useMutation({
    mutationFn: async (input: { phone: string; token: string }) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.verifyOtp({
        phone: input.phone,
        token: input.token,
        type: "sms",
      });
      if (error) throw error;
      if (!user) throw new Error("User not found");

      const profile = await fetchProfile(supabase, user.id, null);
      setProfileState(profile);

      try {
        await updateLocationInDatabase(false, profile);
      } catch (error) {
        console.error("Failed to update location on sign-in:", error);
      }
    },
  });
};

export const useSignInWithPassword = () => {
  const { supabase } = useSupabase();
  const { updateLocationInDatabase } = useLocation();
  const { setProfileState } = useProfileStore();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;

      const user = await fetchProfile(supabase, data.user.id, null);
      setProfileState(user);

      try {
        await updateLocationInDatabase(false, user);
      } catch (error) {
        console.error("Failed to update location on sign-in:", error);
      }
    },
  });
};
