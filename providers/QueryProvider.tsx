import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes — avoid redundant refetches on screen navigation
      gcTime: 5 * 60 * 1000, // 5 minutes — keep cache after unmount for back-nav
      retry: 1, // single retry on mobile to avoid long hangs
      refetchOnWindowFocus: false, // not relevant on mobile, avoid unnecessary refetches
      refetchOnReconnect: true, // refetch when network comes back
    },
    mutations: {
      retry: 0, // never auto-retry mutations
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { queryClient };
