import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode = "VALIDATION_FAILED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  fieldErrors: Record<string, string[]>;
  requestId: string;
};

export function createRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export function validationErrorResponse(error: ZodError, requestId = createRequestId()) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return NextResponse.json<ApiErrorBody>(
    {
      code: "VALIDATION_FAILED",
      message: "One or more fields are invalid.",
      fieldErrors,
      requestId
    },
    { status: 400 }
  );
}

export function apiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId = createRequestId()
) {
  return NextResponse.json<ApiErrorBody>(
    {
      code,
      message,
      fieldErrors: {},
      requestId
    },
    { status }
  );
}
