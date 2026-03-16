import { useContext, useEffect, useState } from "react";
import { SupabaseClient, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { SupabaseContext } from "../context/supabase-context";
import { queryKeys } from "@/lib/queryKeys";

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
    await supabase.auth.signOut();
    setSession(null);
    queryClient?.clear();
  };

  if (!supabase) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }

  return { isLoaded, session, supabase, signOut };
};
