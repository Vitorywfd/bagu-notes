import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export function createSupabaseProxyFetch(baseUrl: string): typeof fetch {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return (input, init) => {
    const request = new Request(input, init);

    if (!request.url.startsWith(normalizedBaseUrl)) {
      return fetch(request);
    }

    const target = new URL(request.url);
    const path = `${target.pathname}${target.search}`;
    const proxyUrl = `/api/supabase?path=${encodeURIComponent(path)}`;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : request.clone().body;

    const proxiedResponse = fetch(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body,
      credentials: request.credentials,
      signal: request.signal,
      duplex: body ? "half" : undefined,
    } as RequestInit & { duplex?: "half" });

    return proxiedResponse.then(async (response) => {
      if (response.status !== 502) {
        return response;
      }

      const clonedResponse = response.clone();
      const text = await clonedResponse.text().catch(() => "");

      if (!text.includes("fetch failed")) {
        return response;
      }

      return fetch(request);
    });
  };
}

const shouldUseSupabaseProxy =
  typeof window !== "undefined" && import.meta.env.PROD && hasSupabaseConfig;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: shouldUseSupabaseProxy
        ? {
            fetch: createSupabaseProxyFetch(supabaseUrl!),
          }
        : undefined,
    })
  : null;
