import { parseQuestionBankImport } from "./importExport";
import { reorderChapters as reorderChapterItems, reorderQuestions as reorderQuestionItems } from "./reorder";
import { sampleBankJson } from "../data/sampleBank";
import type { Chapter, Favorite, PortableQuestionBank, Progress, PublicQuestion, Question } from "../types";

type DemoState = {
  chapters: Chapter[];
  questions: Question[];
  favorites: Favorite[];
  progress: Progress[];
  publicQuestions: PublicQuestion[];
};

const DEMO_USER_ID = "demo-user";

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
}

function initialState(): DemoState {
  return materializeBank(parseQuestionBankImport(sampleBankJson));
}

function materializeBank(bank: PortableQuestionBank): DemoState {
  const created = now();
  const chapters: Chapter[] = bank.chapters.map((chapter) => ({
    id: makeId("chapter"),
    user_id: DEMO_USER_ID,
    title: chapter.title,
    sort_order: chapter.sort_order,
    created_at: created,
    updated_at: created,
  }));
  const chapterByTitle = new Map(chapters.map((chapter) => [chapter.title, chapter]));
  const questions: Question[] = bank.questions.map((question) => {
    const chapter = chapterByTitle.get(question.chapterTitle) || chapters[0];
    return {
      id: makeId("question"),
      user_id: DEMO_USER_ID,
      chapter_id: chapter.id,
      question: question.question,
      answer: question.answer,
      sort_order: question.sort_order,
      created_at: created,
      updated_at: created,
    };
  });
  return { chapters, questions, favorites: [], progress: [], publicQuestions: [] };
}

export function createDemoBankStore(seed: DemoState = initialState()) {
  let state: DemoState = structuredClone(seed);

  const getState = () => structuredClone(state);

  const createChapter = (title: string) => {
    const chapter: Chapter = {
      id: makeId("chapter"),
      user_id: DEMO_USER_ID,
      title: title.trim(),
      sort_order: state.chapters.length + 1,
      created_at: now(),
      updated_at: now(),
    };
    state = { ...state, chapters: [...state.chapters, chapter] };
    return structuredClone(chapter);
  };

  const updateChapter = (chapterId: string, title: string) => {
    state = {
      ...state,
      chapters: state.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, title: title.trim(), updated_at: now() } : chapter,
      ),
    };
  };

  const deleteChapter = (chapterId: string) => {
    const questionIds = new Set(state.questions.filter((item) => item.chapter_id === chapterId).map((item) => item.id));
    state = {
      chapters: state.chapters.filter((chapter) => chapter.id !== chapterId),
      questions: state.questions.filter((question) => question.chapter_id !== chapterId),
      favorites: state.favorites.filter((favorite) => !questionIds.has(favorite.question_id)),
      progress: state.progress.filter((item) => !questionIds.has(item.question_id)),
      publicQuestions: state.publicQuestions,
    };
  };

  const saveQuestion = (input: { id?: string; chapter_id: string; question: string; answer: string }) => {
    const existing = input.id ? state.questions.find((item) => item.id === input.id) : null;
    const question: Question = {
      id: existing?.id || makeId("question"),
      user_id: DEMO_USER_ID,
      chapter_id: input.chapter_id,
      question: input.question.trim(),
      answer: input.answer.trim(),
      sort_order: existing?.sort_order || state.questions.filter((item) => item.chapter_id === input.chapter_id).length + 1,
      created_at: existing?.created_at || now(),
      updated_at: now(),
    };
    state = {
      ...state,
      questions: existing
        ? state.questions.map((item) => (item.id === question.id ? question : item))
        : [...state.questions, question],
    };
    return structuredClone(question);
  };

  const deleteQuestion = (questionId: string) => {
    state = {
      ...state,
      questions: state.questions.filter((question) => question.id !== questionId),
      favorites: state.favorites.filter((favorite) => favorite.question_id !== questionId),
      progress: state.progress.filter((item) => item.question_id !== questionId),
    };
  };

  const reorderChapters = (activeId: string, overId: string) => {
    state = {
      ...state,
      chapters: reorderChapterItems(state.chapters, activeId, overId),
    };
  };

  const reorderQuestions = (chapterId: string, activeId: string, overId: string) => {
    const chapterQuestions = state.questions.filter((question) => question.chapter_id === chapterId);
    const reordered = reorderQuestionItems(chapterQuestions, activeId, overId);
    const byId = new Map(reordered.map((question) => [question.id, question]));
    state = {
      ...state,
      questions: state.questions.map((question) => byId.get(question.id) || question),
    };
  };

  const toggleFavorite = (questionId: string) => {
    const exists = state.favorites.some((favorite) => favorite.question_id === questionId);
    state = {
      ...state,
      favorites: exists
        ? state.favorites.filter((favorite) => favorite.question_id !== questionId)
        : [...state.favorites, { user_id: DEMO_USER_ID, question_id: questionId, created_at: now() }],
    };
  };

  const recordView = (questionId: string) => {
    const existing = state.progress.find((item) => item.question_id === questionId);
    state = {
      ...state,
      progress: existing
        ? state.progress.map((item) =>
            item.question_id === questionId ? { ...item, viewed_count: item.viewed_count + 1, last_viewed_at: now() } : item,
          )
        : [...state.progress, { user_id: DEMO_USER_ID, question_id: questionId, viewed_count: 1, last_viewed_at: now() }],
    };
  };

  const importBank = (rawJson: string) => {
    const bank = parseQuestionBankImport(rawJson);
    for (const chapterInput of bank.chapters) {
      let chapter = state.chapters.find((item) => item.title === chapterInput.title);
      if (!chapter) chapter = createChapter(chapterInput.title);

      for (const questionInput of bank.questions.filter((item) => item.chapterTitle === chapterInput.title)) {
        const existing = state.questions.find((item) => item.chapter_id === chapter.id && item.question === questionInput.question);
        saveQuestion({
          id: existing?.id,
          chapter_id: chapter.id,
          question: questionInput.question,
          answer: questionInput.answer,
        });
      }
    }
  };

  const publishQuestion = (questionId: string) => {
    const question = state.questions.find((item) => item.id === questionId);
    const chapter = question ? state.chapters.find((item) => item.id === question.chapter_id) : null;
    if (!question || !chapter) return;
    const existing = state.publicQuestions.find((item) => item.source_question_id === question.id);
    const publicQuestion: PublicQuestion = {
      id: existing?.id || makeId("public-question"),
      owner_id: DEMO_USER_ID,
      source_question_id: question.id,
      chapter_title: chapter.title,
      question: question.question,
      answer: question.answer,
      created_at: existing?.created_at || now(),
    };
    state = {
      ...state,
      publicQuestions: existing
        ? state.publicQuestions.map((item) => (item.id === publicQuestion.id ? publicQuestion : item))
        : [publicQuestion, ...state.publicQuestions],
    };
  };

  const deletePublicQuestion = (publicQuestionId: string) => {
    state = {
      ...state,
      publicQuestions: state.publicQuestions.filter((item) => item.id !== publicQuestionId),
    };
  };

  const addPublicQuestionToMine = (publicQuestionId: string) => {
    const item = state.publicQuestions.find((question) => question.id === publicQuestionId);
    if (!item) return;
    let chapter = state.chapters.find((entry) => entry.title === item.chapter_title);
    if (!chapter) chapter = createChapter(item.chapter_title);
    const existing = state.questions.find((question) => question.chapter_id === chapter.id && question.question === item.question);
    saveQuestion({
      id: existing?.id,
      chapter_id: chapter.id,
      question: item.question,
      answer: item.answer,
    });
  };

  return {
    getState,
    createChapter,
    updateChapter,
    deleteChapter,
    saveQuestion,
    deleteQuestion,
    reorderChapters,
    reorderQuestions,
    toggleFavorite,
    recordView,
    importBank,
    publishQuestion,
    deletePublicQuestion,
    addPublicQuestionToMine,
  };
}
