import { useMemo, useRef, useState } from "react";
import { createDemoBankStore } from "../lib/demoBank";

export function useDemoQuestionBank() {
  const store = useRef(createDemoBankStore());
  const [state, setState] = useState(() => store.current.getState());
  const favoriteIds = useMemo(() => new Set(state.favorites.map((item) => item.question_id)), [state.favorites]);

  function sync() {
    setState(store.current.getState());
  }

  return {
    ...state,
    favoriteIds,
    loading: false,
    message: "当前是本地预览模式：数据只保存在当前浏览器会话，配置 Supabase 后可启用账号登录和云端同步。",
    refresh: async () => sync(),
    createChapter: async (title: string) => { store.current.createChapter(title); sync(); },
    updateChapter: async (chapterId: string, title: string) => { store.current.updateChapter(chapterId, title); sync(); },
    deleteChapter: async (chapterId: string) => { store.current.deleteChapter(chapterId); sync(); },
    upsertQuestion: async (input: { id?: string; chapter_id: string; question: string; answer: string }) => {
      store.current.saveQuestion(input);
      sync();
    },
    deleteQuestion: async (questionId: string) => { store.current.deleteQuestion(questionId); sync(); },
    toggleFavorite: async (questionId: string) => { store.current.toggleFavorite(questionId); sync(); },
    recordView: async (questionId: string) => { store.current.recordView(questionId); sync(); },
    importBank: async (rawJson: string) => { store.current.importBank(rawJson); sync(); },
    publishQuestion: async (questionId: string) => { store.current.publishQuestion(questionId); sync(); },
    deletePublicQuestion: async (publicQuestionId: string) => { store.current.deletePublicQuestion(publicQuestionId); sync(); },
    addPublicQuestionToMine: async (publicQuestionId: string) => { store.current.addPublicQuestionToMine(publicQuestionId); sync(); },
  };
}
