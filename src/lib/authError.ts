const knownAuthMessages: Record<string, string> = {
  email_address_invalid: "邮箱地址被 Supabase 判定为无效，请换一个常用邮箱再试。",
  email_rate_limit_exceeded: "注册触发了 Supabase 邮件频率限制。请在 Supabase 关闭邮箱确认后再试。",
  over_email_send_rate_limit: "注册触发了 Supabase 邮件频率限制。请在 Supabase 关闭邮箱确认后再试。",
  invalid_credentials: "用户名或密码不正确。",
  email_not_confirmed: "账号还没有启用。请在 Supabase 关闭邮箱确认后，重新注册这个用户名。",
  signup_disabled: "Supabase 当前关闭了新用户注册。",
  user_already_exists: "这个用户名已经注册过了，请直接切换到登录。",
};

function readErrorField(value: unknown, field: string) {
  if (!value || typeof value !== "object" || !(field in value)) {
    return undefined;
  }

  const fieldValue = (value as Record<string, unknown>)[field];
  return typeof fieldValue === "string" ? fieldValue : undefined;
}

function translateAuthMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (knownAuthMessages[normalizedMessage]) {
    return knownAuthMessages[normalizedMessage];
  }

  if (normalizedMessage.includes("email rate limit") || normalizedMessage.includes("rate limit")) {
    return knownAuthMessages.over_email_send_rate_limit;
  }

  if (normalizedMessage.includes("already registered") || normalizedMessage.includes("already exists")) {
    return knownAuthMessages.user_already_exists;
  }

  return message;
}

export function formatAuthError(error: unknown) {
  const code =
    readErrorField(error, "code") ||
    readErrorField(error, "error_code") ||
    readErrorField(error, "name");
  const message =
    readErrorField(error, "msg") ||
    readErrorField(error, "message") ||
    readErrorField(error, "error_description") ||
    readErrorField(error, "error");

  if (code && knownAuthMessages[code]) {
    return knownAuthMessages[code];
  }

  if (message && message !== "{}") {
    return translateAuthMessage(message);
  }

  if (error instanceof Error && error.message && error.message !== "{}") {
    return translateAuthMessage(error.message);
  }

  return "登录或注册失败。请稍后重试；如果你刚连续注册过，可能是 Supabase 邮件发送频率限制。";
}
