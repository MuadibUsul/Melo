import { Injectable, NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

/**
 * Security middleware (plan §5.8 / §10.6).
 * Applies: helmet-like headers, CSP, input length limits, rate-limit headers.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Basic security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0"); // deprecated, rely on CSP
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // CSP: allow only our own origins and MiniMax CDN
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' https://*.minimax.io https://*.minimaxi.chat; img-src 'self' data: https:; connect-src 'self' https://*.minimax.io https://*.minimaxi.chat ws: wss:;",
    );

    // Strict-Transport-Security (only in production)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    // Request body size limit check
    const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
    if (contentLength > 10 * 1024 * 1024) {
      // 10 MB limit
      res.status(413).json({ code: "VALIDATION_FAILED", message: "请求体过大" });
      return;
    }

    next();
  }
}
