const allowedPathPrefixes = ["/auth/v1/", "/rest/v1/", "/storage/v1/"];
const blockedRequestHeaders = new Set([
  "accept-encoding",
  "connection",
  "content-length",
  "host",
  "x-forwarded-host",
  "x-forwarded-proto",
]);
const exposedResponseHeaders = new Set([
  "cache-control",
  "content-language",
  "content-type",
  "expires",
  "last-modified",
  "pragma",
]);

function getSupabaseUrl() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }

  return url.replace(/\/$/, "");
}

function getProxyPath(req) {
  const rawPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;

  if (typeof rawPath !== "string" || !rawPath.startsWith("/")) {
    return null;
  }

  return rawPath;
}

function isAllowedPath(path) {
  return allowedPathPrefixes.some((prefix) => path.startsWith(prefix));
}

function createForwardHeaders(req) {
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    const normalizedName = name.toLowerCase();

    if (blockedRequestHeaders.has(normalizedName) || value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(name, value.join(", "));
    } else {
      headers.set(name, value);
    }
  }

  if (!headers.has("apikey") && process.env.VITE_SUPABASE_ANON_KEY) {
    headers.set("apikey", process.env.VITE_SUPABASE_ANON_KEY);
  }

  return headers;
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

function copyResponseHeaders(response, res) {
  response.headers.forEach((value, name) => {
    if (exposedResponseHeaders.has(name.toLowerCase())) {
      res.setHeader(name, value);
    }
  });
}

export default async function handler(req, res) {
  try {
    const path = getProxyPath(req);

    if (!path || !isAllowedPath(path)) {
      res.status(400).json({ error: "Unsupported Supabase proxy path" });
      return;
    }

    const targetUrl = `${getSupabaseUrl()}${path}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: createForwardHeaders(req),
      body: await readBody(req),
      redirect: "manual",
    });

    const responseBody = Buffer.from(await response.arrayBuffer());

    copyResponseHeaders(response, res);
    res.status(response.status).send(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase proxy failed";
    const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
    res.status(502).json({
      error: message,
      cause: cause instanceof Error ? cause.message : String(cause || ""),
      target: getSupabaseUrl(),
    });
  }
}
