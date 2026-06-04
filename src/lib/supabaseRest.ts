import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

function getBaseUrl() {
  if (import.meta.env.PROD) {
    return "/api/supabase";
  }

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  return supabaseUrl.replace(/\/$/, "");
}

async function getAccessToken() {
  if (!supabase) {
    throw new Error("Supabase 环境变量未配置");
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session?.access_token) {
    throw new Error("登录状态已失效，请重新登录。");
  }

  return data.session.access_token;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw data || new Error(`HTTP ${response.status}`);
  }

  return data;
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const baseUrl = getBaseUrl();
  const url = import.meta.env.PROD ? `${baseUrl}?path=${encodeURIComponent(path)}` : `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  return parseResponse(response) as Promise<T>;
}
