import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { parseQuestionBankImport } from "../lib/importExport";
import { supabaseRest } from "../lib/supabaseRest";
import type { Chapter, Favorite, PortableQuestionBank, Progress, PublicQuestion, Question } from "../types";

type BankState = {
  chapters: Chapter[];
  questions: Question[];
  favorites: Favorite[];
  progress: Progress[];
  publicQuestions: PublicQuestion[];
};

const emptyState: BankState = { chapters: [], questions: [], favorites: [], progress: [], publicQuestions: [] };

function requireClient() {
  if (!supabase) throw new Error("Supabase 环境变量未配置");
  return supabase;
}

function isMissingPublicQuestionsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  return code === "42P01" || message.includes("public_questions");
}

export function useQuestionBank(user: User | null) {
  const [state, setState] = useState<BankState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const client = requireClient();
      const [chapters, questions, favorites, progress, publicQuestions] = await Promise.all([
        client.from("chapters").select("*").order("sort_order").order("created_at"),
        client.from("questions").select("*").order("sort_order").order("created_at"),
        client.from("favorites").select("*"),
        client.from("study_progress").select("*"),
        client.from("public_questions").select("*").order("created_at", { ascending: false }),
      ]);

      for (const result of [chapters, questions, favorites, progress]) {
        if (result.error) throw result.error;
      }
      if (publicQuestions.error && !isMissingPublicQuestionsTable(publicQuestions.error)) {
        throw publicQuestions.error;
      }

      setState({
        chapters: (chapters.data || []) as Chapter[],
        questions: (questions.data || []) as Question[],
        favorites: (favorites.data || []) as Favorite[],
        progress: (progress.data || []) as Progress[],
        publicQuestions: publicQuestions.error ? [] : (publicQuestions.data || []) as PublicQuestion[],
      });
      if (publicQuestions.error) {
        setMessage("公共题库表还未创建。请先在 Supabase SQL Editor 执行 public_questions 迁移 SQL。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载题库失败");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const favoriteIds = useMemo(() => new Set(state.favorites.map((item) => item.question_id)), [state.favorites]);

  const createChapter = useCallback(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed || !user) return;
    const client = requireClient();
    const { error } = await client.from("chapters").insert({
      user_id: user.id,
      title: trimmed,
      sort_order: state.chapters.length + 1,
    });
    if (error) throw error;
    await refresh();
  }, [refresh, state.chapters.length, user]);

  const updateChapter = useCallback(async (chapterId: string, title: string) => {
    const client = requireClient();
    const { error } = await client.from("chapters").update({ title: title.trim() }).eq("id", chapterId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const deleteChapter = useCallback(async (chapterId: string) => {
    const client = requireClient();
    const { error } = await client.from("chapters").delete().eq("id", chapterId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const upsertQuestion = useCallback(async (input: {
    id?: string;
    chapter_id: string;
    question: string;
    answer: string;
  }) => {
    if (!user) return;
    const client = requireClient();
    const payload = {
      user_id: user.id,
      chapter_id: input.chapter_id,
      question: input.question.trim(),
      answer: input.answer.trim(),
      sort_order: state.questions.filter((item) => item.chapter_id === input.chapter_id).length + 1,
    };
    const query = input.id
      ? client.from("questions").update({
          chapter_id: input.chapter_id,
          question: payload.question,
          answer: payload.answer,
        }).eq("id", input.id)
      : client.from("questions").insert(payload);
    const { error } = await query;
    if (error) throw error;
    await refresh();
  }, [refresh, state.questions, user]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    const client = requireClient();
    const { error } = await client.from("questions").delete().eq("id", questionId);
    if (error) throw error;
    await refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(async (questionId: string) => {
    if (!user) return;
    const client = requireClient();
    if (favoriteIds.has(questionId)) {
      const { error } = await client.from("favorites").delete().eq("question_id", questionId);
      if (error) throw error;
    } else {
      const { error } = await client.from("favorites").insert({ user_id: user.id, question_id: questionId });
      if (error) throw error;
    }
    await refresh();
  }, [favoriteIds, refresh, user]);

  const recordView = useCallback(async (questionId: string) => {
    if (!user) return;
    const existing = state.progress.find((item) => item.question_id === questionId);
    const client = requireClient();
    const { error } = await client.from("study_progress").upsert({
      user_id: user.id,
      question_id: questionId,
      viewed_count: (existing?.viewed_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    }, { onConflict: "user_id,question_id" });
    if (error) throw error;
    await refresh();
  }, [refresh, state.progress, user]);

  const importBank = useCallback(async (rawJson: string) => {
    if (!user) return;
    const bank: PortableQuestionBank = parseQuestionBankImport(rawJson);
    const client = requireClient();

    for (const chapter of bank.chapters) {
      const { data, error } = await client
        .from("chapters")
        .upsert({ user_id: user.id, title: chapter.title, sort_order: chapter.sort_order }, { onConflict: "user_id,title" })
        .select()
        .single();
      if (error) throw error;

      const related = bank.questions.filter((question) => question.chapterTitle === chapter.title);
      if (related.length) {
        const { error: questionError } = await client.from("questions").upsert(
          related.map((question) => ({
            user_id: user.id,
            chapter_id: data.id,
            question: question.question,
            answer: question.answer,
            sort_order: question.sort_order,
          })),
          { onConflict: "user_id,chapter_id,question" },
        );
        if (questionError) throw questionError;
      }
    }
    await refresh();
  }, [refresh, user]);

  const publishQuestion = useCallback(async (questionId: string) => {
    if (!user) return;
    const question = state.questions.find((item) => item.id === questionId);
    if (!question) throw new Error("题目不存在");
    const chapter = state.chapters.find((item) => item.id === question.chapter_id);
    if (!chapter) throw new Error("章节不存在");
    await supabaseRest<PublicQuestion[]>("/rest/v1/public_questions?on_conflict=owner_id,source_question_id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
      owner_id: user.id,
      source_question_id: question.id,
      chapter_title: chapter.title,
      question: question.question,
      answer: question.answer,
      }),
    });
    await refresh();
  }, [refresh, state.chapters, state.questions, user]);

  const deletePublicQuestion = useCallback(async (publicQuestionId: string) => {
    await supabaseRest<null>(`/rest/v1/public_questions?id=eq.${encodeURIComponent(publicQuestionId)}`, {
      method: "DELETE",
    });
    await refresh();
  }, [refresh]);

  const addPublicQuestionToMine = useCallback(async (publicQuestionId: string) => {
    if (!user) return;
    const item = state.publicQuestions.find((question) => question.id === publicQuestionId);
    if (!item) throw new Error("公共题目不存在");
    const client = requireClient();
    const { data: chapter, error: chapterError } = await client
      .from("chapters")
      .upsert({
        user_id: user.id,
        title: item.chapter_title,
        sort_order: state.chapters.length + 1,
      }, { onConflict: "user_id,title" })
      .select()
      .single();
    if (chapterError) throw chapterError;

    const existingCount = state.questions.filter((question) => question.chapter_id === chapter.id).length;
    const { error: questionError } = await client.from("questions").upsert({
      user_id: user.id,
      chapter_id: chapter.id,
      question: item.question,
      answer: item.answer,
      sort_order: existingCount + 1,
    }, { onConflict: "user_id,chapter_id,question" });
    if (questionError) throw questionError;
    await refresh();
  }, [refresh, state.chapters.length, state.publicQuestions, state.questions, user]);

  return {
    ...state,
    favoriteIds,
    loading,
    message,
    refresh,
    createChapter,
    updateChapter,
    deleteChapter,
    upsertQuestion,
    deleteQuestion,
    toggleFavorite,
    recordView,
    importBank,
    publishQuestion,
    deletePublicQuestion,
    addPublicQuestionToMine,
  };
}
