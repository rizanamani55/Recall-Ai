// hooks/useUsage.ts
import useSWR from "swr";
import type { UsageMeterData } from "@/types/user";

const fetcher = async (url: string): Promise<UsageMeterData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch usage data");
  }
  return res.json();
};

export function useUsage() {
  const { data, error, isLoading, mutate } = useSWR<UsageMeterData>(
    "/api/usage",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 15000, // dedupe duplicate calls within 15s
    }
  );

  return {
    usage: data,
    isLoading,
    isError: error,
    mutateUsage: mutate,
  };
}
