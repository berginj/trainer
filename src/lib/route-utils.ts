import { ZodError, type ZodSchema } from "zod";
import { apiErrorResponse, validationErrorResponse } from "./api-response";

export async function parseJsonWithSchema<T>(request: Request, schema: ZodSchema<T>) {
  try {
    return {
      data: schema.parse(await request.json()),
      response: null
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        data: null,
        response: validationErrorResponse(error)
      };
    }

    return {
      data: null,
      response: apiErrorResponse("VALIDATION_FAILED", "Request body must be valid JSON.", 400)
    };
  }
}
