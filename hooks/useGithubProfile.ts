"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommitMix, GithubRepo, GithubUser } from "@/lib/types";

export interface ProfileData {
  user: GithubUser;
  repos: GithubRepo[];
  commitMix: CommitMix | null;
}

export type ProfileState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ProfileData };

export function useGithubProfile() {
  const [state, setState] = useState<ProfileState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(async (rawUsername: string) => {
    const username = rawUsername.trim();
    if (!username) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ status: "loading" });

    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(username)}`, {
        signal: controller.signal,
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong" });
        return;
      }

      setState({
        status: "success",
        data: { user: data.user, repos: data.repos, commitMix: data.commitMix ?? null },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState({
        status: "error",
        message: "Network error — check your connection and try again",
      });
    }
  }, []);

  return { state, search };
}