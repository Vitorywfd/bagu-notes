import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuizView } from "./QuizView";
import type { Chapter, Question } from "../types";

function chapter(id: string, title: string): Chapter {
  return {
    id,
    user_id: "user-1",
    title,
    sort_order: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  };
}

function question(id: string, chapterId: string, title: string, sortOrder: number): Question {
  return {
    id,
    user_id: "user-1",
    chapter_id: chapterId,
    question: title,
    answer: `answer ${title}`,
    sort_order: sortOrder,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  };
}

describe("QuizView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores the latest cloud progress question instead of stale local position", async () => {
    localStorage.setItem("bagu-notes-ui-v1", JSON.stringify({
      chapterId: "chapter-1",
      questionId: "question-1",
      answerOpen: false,
      favoriteOnly: false,
    }));

    const onRecordView = vi.fn().mockResolvedValue(undefined);

    render(
      <QuizView
        chapters={[chapter("chapter-1", "C语言篇")]}
        questions={[
          question("question-1", "chapter-1", "第一题", 1),
          question("question-2", "chapter-1", "第五题", 5),
        ]}
        favoriteIds={new Set()}
        viewedCount={1}
        resumeQuestionId="question-2"
        loading={false}
        onToggleFavorite={vi.fn().mockResolvedValue(undefined)}
        onRecordView={onRecordView}
        onCurrentQuestionChange={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Q2. 第五题" })).toBeInTheDocument();
    });

    expect(JSON.parse(localStorage.getItem("bagu-notes-ui-v1") || "{}")).toMatchObject({
      chapterId: "chapter-1",
      questionId: "question-2",
    });
    await waitFor(() => expect(onRecordView).toHaveBeenCalledWith("question-2"));
    expect(onRecordView).not.toHaveBeenCalledWith("question-1");
  });

  it("reports the visible question to the app shell", async () => {
    const onCurrentQuestionChange = vi.fn();

    render(
      <QuizView
        chapters={[chapter("chapter-1", "C语言篇")]}
        questions={[question("question-1", "chapter-1", "第一题", 1)]}
        favoriteIds={new Set()}
        viewedCount={0}
        resumeQuestionId=""
        loading={false}
        onToggleFavorite={vi.fn().mockResolvedValue(undefined)}
        onRecordView={vi.fn().mockResolvedValue(undefined)}
        onCurrentQuestionChange={onCurrentQuestionChange}
      />,
    );

    await waitFor(() => expect(onCurrentQuestionChange).toHaveBeenCalledWith("question-1"));
  });
});
