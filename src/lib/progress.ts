import type { Progress } from "../types";

export function mergeProgressItem(progress: Progress[], item: Progress) {
  const exists = progress.some((current) => current.question_id === item.question_id);

  if (!exists) return [...progress, item];

  return progress.map((current) => (current.question_id === item.question_id ? item : current));
}

export function nextProgressItem(progress: Progress[], userId: string, questionId: string, viewedAt: string): Progress {
  const existing = progress.find((item) => item.question_id === questionId);

  return {
    user_id: userId,
    question_id: questionId,
    viewed_count: (existing?.viewed_count || 0) + 1,
    last_viewed_at: viewedAt,
  };
}
