import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiErrorBody, ErrorCode } from "@music/contracts";
import { MiniMaxError } from "@music/sdk-minimax";

/**
 * Maps every thrown error to the canonical envelope `{code,message,details?,traceId}`
 * (plan §9.5). The frontend drives UI off `code`, never off `message`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const traceId = (req.headers["x-trace-id"] as string | undefined) ?? undefined;

    let status = 500;
    let body: ApiErrorBody = { code: "INTERNAL", message: "服务器内部错误", traceId };

    if (exception instanceof MiniMaxError) {
      status = exception.kind === "transient" ? 503 : 502;
      const code: ErrorCode =
        exception.kind === "transient" ? "PROVIDER_TRANSIENT" : "PROVIDER_PERMANENT";
      body = { code, message: exception.message, traceId: exception.traceId ?? traceId };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      const message = typeof resp === "string" ? resp : ((resp as { message?: string }).message ?? exception.message);
      body = { code: httpStatusToCode(status), message, traceId };
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      body = { code: "INTERNAL", message: "服务器内部错误", traceId };
    }

    if (status >= 500) {
      this.logger.error({ status, code: body.code }, body.message);
    }
    res.status(status).json(body);
  }
}

function httpStatusToCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_FAILED";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL";
  }
}
