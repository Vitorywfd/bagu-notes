export function getErrorMessage(error: unknown, fallback = "操作失败") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = record.message || record.msg || record.details || record.hint || record.code;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    try {
      const json = JSON.stringify(error);
      if (json && json !== "{}") {
        return json;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}
