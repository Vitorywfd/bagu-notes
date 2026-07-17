import { describe, expect, it } from "vitest";
import { createDemoBankStore } from "./demoBank";
import { sampleBankJson } from "../data/sampleBank";

describe("createDemoBankStore", () => {
  it("loads sample data and supports favorite toggles", () => {
    const store = createDemoBankStore();
    const first = store.getState().questions[0];

    store.toggleFavorite(first.id);
    expect(store.getState().favorites).toEqual([
      expect.objectContaining({ question_id: first.id }),
    ]);

    store.toggleFavorite(first.id);
    expect(store.getState().favorites).toEqual([]);
  });

  it("creates chapters and questions in local preview mode", () => {
    const store = createDemoBankStore();
    const chapter = store.createChapter("Linux篇");
    const question = store.saveQuestion({
      chapter_id: chapter.id,
      question: "select 和 poll 的区别？",
      answer: "poll 没有 fd_set 数量限制，接口也不同。",
    });

    expect(store.getState().chapters).toContainEqual(chapter);
    expect(store.getState().questions).toContainEqual(question);
  });

  it("imports the same sample bank idempotently", () => {
    const store = createDemoBankStore();
    const before = store.getState().questions.length;

    store.importBank(sampleBankJson);

    expect(store.getState().questions).toHaveLength(before);
  });

  it("reorders chapters and questions with continuous sort order", () => {
    const createdAt = "2026-07-17T00:00:00.000Z";
    const chapters = ["chapter-1", "chapter-2", "chapter-3"].map((id, index) => ({
      id,
      user_id: "demo-user",
      title: `${index + 1}. 第${index + 1}篇`,
      sort_order: index + 1,
      created_at: createdAt,
      updated_at: createdAt,
    }));
    const chapterQuestions = ["question-1", "question-2", "question-3"].map((id, index) => ({
      id,
      user_id: "demo-user",
      chapter_id: "chapter-1",
      question: `第${index + 1}题`,
      answer: "答案",
      sort_order: index + 1,
      created_at: createdAt,
      updated_at: createdAt,
    }));
    const store = createDemoBankStore({
      chapters,
      questions: chapterQuestions,
      favorites: [],
      progress: [],
      publicQuestions: [],
    });

    store.reorderChapters(chapters[0].id, chapters[2].id);
    store.reorderQuestions("chapter-1", chapterQuestions[0].id, chapterQuestions[2].id);

    expect([...store.getState().chapters].sort((a, b) => a.sort_order - b.sort_order).map((chapter) => chapter.id))
      .toEqual([chapters[1].id, chapters[2].id, chapters[0].id, ...chapters.slice(3).map((chapter) => chapter.id)]);
    expect(store.getState().questions
      .filter((question) => question.chapter_id === "chapter-1")
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, 3)
      .map((question) => question.id))
      .toEqual([chapterQuestions[1].id, chapterQuestions[2].id, chapterQuestions[0].id]);
  });
});
