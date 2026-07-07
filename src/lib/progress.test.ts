import { describe, expect, it } from "vitest";
import { getLatestProgressQuestionId, mergeProgressItem, nextProgressItem } from "./progress";
import type { Progress, Question } from "../types";

function question(id: string): Question {
  return {
    id,
    user_id: "user-1",
    chapter_id: "chapter-1",
    question: `question ${id}`,
    answer: `answer ${id}`,
    sort_order: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  };
}

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

  it("returns the latest viewed question that still exists", () => {
    const progress: Progress[] = [
      { user_id: "user-1", question_id: "question-1", viewed_count: 1, last_viewed_at: "2026-07-06T00:00:00.000Z" },
      { user_id: "user-1", question_id: "question-2", viewed_count: 3, last_viewed_at: "2026-07-07T00:00:00.000Z" },
      { user_id: "user-1", question_id: "deleted-question", viewed_count: 10, last_viewed_at: "2026-07-08T00:00:00.000Z" },
    ];

    expect(getLatestProgressQuestionId(progress, [question("question-1"), question("question-2")])).toBe("question-2");
  });

  it("ignores progress rows that were never viewed", () => {
    const progress: Progress[] = [
      { user_id: "user-1", question_id: "question-1", viewed_count: 0, last_viewed_at: "2026-07-07T00:00:00.000Z" },
    ];

    expect(getLatestProgressQuestionId(progress, [question("question-1")])).toBe("");
  });
});
