import type { Chapter, PortableQuestionBank, Question } from "../types";

function asString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function exportQuestionBank(chapters: Chapter[], questions: Question[]) {
  const titleById = new Map(chapters.map((chapter) => [chapter.id, chapter.title]));
  const payload: PortableQuestionBank = {
    version: 1,
    exportedAt: new Date().toISOString(),
    chapters: chapters
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((chapter) => ({
        title: chapter.title,
        sort_order: chapter.sort_order,
      })),
    questions: questions
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        chapterTitle: titleById.get(item.chapter_id) || "未分组",
        question: item.question,
        answer: item.answer,
        sort_order: item.sort_order,
      })),
  };

  return JSON.stringify(payload, null, 2);
}

export function parseQuestionBankImport(raw: string): PortableQuestionBank {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("导入内容不是合法 JSON");
  }

  if (!value || typeof value !== "object") throw new Error("导入内容必须是对象");
  const payload = value as Record<string, unknown>;
  if (payload.version !== 1) throw new Error("仅支持 version 为 1 的题库文件");
  if (!Array.isArray(payload.chapters)) throw new Error("缺少 chapters 数组");
  if (!Array.isArray(payload.questions)) throw new Error("缺少 questions 数组");

  const chapters = payload.chapters.map((chapter, index) => {
    const item = chapter as Record<string, unknown>;
    return {
      title: asString(item.title, `第 ${index + 1} 个章节缺少 title`),
      sort_order: asNumber(item.sort_order, index + 1),
    };
  });

  const questions = payload.questions.map((question, index) => {
    const item = question as Record<string, unknown>;
    return {
      chapterTitle: asString(item.chapterTitle, `第 ${index + 1} 道题缺少 chapterTitle`),
      question: asString(item.question, `第 ${index + 1} 道题缺少 question`),
      answer: asString(item.answer, `第 ${index + 1} 道题缺少 answer`),
      sort_order: asNumber(item.sort_order, index + 1),
    };
  });

  return {
    version: 1,
    exportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : new Date().toISOString(),
    chapters,
    questions,
  };
}
