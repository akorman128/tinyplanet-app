import { useContext, useEffect, useState } from "react";
import { SupabaseClient, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { SupabaseContext } from "../context/supabase-context";
import { queryKeys } from "@/lib/queryKeys";
import { EAS_PROJECT_ID } from "@/lib/constants";

interface UseSupabaseProps {
  isLoaded: boolean;
  session: Session | null | undefined;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
}

export const useSupabase = (): UseSupabaseProps => {
  const supabase = useContext(SupabaseContext);
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // QueryClient may not exist if useSupabase is called outside QueryProvider
  // (e.g., in components above it in the tree). Gracefully handle this.
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    // QueryProvider not mounted yet — skip cache operations
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoaded(true);
      // Seed the auth session into the query cache
      queryClient?.setQueryData(queryKeys.auth.session, data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        // Keep query cache in sync with auth state
        queryClient?.setQueryData(queryKeys.auth.session, newSession);

        // On sign out, clear all cached queries
        if (!newSession) {
          queryClient?.clear();
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;

    // Fire-and-forget: clean up push token without blocking sign-out UX
    if (Device.isDevice && session?.user?.id) {
      const userId = session.user.id;
      Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })
        .then((tokenData) =>
          supabase
            .from("push_tokens")
            .delete()
            .eq("user_id", userId)
            .eq("token", tokenData.data)
        )
        .catch((err) =>
          console.error("Failed to remove push token on sign out:", err)
        );
    }

    await supabase.auth.signOut();
    setSession(null);
    queryClient?.clear();
  };

  if (!supabase) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return { isLoaded, session, supabase, signOut };
};
