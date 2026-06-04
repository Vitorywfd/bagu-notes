import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      setSession: vi.fn(async () => ({ error: null })),
    },
  },
}));

describe("getAuthErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("formats raw Supabase auth json errors", async () => {
    const { getAuthErrorMessage } = await import("./authApi");

    expect(getAuthErrorMessage({ error_code: "invalid_credentials", msg: "Invalid login credentials" })).toBe(
      "用户名或密码不正确。",
    );
  });

  it("maps usernames to stable internal email addresses", async () => {
    const { usernameToInternalEmail } = await import("./authApi");

    await expect(usernameToInternalEmail(" 我的账号 ")).resolves.toMatch(/^u-[a-f0-9]{32}@bagu-notes\.local$/);
    await expect(usernameToInternalEmail("我的账号")).resolves.toBe(await usernameToInternalEmail(" 我的账号 "));
  });

  it("retries auth directly when the production proxy cannot reach Supabase", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_publishable_demo");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 502, error: "fetch failed" }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh" })));
    vi.stubGlobal("fetch", fetchMock);

    const { signInWithPassword } = await import("./authApi");
    await signInWithPassword({ username: "WEN", password: "123456" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/supabase?path=%2Fauth%2Fv1%2Ftoken");
    expect(fetchMock.mock.calls[1][0]).toContain("https://demo.supabase.co/auth/v1/token");
  });
});
