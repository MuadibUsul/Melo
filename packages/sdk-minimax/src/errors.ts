/**
 * MiniMax error classification (plan §5.7 / §9.1(f)).
 * - `transient`  → 429 / 5xx / timeout / network → safe to retry (backoff).
 * - `permanent`  → 4xx params / auth / content-rejected → DO NOT retry; refund credits.
 */
export type MiniMaxErrorKind = "transient" | "permanent";

export class MiniMaxError extends Error {
  readonly kind: MiniMaxErrorKind;
  readonly httpStatus?: number;
  readonly providerStatusCode?: number;
  readonly traceId?: string;

  constructor(
    message: string,
    kind: MiniMaxErrorKind,
    opts: { httpStatus?: number; providerStatusCode?: number; traceId?: string } = {},
  ) {
    super(message);
    this.name = "MiniMaxError";
    this.kind = kind;
    this.httpStatus = opts.httpStatus;
    this.providerStatusCode = opts.providerStatusCode;
    this.traceId = opts.traceId;
  }
}

/** Classify an HTTP status into transient/permanent. */
export function classifyHttpStatus(status: number): MiniMaxErrorKind {
  if (status === 429 || status >= 500) return "transient";
  return "permanent";
}

/**
 * Classify a MiniMax `base_resp.status_code`. 0 = success.
 * 1002/1039 = rate limited (transient); 1004 = auth (permanent);
 * 2013/1027 = invalid params / content (permanent); others default permanent.
 */
export function classifyProviderStatus(code: number): MiniMaxErrorKind {
  if (code === 0) return "transient"; // not an error; caller shouldn't reach here
  if (code === 1002 || code === 1039) return "transient";
  return "permanent";
}
