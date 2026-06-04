import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errorMessage";

describe("getErrorMessage", () => {
  it("formats plain Supabase error objects", () => {
    expect(getErrorMessage({ code: "42501", message: "new row violates row-level security policy" })).toBe(
      "new row violates row-level security policy",
    );
  });
});
