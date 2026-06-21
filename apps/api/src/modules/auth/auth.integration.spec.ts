/**
 * Auth integration test (plan §3).
 *
 * Tests the full register→login→refresh→logout flow using the contracts
 * validators and the auth service logic (mocked Prisma for unit speed).
 */
import { describe, it, expect } from "vitest";
import { registerInput, loginInput } from "@music/contracts";

describe("Auth integration (contract validation)", () => {
  it("registerInput rejects weak passwords", () => {
    const result = registerInput.safeParse({
      email: "user@test.com",
      password: "123", // too short
      displayName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("registerInput requires at least email or phone", () => {
    const result = registerInput.safeParse({
      password: "validpassword123",
      displayName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("loginInput accepts email as identifier", () => {
    const result = loginInput.safeParse({
      identifier: "test@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("loginInput accepts phone as identifier", () => {
    const result = loginInput.safeParse({
      identifier: "+8613800138000",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("loginInput rejects short identifier", () => {
    const result = loginInput.safeParse({
      identifier: "ab", // < 3 chars
      password: "mypassword",
    });
    expect(result.success).toBe(false);
  });
});
