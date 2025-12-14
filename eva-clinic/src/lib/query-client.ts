/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

const queryConfig: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  },
  mutations: {
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'An error occurred';
      toast.error(message);
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
