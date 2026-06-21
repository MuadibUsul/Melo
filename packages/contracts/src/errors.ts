/**
 * Stable, machine-readable error codes (plan §5.7 / §9.5).
 * The frontend drives UI off `code` — never off `message`.
 */
export const ERROR_CODES = [
  // generic
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
  // auth
  "AUTH_EMAIL_TAKEN",
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_TOKEN_EXPIRED",
  // entitlement
  "ENTITLEMENT_INSUFFICIENT_CREDITS",
  "FEATURE_NOT_IN_PLAN",
  // generation / provider
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_TRANSIENT",
  "PROVIDER_PERMANENT",
  "GENERATION_INVALID_STATE",
  // assets / ownership
  "ASSET_NOT_OWNED",
  // moderation
  "MODERATION_REQUIRED",
  "MODERATION_CONSENT_MISSING",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Canonical error envelope returned by the API (plan §9.5). */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}
