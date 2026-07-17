import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManageView } from "./ManageView";
import type { Chapter, Question } from "../types";

function chapter(id: string, title: string): Chapter {
  return {
    id,
    user_id: "user-1",
    title,
    sort_order: 1,
    created_at: "2026-07-16T00:00:00.000Z",
    updated_at: "2026-07-16T00:00:00.000Z",
  };
}

function question(id: string, chapterId: string, title: string, answer: string): Question {
  return {
    id,
    user_id: "user-1",
    chapter_id: chapterId,
    question: title,
    answer,
    sort_order: 1,
    created_at: "2026-07-16T00:00:00.000Z",
    updated_at: "2026-07-16T00:00:00.000Z",
  };
}

describe("ManageView", () => {
  afterEach(() => cleanup());

  it("edits the current quiz question until the user starts a new question", async () => {
    const ManageViewWithActiveQuestion = ManageView as unknown as ComponentType<
      ComponentProps<typeof ManageView> & { activeQuestionId: string }
    >;
    const chapters = [chapter("chapter-c", "1. C语言篇"), chapter("chapter-rtos", "3. 操作系统篇")];
    const activeQuestion = question("question-5", "chapter-rtos", "第五题", "第五题答案");

    render(
      <ManageViewWithActiveQuestion
        activeQuestionId={activeQuestion.id}
        chapters={chapters}
        questions={[question("question-1", "chapter-c", "第一题", "第一题答案"), activeQuestion]}
        onCreateChapter={vi.fn().mockResolvedValue(undefined)}
        onUpdateChapter={vi.fn().mockResolvedValue(undefined)}
        onDeleteChapter={vi.fn().mockResolvedValue(undefined)}
        onSaveQuestion={vi.fn().mockResolvedValue(undefined)}
        onDeleteQuestion={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "编辑题目" })).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("第五题")).toBeInTheDocument();
    expect(screen.getByDisplayValue("第五题答案")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("chapter-rtos");

    fireEvent.click(screen.getByRole("button", { name: "新增题目" }));

    expect(screen.getByRole("heading", { name: "新增题目" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入题目")).toHaveValue("");
    expect(screen.getByPlaceholderText("支持 Markdown 和代码块")).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveValue("chapter-rtos");
  });

  it("renders drag handles for chapters and current chapter questions", () => {
    const ManageViewWithSorting = ManageView as unknown as ComponentType<
      ComponentProps<typeof ManageView> & {
        activeQuestionId: string;
        onReorderChapters: (activeId: string, overId: string) => Promise<void>;
        onReorderQuestions: (chapterId: string, activeId: string, overId: string) => Promise<void>;
      }
    >;
    const chapterId = "chapter-c";

    render(
      <ManageViewWithSorting
        activeQuestionId=""
        chapters={[
          chapter(chapterId, "1. C语言篇"),
          chapter("chapter-mcu", "2. MCU篇"),
          chapter("chapter-rtos", "3. 操作系统篇"),
        ]}
        questions={[
          question("question-1", chapterId, "第一题", "答案一"),
          question("question-2", chapterId, "第二题", "答案二"),
          question("question-3", chapterId, "第三题", "答案三"),
        ]}
        onCreateChapter={vi.fn().mockResolvedValue(undefined)}
        onUpdateChapter={vi.fn().mockResolvedValue(undefined)}
        onDeleteChapter={vi.fn().mockResolvedValue(undefined)}
        onSaveQuestion={vi.fn().mockResolvedValue(undefined)}
        onDeleteQuestion={vi.fn().mockResolvedValue(undefined)}
        onReorderChapters={vi.fn().mockResolvedValue(undefined)}
        onReorderQuestions={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getAllByLabelText("拖动排序章节")).toHaveLength(3);
    expect(screen.getAllByLabelText("拖动排序题目")).toHaveLength(3);
  });
});
