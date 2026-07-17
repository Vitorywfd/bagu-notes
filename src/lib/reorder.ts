import type { Chapter, Question } from "../types";

type SortableItem = {
  id: string;
  sort_order: number;
};

function moveToTarget<T extends SortableItem>(items: T[], activeId: string, overId: string) {
  const fromIndex = items.findIndex((item) => item.id === activeId);
  const toIndex = items.findIndex((item) => item.id === overId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function withSortOrder<T extends SortableItem>(items: T[]) {
  return items.map((item, index) => ({ ...item, sort_order: index + 1 }));
}

function renumberTitle(title: string, position: number) {
  const match = title.match(/^\s*\d+\s*[.、]\s*(.+)$/);
  return match ? `${position}. ${match[1].trim()}` : title;
}

export function reorderChapters(chapters: Chapter[], activeId: string, overId: string) {
  return withSortOrder(moveToTarget(chapters, activeId, overId)).map((chapter, index) => ({
    ...chapter,
    title: renumberTitle(chapter.title, index + 1),
  }));
}

export function reorderQuestions(questions: Question[], activeId: string, overId: string) {
  return withSortOrder(moveToTarget(questions, activeId, overId));
}
