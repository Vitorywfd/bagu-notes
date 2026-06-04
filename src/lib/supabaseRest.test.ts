import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: "token" } }, error: null })),
    },
  },
}));

describe("supabaseRest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws parsed Supabase json errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ message: "RLS failed" }), { status: 403 })));
    const { supabaseRest } = await import("./supabaseRest");

    await expect(supabaseRest("/rest/v1/public_questions")).rejects.toMatchObject({ message: "RLS failed" });
  });
});
