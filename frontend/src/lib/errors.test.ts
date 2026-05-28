import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { getErrorMessage } from "./errors.js";

describe("getErrorMessage", () => {
  it("returns axios error message when present", () => {
    const err = new AxiosError("oops");
    err.response = {
      data: { message: "Bad credentials" },
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: {} as never,
    };
    expect(getErrorMessage(err)).toBe("Bad credentials");
  });

  it("falls back to default for unknown errors", () => {
    expect(getErrorMessage({}, "fallback!")).toBe("fallback!");
  });

  it("uses Error message for native errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });
});
