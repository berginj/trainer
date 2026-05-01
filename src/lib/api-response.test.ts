import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validationErrorResponse } from "./api-response";

describe("validationErrorResponse", () => {
  it("uses the standard API error shape", async () => {
    const schema = z.object({
      playerId: z.string().min(1)
    });

    const parsed = schema.safeParse({ playerId: "" });

    if (parsed.success) {
      throw new Error("Expected validation to fail.");
    }

    const response = validationErrorResponse(parsed.error, "req_test");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "VALIDATION_FAILED",
      message: "One or more fields are invalid.",
      fieldErrors: {
        playerId: ["Too small: expected string to have >=1 characters"]
      },
      requestId: "req_test"
    });
  });
});
