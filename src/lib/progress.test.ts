import { describe, expect, it } from "vitest";
import { mergeProgressItem, nextProgressItem } from "./progress";
import type { Progress } from "../types";

describe("progress helpers", () => {
  it("creates progress for a question that has not been viewed", () => {
    expect(nextProgressItem([], "user-1", "question-1", "2026-07-07T00:00:00.000Z")).toEqual({
      user_id: "user-1",
      question_id: "question-1",
      viewed_count: 1,
      last_viewed_at: "2026-07-07T00:00:00.000Z",
    });
  });

  it("increments progress for a viewed question", () => {
    const progress: Progress[] = [{
      user_id: "user-1",
      question_id: "question-1",
      viewed_count: 2,
      last_viewed_at: "2026-07-06T00:00:00.000Z",
    }];

    expect(nextProgressItem(progress, "user-1", "question-1", "2026-07-07T00:00:00.000Z")).toMatchObject({
      viewed_count: 3,
      last_viewed_at: "2026-07-07T00:00:00.000Z",
    });
  });

  it("merges saved progress without duplicating the question row", () => {
    const progress: Progress[] = [{
      user_id: "user-1",
      question_id: "question-1",
      viewed_count: 1,
      last_viewed_at: "2026-07-06T00:00:00.000Z",
    }];

    const next = mergeProgressItem(progress, {
      user_id: "user-1",
      question_id: "question-1",
      viewed_count: 2,
      last_viewed_at: "2026-07-07T00:00:00.000Z",
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ question_id: "question-1", viewed_count: 2 });
  });
});
