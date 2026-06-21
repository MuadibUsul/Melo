import { describe, it, expect } from "vitest";
import { estimateCost, COST_TABLE } from "./entitlement.service";

describe("estimateCost", () => {
  it("returns COST_TABLE.music for music type", () => {
    expect(estimateCost("music")).toBe(COST_TABLE.music);
  });

  it("returns COST_TABLE.voice_clone for voice_clone", () => {
    expect(estimateCost("voice_clone")).toBe(COST_TABLE.voice_clone);
  });

  it("calculates TTS cost per 1K characters (rounded up)", () => {
    expect(estimateCost("tts", { text: "hello" })).toBe(COST_TABLE.tts); // < 1K = 1 credit
    expect(estimateCost("tts", { text: "a".repeat(1500) })).toBe(2 * COST_TABLE.tts); // 1.5K = 2 credits
    expect(estimateCost("tts", { text: "" })).toBe(COST_TABLE.tts); // empty = 1 (min)
  });

  it("returns 0 for unknown type", () => {
    expect(estimateCost("unknown")).toBe(0);
  });

  it("handles missing params gracefully", () => {
    expect(estimateCost("tts")).toBe(COST_TABLE.tts);
  });
});
