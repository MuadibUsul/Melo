import { describe, it, expect } from "vitest";

// Simulate the state machine from generation.service.ts
const TRANSITIONS: Record<string, string[]> = {
  queued: ["processing", "failed", "canceled"],
  processing: ["succeeded", "failed", "canceled"],
  succeeded: [],
  failed: [],
  canceled: [],
};

function canTransition(from: string, to: string): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

describe("Generation state machine", () => {
  it("queued → processing is valid", () => {
    expect(canTransition("queued", "processing")).toBe(true);
  });

  it("queued → succeeded is invalid", () => {
    expect(canTransition("queued", "succeeded")).toBe(false);
  });

  it("processing → succeeded is valid", () => {
    expect(canTransition("processing", "succeeded")).toBe(true);
  });

  it("processing → failed is valid", () => {
    expect(canTransition("processing", "failed")).toBe(true);
  });

  it("succeeded → anything is invalid", () => {
    expect(canTransition("succeeded", "failed")).toBe(false);
    expect(canTransition("succeeded", "processing")).toBe(false);
  });

  it("failed → anything is invalid", () => {
    expect(canTransition("failed", "processing")).toBe(false);
  });

  it("canceled → anything is invalid", () => {
    expect(canTransition("canceled", "processing")).toBe(false);
  });
});
