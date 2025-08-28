"use client";

import { Workspace } from "@/types";
import { useParams } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCurrentWorkspace(slug?: string) {
  const params = useParams();
  const workspaceSlug = slug || (params.slug as string);

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `/api/workspaces/by-slug/${workspaceSlug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    workspace: data?.data as Workspace | undefined,
    isLoading,
    error,
    mutate,
  };
}
