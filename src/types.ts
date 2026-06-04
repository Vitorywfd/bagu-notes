export type UUID = string;

export type Chapter = {
  id: UUID;
  user_id: UUID;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: UUID;
  user_id: UUID;
  chapter_id: UUID;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicQuestion = {
  id: UUID;
  owner_id: UUID;
  source_question_id: UUID | null;
  chapter_title: string;
  question: string;
  answer: string;
  created_at: string;
};

export type Favorite = {
  user_id: UUID;
  question_id: UUID;
  created_at: string;
};

export type Progress = {
  user_id: UUID;
  question_id: UUID;
  viewed_count: number;
  last_viewed_at: string;
};

export type AppTab = "quiz" | "manage" | "public" | "import";

export type PortableQuestion = {
  chapterTitle: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type PortableChapter = {
  title: string;
  sort_order: number;
};

export type PortableQuestionBank = {
  version: 1;
  exportedAt: string;
  chapters: PortableChapter[];
  questions: PortableQuestion[];
};
