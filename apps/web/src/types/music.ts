export interface GenerateRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  vocal?: string;
  lyricsMode: "ai" | "custom" | "instrumental";
  durationPreset?: string;
  outputFormat?: "mp3" | "wav";
  lyrics?: string;
}

export interface TrackView {
  id: string;
  title?: string | null;
  audio_url?: string | null;
  storage_path?: string | null;
  duration_ms?: number | null;
  created_at?: string | null;
  user_id: string;
  favorited?: boolean;
  generation_tasks?: Array<{
    genre?: string | null;
    mood?: string | null;
    vocal?: string | null;
  }> | {
    genre?: string | null;
    mood?: string | null;
    vocal?: string | null;
  };
}
