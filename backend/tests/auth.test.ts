import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "../src/schemas/auth.schema.js";

describe("auth schemas", () => {
  describe("signupSchema", () => {
    it("accepts a valid payload", () => {
      const ok = signupSchema.safeParse({
        fullName: "Jane Doe",
        email: "Jane@Example.COM",
        password: "Secret123",
      });
      expect(ok.success).toBe(true);
      if (ok.success) {
        expect(ok.data.email).toBe("jane@example.com");
      }
    });

    it("rejects a short password", () => {
      const ko = signupSchema.safeParse({
        fullName: "Jane",
        email: "jane@example.com",
        password: "short",
      });
      expect(ko.success).toBe(false);
    });

    it("rejects a password without uppercase", () => {
      const ko = signupSchema.safeParse({
        fullName: "Jane",
        email: "jane@example.com",
        password: "alllower1",
      });
      expect(ko.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("requires email + password", () => {
      const ko = loginSchema.safeParse({ email: "no", password: "" });
      expect(ko.success).toBe(false);
    });
  });
});
