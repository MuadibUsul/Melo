"use client";

const STORAGE_KEY = "music_device_id";

export function getPlaybackDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `device-${Date.now()}`;
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
