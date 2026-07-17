import { describe, expect, it } from "vitest";
import { reorderChapters, reorderQuestions } from "./reorder";
import type { Chapter, Question } from "../types";

function chapter(id: string, title: string, sortOrder: number): Chapter {
  return {
    id,
    user_id: "user-1",
    title,
    sort_order: sortOrder,
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
  };
}

function question(id: string, sortOrder: number): Question {
  return {
    id,
    user_id: "user-1",
    chapter_id: "chapter-1",
    question: id,
    answer: "answer",
    sort_order: sortOrder,
    created_at: "2026-07-17T00:00:00.000Z",
    updated_at: "2026-07-17T00:00:00.000Z",
  };
}

describe("reorder", () => {
  it("moves a chapter to the target position and renumbers numeric prefixes", () => {
    const chapters = [
      chapter("chapter-1", "1. C语言篇", 1),
      chapter("chapter-2", "2.MCU 篇", 2),
      chapter("chapter-3", "3. 操作系统篇", 3),
    ];

    const reordered = reorderChapters(chapters, "chapter-1", "chapter-3");

    expect(reordered.map((item) => item.id)).toEqual(["chapter-2", "chapter-3", "chapter-1"]);
    expect(reordered.map((item) => item.sort_order)).toEqual([1, 2, 3]);
    expect(reordered.map((item) => item.title)).toEqual(["1. MCU 篇", "2. 操作系统篇", "3. C语言篇"]);
  });

  it("moves a question to the target position and returns continuous sort order", () => {
    const reordered = reorderQuestions([
      question("question-1", 1),
      question("question-2", 2),
      question("question-3", 3),
    ], "question-1", "question-3");

    expect(reordered.map((item) => item.id)).toEqual(["question-2", "question-3", "question-1"]);
    expect(reordered.map((item) => item.sort_order)).toEqual([1, 2, 3]);
  });
});
