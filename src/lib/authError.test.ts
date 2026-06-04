import { describe, expect, it } from "vitest";
import { formatAuthError } from "./authError";

describe("formatAuthError", () => {
  it("translates Supabase email rate limit errors", () => {
    expect(formatAuthError({ error_code: "over_email_send_rate_limit", msg: "email rate limit exceeded" })).toContain(
      "Supabase 邮件频率限制",
    );
  });

  it("does not show empty object messages to users", () => {
    expect(formatAuthError({ message: "{}" })).not.toBe("{}");
  });
});
