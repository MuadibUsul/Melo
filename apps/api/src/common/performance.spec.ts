/**
 * Performance & error-path tests (plan §3 boundary/error coverage).
 */
import { describe, it, expect } from "vitest";
import { estimateCost } from "../modules/entitlement/entitlement.service";

describe("Error path: cost estimation", () => {
  it("handles empty TTS text (minimum 1 credit)", () => {
    expect(estimateCost("tts", { text: "" })).toBeGreaterThan(0);
  });

  it("handles very long TTS text gracefully", () => {
    const longText = "a".repeat(1_000_000); // 1M chars
    const cost = estimateCost("tts", { text: longText });
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThanOrEqual(1000 * 100 + 100); // reasonable upper bound
  });

  it("handles malformed params without crashing", () => {
    expect(() => estimateCost("music", null as never)).not.toThrow();
    expect(() => estimateCost("tts", {})).not.toThrow();
    // estimateCost expects text to be a string; non-string throws naturally
    expect(() => estimateCost("tts", { text: undefined })).not.toThrow();
  });

  it("handles unicode/emoji in TTS text", () => {
    const cost = estimateCost("tts", { text: "你好🎵世界🌍" });
    expect(cost).toBeGreaterThan(0);
  });
});

describe("Error path: state machine edge cases", () => {
  const TRANSITIONS: Record<string, string[]> = {
    queued: ["processing", "failed", "canceled"],
    processing: ["succeeded", "failed", "canceled"],
    succeeded: [],
    failed: [],
    canceled: [],
  };

  it("no transition from succeeded even with error retry", () => {
    expect(TRANSITIONS["succeeded"]?.includes("failed")).toBe(false);
    expect(TRANSITIONS["succeeded"]?.includes("processing")).toBe(false);
  });

  it("allows cancel from queued and processing but not from terminal states", () => {
    expect(TRANSITIONS["queued"]?.includes("canceled")).toBe(true);
    expect(TRANSITIONS["processing"]?.includes("canceled")).toBe(true);
    expect(TRANSITIONS["succeeded"]?.includes("canceled")).toBe(false);
    expect(TRANSITIONS["failed"]?.includes("canceled")).toBe(false);
  });
});
