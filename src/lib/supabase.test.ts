import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseProxyFetch } from "./supabase";

describe("createSupabaseProxyFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards method headers and body to the same-origin proxy", async () => {
    const fetchMock = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    const proxyFetch = createSupabaseProxyFetch("https://demo.supabase.co");
    await proxyFetch("https://demo.supabase.co/rest/v1/chapters", {
      method: "POST",
      headers: {
        authorization: "Bearer token",
        "content-type": "application/json",
      },
      body: JSON.stringify({ title: "C语言" }),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/supabase?path=%2Frest%2Fv1%2Fchapters");
    expect(init.method).toBe("POST");
    expect(init.headers.get("authorization")).toBe("Bearer token");
    expect(init.body).toBeTruthy();
    expect(init.duplex).toBe("half");
  });

  it("falls back to direct Supabase fetch when the proxy cannot reach Supabase", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "fetch failed" }), { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const proxyFetch = createSupabaseProxyFetch("https://demo.supabase.co");
    const response = await proxyFetch("https://demo.supabase.co/rest/v1/chapters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "C语言" }),
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBeInstanceOf(Request);
  });
});
