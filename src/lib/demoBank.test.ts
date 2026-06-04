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
});
