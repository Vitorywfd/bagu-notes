import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PenLine, Plus, Trash2 } from "lucide-react";
import { getErrorMessage } from "../lib/errorMessage";
import type { Chapter, Question } from "../types";

type Props = {
  chapters: Chapter[];
  questions: Question[];
  activeQuestionId: string;
  onCreateChapter: (title: string) => Promise<void>;
  onUpdateChapter: (chapterId: string, title: string) => Promise<void>;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onSaveQuestion: (input: { id?: string; chapter_id: string; question: string; answer: string }) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onReorderChapters: (activeId: string, overId: string) => Promise<void>;
  onReorderQuestions: (chapterId: string, activeId: string, overId: string) => Promise<void>;
};

const emptyForm = { id: "", chapter_id: "", question: "", answer: "" };

function SortableRow({
  id,
  label,
  disabled,
  className,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  className: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} sortable-row${isDragging ? " is-dragging" : ""}`}>
      <button
        type="button"
        className="drag-handle"
        aria-label={label}
        title={label}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      {children}
    </div>
  );
}

export function ManageView(props: Props) {
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingChapter, setEditingChapter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [syncedActiveQuestionId, setSyncedActiveQuestionId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeQuestion = useMemo(() => {
    return props.questions.find((question) => question.id === props.activeQuestionId);
  }, [props.activeQuestionId, props.questions]);
  const currentChapterId = form.chapter_id || activeQuestion?.chapter_id || props.chapters[0]?.id || "";
  const questionList = useMemo(() => {
    return props.questions
      .filter((question) => question.chapter_id === currentChapterId)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  }, [currentChapterId, props.questions]);

  useEffect(() => {
    if (!activeQuestion || creatingQuestion || syncedActiveQuestionId === activeQuestion.id) return;

    setForm({
      id: activeQuestion.id,
      chapter_id: activeQuestion.chapter_id,
      question: activeQuestion.question,
      answer: activeQuestion.answer,
    });
    setSyncedActiveQuestionId(activeQuestion.id);
  }, [activeQuestion, creatingQuestion, syncedActiveQuestionId]);

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
    setCreatingQuestion(false);
    setSyncedActiveQuestionId(props.activeQuestionId);
    setForm({
      id: question.id,
      chapter_id: question.chapter_id,
      question: question.question,
      answer: question.answer,
    });
  }

  function startCreatingQuestion() {
    setCreatingQuestion(true);
    setSyncedActiveQuestionId(props.activeQuestionId);
    setForm({ ...emptyForm, chapter_id: currentChapterId });
  }

  function handleChapterDragEnd(event: DragEndEvent) {
    if (busy || !event.over || event.active.id === event.over.id) return;
    void run(() => props.onReorderChapters(String(event.active.id), String(event.over?.id)), "章节顺序已保存");
  }

  function handleQuestionDragEnd(event: DragEndEvent) {
    if (busy || !event.over || event.active.id === event.over.id || !currentChapterId) return;
    void run(
      () => props.onReorderQuestions(currentChapterId, String(event.active.id), String(event.over?.id)),
      "题目顺序已保存",
    );
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
          <SortableContext items={props.chapters.map((chapter) => chapter.id)} strategy={verticalListSortingStrategy}>
            <div className="list-stack">
              {props.chapters.map((chapter) => (
                <SortableRow key={chapter.id} id={chapter.id} label="拖动排序章节" disabled={Boolean(busy)} className="list-item">
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
                    <button className="icon-btn" title="编辑章节" onClick={() => {
                      setEditingChapter(chapter.id);
                      setChapterTitle(chapter.title);
                    }}><PenLine size={17} /></button>
                  )}
                  <button className="icon-btn danger" title="删除章节" onClick={() => run(() => props.onDeleteChapter(chapter.id), "章节已删除")}>
                    <Trash2 size={17} />
                  </button>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
            if (!form.id) setForm({ ...emptyForm, chapter_id: currentChapterId });
          }, "题目已保存")}>{busy === "题目已保存" ? "保存中" : "保存题目"}</button>
          <button className="secondary-btn" onClick={startCreatingQuestion}>新增题目</button>
        </div>
        {message && <p className="toast-inline compact">{message}</p>}
      </div>

      <div className="panel">
        <h2>当前章节题目</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
          <SortableContext items={questionList.map((question) => question.id)} strategy={verticalListSortingStrategy}>
            <div className="list-stack">
              {questionList.map((question, index) => (
                <SortableRow key={question.id} id={question.id} label="拖动排序题目" disabled={Boolean(busy)} className="question-row">
                  <button className="question-edit-btn" onClick={() => editQuestion(question)}>Q{index + 1}. {question.question}</button>
                  <button className="icon-btn danger" title="删除题目" onClick={() => run(() => props.onDeleteQuestion(question.id), "题目已删除")}>
                    <Trash2 size={17} />
                  </button>
                </SortableRow>
              ))}
              {!questionList.length && <p className="muted">这个章节还没有题目。</p>}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
