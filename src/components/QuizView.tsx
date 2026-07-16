import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { renderAnswerMarkdown } from "../lib/markdown";
import { loadLocalUiState, saveLocalUiState } from "../lib/localState";
import type { Chapter, Question } from "../types";

type Props = {
  chapters: Chapter[];
  questions: Question[];
  favoriteIds: Set<string>;
  viewedCount: number;
  resumeQuestionId: string;
  loading: boolean;
  onToggleFavorite: (questionId: string) => Promise<void>;
  onRecordView: (questionId: string) => Promise<void>;
  onCurrentQuestionChange: (questionId: string) => void;
};

export function QuizView(props: Props) {
  const [ui, setUi] = useState(loadLocalUiState);
  const [appliedResumeQuestionId, setAppliedResumeQuestionId] = useState("");
  const [favoriteBusyId, setFavoriteBusyId] = useState("");
  const [favoriteMessage, setFavoriteMessage] = useState("");

  const currentChapter = useMemo(() => {
    return props.chapters.find((chapter) => chapter.id === ui.chapterId) || props.chapters[0];
  }, [props.chapters, ui.chapterId]);

  const currentList = useMemo(() => {
    const list = props.questions.filter((question) => question.chapter_id === currentChapter?.id);
    return ui.favoriteOnly ? list.filter((question) => props.favoriteIds.has(question.id)) : list;
  }, [currentChapter?.id, props.favoriteIds, props.questions, ui.favoriteOnly]);

  const currentIndex = Math.max(0, currentList.findIndex((question) => question.id === ui.questionId));
  const currentQuestion = currentList[currentIndex] || currentList[0];
  const resumeQuestion = useMemo(() => {
    return props.questions.find((question) => question.id === props.resumeQuestionId);
  }, [props.questions, props.resumeQuestionId]);
  const shouldApplyResume = Boolean(
    resumeQuestion &&
    props.resumeQuestionId &&
    appliedResumeQuestionId !== props.resumeQuestionId,
  );

  useEffect(() => {
    if (!currentChapter) return;
    if (ui.chapterId !== currentChapter.id) {
      const next = { ...ui, chapterId: currentChapter.id, questionId: "" };
      setUi(next);
      saveLocalUiState(next);
    }
  }, [currentChapter, ui]);

  useEffect(() => {
    if (!resumeQuestion || !shouldApplyResume) return;
    const next = {
      ...ui,
      chapterId: resumeQuestion.chapter_id,
      questionId: resumeQuestion.id,
      answerOpen: false,
      favoriteOnly: false,
    };
    setAppliedResumeQuestionId(resumeQuestion.id);
    setUi(next);
    saveLocalUiState(next);
  }, [resumeQuestion, shouldApplyResume, ui]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (shouldApplyResume) return;
    void props.onRecordView(currentQuestion.id).catch(() => {
      // The hook surfaces the save failure through the shared app message.
    });
    // record once when the visible question changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (currentQuestion) props.onCurrentQuestionChange(currentQuestion.id);
  }, [currentQuestion?.id, props.onCurrentQuestionChange]);

  function updateUi(next: typeof ui) {
    setUi(next);
    saveLocalUiState(next);
  }

  function go(nextIndex: number) {
    const next = currentList[Math.max(0, Math.min(nextIndex, currentList.length - 1))];
    if (next) updateUi({ ...ui, questionId: next.id, answerOpen: false });
  }

  async function toggleFavorite(questionId: string) {
    if (favoriteBusyId) return;

    setFavoriteBusyId(questionId);
    setFavoriteMessage("");

    try {
      await props.onToggleFavorite(questionId);
    } catch (error) {
      setFavoriteMessage(error instanceof Error ? error.message : "收藏操作失败，请稍后重试。");
    } finally {
      setFavoriteBusyId("");
    }
  }

  if (props.loading) return <section className="panel empty-state">题库加载中...</section>;

  if (!props.chapters.length) {
    return (
      <section className="panel empty-state">
        <h2>还没有题库</h2>
        <p>先到“管理”新增章节和题目，或者在“导入导出”导入示例题库。</p>
      </section>
    );
  }

  if (!currentQuestion) {
    return (
      <section className="panel empty-state">
        <h2>{ui.favoriteOnly ? "暂无收藏题" : "当前章节暂无题目"}</h2>
        <p>{ui.favoriteOnly ? "取消仅看收藏，或先收藏一些题。" : "去管理页给这个章节添加题目。"}</p>
        <button className="secondary-btn" onClick={() => updateUi({ ...ui, favoriteOnly: false })}>显示全部题目</button>
      </section>
    );
  }

  return (
    <section className="quiz-stack">
      <div className="stats-strip">
        <span>已刷 {props.viewedCount} 题</span>
        <span>收藏 {props.favoriteIds.size} 题</span>
        <span>章节 {props.chapters.length} 个</span>
      </div>

      <label className="field-label">
        章节
        <select
          value={currentChapter.id}
          onChange={(event) => updateUi({ ...ui, chapterId: event.target.value, questionId: "", answerOpen: false })}
        >
          {props.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
        </select>
      </label>

      <label className="field-label">
        题目目录
        <select value={currentQuestion.id} onChange={(event) => updateUi({ ...ui, questionId: event.target.value, answerOpen: false })}>
          {currentList.map((question, index) => (
            <option key={question.id} value={question.id}>Q{index + 1}. {question.question}</option>
          ))}
        </select>
      </label>

      <div className="inline-row">
        <span className="muted">题目 {currentIndex + 1} / {currentList.length}</span>
        <label className="switch-line">
          <input
            type="checkbox"
            checked={ui.favoriteOnly}
            onChange={(event) => updateUi({ ...ui, favoriteOnly: event.target.checked, questionId: "", answerOpen: false })}
          />
          仅看收藏
        </label>
      </div>

      <article className="question-card">
        <div className="question-meta">
          <span>当前题目</span>
          <button
            className={`favorite-icon ${props.favoriteIds.has(currentQuestion.id) ? "active" : ""}`}
            disabled={favoriteBusyId === currentQuestion.id}
            onClick={() => toggleFavorite(currentQuestion.id)}
          >
            <Star size={18} fill="currentColor" /> {favoriteBusyId === currentQuestion.id ? "处理中" : props.favoriteIds.has(currentQuestion.id) ? "已收藏" : "收藏"}
          </button>
        </div>
        {favoriteMessage && <p className="toast-inline compact">{favoriteMessage}</p>}
        <button className="question-title" onClick={() => updateUi({ ...ui, answerOpen: !ui.answerOpen })}>
          Q{currentIndex + 1}. {currentQuestion.question}
        </button>
        {ui.answerOpen && (
          <div className="answer-box" dangerouslySetInnerHTML={{ __html: renderAnswerMarkdown(currentQuestion.answer) }} />
        )}
      </article>

      <div className="quiz-actions">
        <button className="secondary-btn" disabled={currentIndex <= 0} onClick={() => go(currentIndex - 1)}>
          <ChevronLeft size={18} /> 上一题
        </button>
        <button className="primary-btn" disabled={currentIndex >= currentList.length - 1} onClick={() => go(currentIndex + 1)}>
          下一题 <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
