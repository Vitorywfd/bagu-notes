import { formatAuthError } from "./authError";
import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type AuthPayload = {
  username: string;
  password: string;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: unknown;
};

function getProxyAuthEndpoint(path: string) {
  if (import.meta.env.PROD) {
    return `/api/supabase?path=${encodeURIComponent(path)}`;
  }

  return getDirectAuthEndpoint(path);
}

function getDirectAuthEndpoint(path: string) {
  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  return `${supabaseUrl.replace(/\/$/, "")}${path}`;
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function usernameToInternalEmail(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername.length < 2) {
    throw new Error("用户名至少需要 2 个字符。");
  }

  if (normalizedUsername.length > 40) {
    throw new Error("用户名最多 40 个字符。");
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedUsername));
  return `u-${toHex(digest).slice(0, 32)}@bagu-notes.local`;
}

async function parseAuthResponse(response: Response) {
  const text = await response.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (response.status === 521 || text.includes("Error code 521") || text.includes("Web server is down")) {
      throw new Error("Supabase 项目仍在恢复或暂时不可用。请等待几分钟后再试。");
    }

    throw new Error("Supabase 返回了非 JSON 响应，请稍后重试。");
  }

  if (!response.ok) {
    throw data;
  }

  return data as AuthResponse;
}

function shouldRetryDirect(error: unknown) {
  if (!import.meta.env.PROD || !error || typeof error !== "object") return false;
  const status = "status" in error ? Number((error as { status?: unknown }).status) : 0;
  const message = JSON.stringify(error).toLowerCase();
  return status === 502 && message.includes("fetch failed");
}

async function requestAuth(path: string, payload: Record<string, unknown>) {
  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_ANON_KEY");
  }

  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(payload),
  };

  try {
    return await parseAuthResponse(await fetch(getProxyAuthEndpoint(path), init));
  } catch (error) {
    if (!shouldRetryDirect(error)) {
      throw error;
    }
  }

  return parseAuthResponse(await fetch(getDirectAuthEndpoint(path), init));
}

async function applySession(data: AuthResponse) {
  if (!data.access_token || !data.refresh_token || !supabase) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (error) {
    throw error;
  }
}

export async function signInWithPassword(payload: AuthPayload) {
  const email = await usernameToInternalEmail(payload.username);
  const data = await requestAuth("/auth/v1/token?grant_type=password", {
    email,
    password: payload.password,
  });
  await applySession(data);
}

export async function signUpWithPassword(payload: AuthPayload) {
  const email = await usernameToInternalEmail(payload.username);
  const data = await requestAuth("/auth/v1/signup", {
    email,
    password: payload.password,
    data: {
      username: payload.username.trim(),
    },
    gotrue_meta_security: {},
  });
  await applySession(data);
}

export function getAuthErrorMessage(error: unknown) {
  try {
    return formatAuthError(error);
  } catch {
    return "登录或注册失败，请稍后重试。";
  }
}
