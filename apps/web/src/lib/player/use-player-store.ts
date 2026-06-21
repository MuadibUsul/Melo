"use client";

import { create } from "zustand";

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  audioUrl: string;
  durationMs?: number;
}

export type PlayMode = "sequential" | "random" | "single";

export interface PlayerContext {
  title: string | null;
  href?: string | null;
}

interface PlayerState {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: PlayerTrack[];
  queueIndex: number;
  playMode: PlayMode;
  contextTitle: string | null;
  contextHref: string | null;
  isQueueOpen: boolean;
  play: (track: PlayerTrack) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number, context?: string | PlayerContext | null) => void;
  enqueue: (tracks: PlayerTrack[]) => void;
  jumpToQueueIndex: (index: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  setTime: (t: number) => void;
  setDuration: (d: number) => void;
  setVolume: (v: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setQueueOpen: (open: boolean) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  queue: [],
  queueIndex: -1,
  playMode: "sequential",
  contextTitle: null,
  contextHref: null,
  isQueueOpen: false,

  play: (track) => {
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      queue: [track],
      queueIndex: 0,
      contextTitle: null,
      contextHref: null,
    });
  },

  playQueue: (tracks, startIndex = 0, context: string | PlayerContext | null = null) => {
    if (tracks.length === 0) return;
    const idx = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    const contextState =
      typeof context === "string"
        ? { title: context, href: null }
        : { title: context?.title ?? null, href: context?.href ?? null };
    set({
      queue: tracks,
      queueIndex: idx,
      currentTrack: tracks[idx]!,
      isPlaying: true,
      currentTime: 0,
      contextTitle: contextState.title,
      contextHref: contextState.href,
    });
  },

  enqueue: (tracks) => {
    if (tracks.length === 0) return;
    const state = get();
    if (!state.currentTrack || state.queue.length === 0) {
      set({
        queue: tracks,
        queueIndex: 0,
        currentTrack: tracks[0]!,
        isPlaying: true,
        currentTime: 0,
        contextTitle: null,
        contextHref: null,
      });
      return;
    }
    set({ queue: [...state.queue, ...tracks] });
  },

  jumpToQueueIndex: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ queueIndex: index, currentTrack: queue[index]!, isPlaying: true, currentTime: 0 });
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => { if (get().currentTrack) set({ isPlaying: true }); },

  next: () => {
    const { queue, queueIndex, playMode } = get();
    if (queue.length === 0) return;

    let nextIdx: number;
    if (playMode === "single") {
      set({ currentTime: 0, isPlaying: true });
      return;
    }
    if (playMode === "random") {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = (queueIndex + 1) % queue.length;
    }

    set({ queueIndex: nextIdx, currentTrack: queue[nextIdx]!, isPlaying: true, currentTime: 0 });
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    set({ queueIndex: prevIdx, currentTrack: queue[prevIdx]!, isPlaying: true, currentTime: 0 });
  },

  setTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: v }),
  setPlayMode: (mode) => set({ playMode: mode }),
  setQueueOpen: (open) => set({ isQueueOpen: open }),
  clearQueue: () =>
    set({
      queue: [],
      queueIndex: -1,
      currentTrack: null,
      isPlaying: false,
      contextTitle: null,
      contextHref: null,
      isQueueOpen: false,
    }),
}));
