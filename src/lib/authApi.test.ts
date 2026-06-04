import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, usernameToInternalEmail } from "./authApi";

describe("getAuthErrorMessage", () => {
  it("formats raw Supabase auth json errors", () => {
    expect(getAuthErrorMessage({ error_code: "invalid_credentials", msg: "Invalid login credentials" })).toBe(
      "用户名或密码不正确。",
    );
  });

  it("maps usernames to stable internal email addresses", async () => {
    await expect(usernameToInternalEmail(" 我的账号 ")).resolves.toMatch(/^u-[a-f0-9]{32}@bagu-notes\.local$/);
    await expect(usernameToInternalEmail("我的账号")).resolves.toBe(await usernameToInternalEmail(" 我的账号 "));
  });
});
