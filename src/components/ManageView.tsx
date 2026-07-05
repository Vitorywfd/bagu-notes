import { useMemo, useState } from "react";
import { PenLine, Plus, Trash2 } from "lucide-react";
import { getErrorMessage } from "../lib/errorMessage";
import type { Chapter, Question } from "../types";

type Props = {
  chapters: Chapter[];
  questions: Question[];
  onCreateChapter: (title: string) => Promise<void>;
  onUpdateChapter: (chapterId: string, title: string) => Promise<void>;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onSaveQuestion: (input: { id?: string; chapter_id: string; question: string; answer: string }) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
};

const emptyForm = { id: "", chapter_id: "", question: "", answer: "" };

export function ManageView(props: Props) {
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const currentChapterId = form.chapter_id || props.chapters[0]?.id || "";
  const questionList = useMemo(() => {
    return props.questions.filter((question) => question.chapter_id === currentChapterId);
  }, [currentChapterId, props.questions]);

  async function run(action: () => Promise<void>, ok: string) {
    if (busy) return;

    try {
      setBusy(ok);
      setMessage("");
      await action();
      setMessage(ok);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy("");
    }
  }

  function editQuestion(question: Question) {
    setForm({
      id: question.id,
      chapter_id: question.chapter_id,
      question: question.question,
      answer: question.answer,
    });
  }

  return (
    <section className="manage-stack">
      <div className="panel">
        <h2>章节管理</h2>
        <div className="input-row">
          <input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} placeholder="新章节名称，例如 C语言篇" />
          <button className="primary-btn" disabled={busy === "章节已创建"} onClick={() => run(async () => {
            await props.onCreateChapter(chapterTitle);
            setChapterTitle("");
          }, "章节已创建")}>
            <Plus size={18} /> {busy === "章节已创建" ? "新增中" : "新增"}
          </button>
        </div>
        <div className="list-stack">
          {props.chapters.map((chapter) => (
            <div className="list-item" key={chapter.id}>
              <input
                value={editingChapter === chapter.id ? chapterTitle : chapter.title}
                readOnly={editingChapter !== chapter.id}
                onChange={(event) => setChapterTitle(event.target.value)}
              />
              {editingChapter === chapter.id ? (
                <button className="secondary-btn" disabled={busy === "章节已更新"} onClick={() => run(async () => {
                  await props.onUpdateChapter(chapter.id, chapterTitle);
                  setEditingChapter("");
                  setChapterTitle("");
                }, "章节已更新")}>{busy === "章节已更新" ? "保存中" : "保存"}</button>
              ) : (
                <button className="icon-btn" onClick={() => {
                  setEditingChapter(chapter.id);
                  setChapterTitle(chapter.title);
                }}><PenLine size={17} /></button>
              )}
              <button className="icon-btn danger" onClick={() => run(() => props.onDeleteChapter(chapter.id), "章节已删除")}>
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>{form.id ? "编辑题目" : "新增题目"}</h2>
        <label className="field-label">
          所属章节
          <select value={currentChapterId} onChange={(event) => setForm({ ...form, chapter_id: event.target.value })}>
            {props.chapters.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.title}</option>)}
          </select>
        </label>
        <label className="field-label">
          题干
          <textarea value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} rows={3} placeholder="输入题目" />
        </label>
        <label className="field-label">
          答案
          <textarea value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} rows={8} placeholder="支持 Markdown 和代码块" />
        </label>
        <div className="quiz-actions">
          <button className="primary-btn" disabled={busy === "题目已保存" || !currentChapterId || !form.question.trim() || !form.answer.trim()} onClick={() => run(async () => {
            await props.onSaveQuestion({
              id: form.id || undefined,
              chapter_id: currentChapterId,
              question: form.question,
              answer: form.answer,
            });
            setForm({ ...emptyForm, chapter_id: currentChapterId });
          }, "题目已保存")}>{busy === "题目已保存" ? "保存中" : "保存题目"}</button>
          <button className="secondary-btn" onClick={() => setForm({ ...emptyForm, chapter_id: currentChapterId })}>清空</button>
        </div>
        {message && <p className="toast-inline compact">{message}</p>}
      </div>

      <div className="panel">
        <h2>当前章节题目</h2>
        <div className="list-stack">
          {questionList.map((question, index) => (
            <div className="question-row" key={question.id}>
              <button onClick={() => editQuestion(question)}>Q{index + 1}. {question.question}</button>
              <button className="icon-btn danger" onClick={() => run(() => props.onDeleteQuestion(question.id), "题目已删除")}>
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!questionList.length && <p className="muted">这个章节还没有题目。</p>}
        </div>
      </div>
    </section>
  );
}
