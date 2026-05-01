"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/career-engine";
import type { Lang } from "@/lib/i18n";

interface ProfileStore {
  profile: UserProfile | null;
  selectedCareerId: string | null;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  language: Lang;
  setProfile: (p: UserProfile) => void;
  selectCareer: (id: string | null) => void;
  addChatMessage: (msg: { role: "user" | "assistant"; content: string }) => void;
  clearChat: () => void;
  setLanguage: (lang: Lang) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      selectedCareerId: null,
      chatHistory: [],
      language: "hi",
      setProfile: (profile) => set({ profile }),
      selectCareer: (id) => set({ selectedCareerId: id }),
      addChatMessage: (msg) =>
        set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      clearChat: () => set({ chatHistory: [] }),
      setLanguage: (language) => set({ language }),
      reset: () => set({ profile: null, selectedCareerId: null, chatHistory: [] }),
    }),
    { name: "careermap-profile" }
  )
);
