import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { StorageService } from "../../infra/storage/storage.service";

const ASSETS_NS = "assets";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly storage: StorageService) {}

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

  async uploadCover(userId: string, assetId: string, buffer: Buffer, contentType: string): Promise<string> {
    const ext = contentType.split("/")[1] ?? "png";
    const key = `${ASSETS_NS}/${userId}/covers/${assetId}.${ext}`;
    const result = await this.storage.putObject(key, buffer, contentType);
    return result.key;
  }

  async prepareAudioUpload(
    userId: string,
    contentType = "audio/mpeg",
  ): Promise<{ storageKey: string; uploadUrl: string; expiresIn: number }> {
    const subtype = contentType.split("/")[1]?.replace(/[^a-z0-9.+-]/gi, "") || "mpeg";
    const ext = subtype === "mpeg" ? "mp3" : subtype;
    const storageKey = `${ASSETS_NS}/${userId}/uploads/${Date.now()}-${randomUUID()}.${ext}`;
    const expiresIn = 600;
    const uploadUrl = await this.storage.getSignedUploadUrl(storageKey, contentType, expiresIn);
    return { storageKey, uploadUrl, expiresIn };
  }

  async getPlaybackUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.storage.getSignedUrl(key, expiresInSeconds);
  }

  async getDownloadUrl(key: string, _filename: string): Promise<string> {
    return this.storage.getSignedUrl(key, 600);
  }

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
      this.logger.warn(`Failed to fetch and store audio: ${(err as Error).message}. Using direct URL.`);
      return { url: sourceUrl };
    }
  }

  async computeWaveform(_buffer: Buffer): Promise<number[]> {
    return Array.from({ length: 80 }, (_, i) => Math.sin((i / 80) * Math.PI) * 0.8 + 0.1);
  }
}
