import { Injectable, Logger } from "@nestjs/common";
import { StorageService } from "../../infra/storage/storage.service";

const ASSETS_NS = "assets";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly storage: StorageService) {}

  // ── Upload ──

  /** Upload audio buffer to S3. Returns storage key and byte size. */
  async uploadAudio(
    userId: string,
    jobId: string,
    buffer: Buffer,
    contentType = "audio/mpeg",
  ): Promise<{ storageKey: string; size: number }> {
    const key = `${ASSETS_NS}/${userId}/${jobId}.${contentType.split("/")[1] ?? "mp3"}`;
    const result = await this.storage.putObject(key, buffer, contentType);
    return { storageKey: result.key, size: result.size };
  }

  /** Upload cover image. */
  async uploadCover(userId: string, assetId: string, buffer: Buffer, contentType: string): Promise<string> {
    const ext = contentType.split("/")[1] ?? "png";
    const key = `${ASSETS_NS}/${userId}/covers/${assetId}.${ext}`;
    const result = await this.storage.putObject(key, buffer, contentType);
    return result.key;
  }

  // ── Signed URLs ──

  /** Get a time-limited signed playback URL. */
  async getPlaybackUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.storage.getSignedUrl(key, expiresInSeconds);
  }

  /** Get a signed download URL. */
  async getDownloadUrl(key: string, _filename: string): Promise<string> {
    return this.storage.getSignedUrl(key, 600); // shorter TTL for downloads
  }

  // ── Remote fetch & store ──

  /**
   * Download audio from an external URL (e.g., MiniMax direct URL) and store
   * it in S3. Returns the new storage key. Strategy: store locally when S3 is
   * available; otherwise return the original URL for direct use.
   */
  async fetchAndStore(
    userId: string,
    jobId: string,
    sourceUrl: string,
    contentType = "audio/mpeg",
  ): Promise<{ storageKey?: string; url: string }> {
    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const uploaded = await this.uploadAudio(userId, jobId, buffer, contentType);
      return { storageKey: uploaded.storageKey, url: sourceUrl };
    } catch (err) {
      this.logger.warn(`Failed to fetch & store audio: ${(err as Error).message}. Using direct URL.`);
      return { url: sourceUrl };
    }
  }

  // ── Waveform (placeholder — real ffmpeg processing in Phase 3) ──

  /** Generate a minimal waveform peaks array from an audio buffer.
   *  Phase 3: replace with server-side ffmpeg analysis.
   */
  async computeWaveform(_buffer: Buffer): Promise<number[]> {
    // Placeholder: return a simple sawtooth pattern so the frontend waveform
    // component can render something meaningful.
    return Array.from({ length: 80 }, (_, i) => Math.sin((i / 80) * Math.PI) * 0.8 + 0.1);
  }
}
