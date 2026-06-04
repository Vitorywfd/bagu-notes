import { describe, expect, it } from "vitest";
import { exportQuestionBank, parseQuestionBankImport } from "./importExport";
import type { Chapter, Question } from "../types";

const chapters: Chapter[] = [
  {
    id: "c1",
    user_id: "u1",
    title: "C语言篇",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const questions: Question[] = [
  {
    id: "q1",
    user_id: "u1",
    chapter_id: "c1",
    question: "sizeof 和 strlen 的区别",
    answer: "sizeof 是操作符，strlen 是库函数。",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

describe("question bank import/export", () => {
  it("exports a compact portable question bank and parses it back", () => {
    const json = exportQuestionBank(chapters, questions);
    const parsed = parseQuestionBankImport(json);

    expect(parsed.chapters).toEqual([{ title: "C语言篇", sort_order: 1 }]);
    expect(parsed.questions).toEqual([
      {
        chapterTitle: "C语言篇",
        question: "sizeof 和 strlen 的区别",
        answer: "sizeof 是操作符，strlen 是库函数。",
        sort_order: 1,
      },
    ]);
  });

  it("rejects missing question fields", () => {
    const badJson = JSON.stringify({
      version: 1,
      chapters: [{ title: "C语言篇" }],
      questions: [{ chapterTitle: "C语言篇", question: "缺少答案" }],
    });

    expect(() => parseQuestionBankImport(badJson)).toThrow("第 1 道题缺少 answer");
  });
});
