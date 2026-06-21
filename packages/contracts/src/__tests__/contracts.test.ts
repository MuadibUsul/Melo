import { describe, it, expect } from "vitest";
import { registerInput, loginInput } from "../auth";
import { createJobInput } from "../generation";
import { paginationQuery, audioSettingSchema } from "../common";

describe("auth contracts", () => {
  it("registerInput validates email+password+displayName", () => {
    const result = registerInput.safeParse({
      email: "test@example.com",
      password: "password123",
      displayName: "测试用户",
    });
    expect(result.success).toBe(true);
  });

  it("registerInput rejects missing email and phone", () => {
    const result = registerInput.safeParse({ password: "12345678", displayName: "X" });
    expect(result.success).toBe(false);
  });

  it("registerInput rejects short password", () => {
    const result = registerInput.safeParse({ email: "a@b.com", password: "123", displayName: "X" });
    expect(result.success).toBe(false);
  });

  it("loginInput validates identifier + password", () => {
    expect(loginInput.safeParse({ identifier: "test@test.com", password: "x" }).success).toBe(true);
  });
});

describe("generation contracts", () => {
  it("createJobInput requires type", () => {
    const result = createJobInput.safeParse({ type: "music", params: {} });
    expect(result.success).toBe(true);
  });

  it("createJobInput rejects invalid type", () => {
    const result = createJobInput.safeParse({ type: "invalid", params: {} });
    expect(result.success).toBe(false);
  });

  it("createJobInput defaults mode to simple", () => {
    const result = createJobInput.safeParse({ type: "tts", params: { text: "hello", voiceId: "v1" } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mode).toBe("simple");
  });
});

describe("common contracts", () => {
  it("paginationQuery defaults page=1, pageSize=20", () => {
    const result = paginationQuery.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("audioSettingSchema has defaults", () => {
    const result = audioSettingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("mp3");
      expect(result.data.sample_rate).toBe(44100);
    }
  });
});
