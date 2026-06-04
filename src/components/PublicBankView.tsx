import { Download, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errorMessage";
import { renderAnswerMarkdown } from "../lib/markdown";
import type { Chapter, PublicQuestion, Question } from "../types";

type Props = {
  chapters: Chapter[];
  questions: Question[];
  publicQuestions: PublicQuestion[];
  currentUserId?: string;
  onPublishQuestion: (questionId: string) => Promise<void>;
  onAddToMine: (publicQuestionId: string) => Promise<void>;
  onDeletePublicQuestion: (publicQuestionId: string) => Promise<void>;
};

export function PublicBankView(props: Props) {
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [openQuestionId, setOpenQuestionId] = useState("");
  const [message, setMessage] = useState("");
  const ownPublicIds = useMemo(() => {
    return new Set(props.publicQuestions.filter((item) => item.owner_id === props.currentUserId).map((item) => item.id));
  }, [props.currentUserId, props.publicQuestions]);

  const publishOptions = useMemo(() => {
    const chapterById = new Map(props.chapters.map((chapter) => [chapter.id, chapter.title]));
    return props.questions.map((question) => ({
      id: question.id,
      label: `${chapterById.get(question.chapter_id) || "未分组"} / ${question.question}`,
    }));
  }, [props.chapters, props.questions]);

  async function run(action: () => Promise<void>, ok: string) {
    try {
      setMessage("");
      await action();
      setMessage(ok);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <section className="public-stack">
      <div className="panel">
        <h2>发布到公共题库</h2>
        <p className="muted">选择你个人题库里的一道题，发布后其他账号也能复制使用。</p>
        <div className="input-row public-publish-row">
          <select value={selectedQuestionId} onChange={(event) => setSelectedQuestionId(event.target.value)}>
            <option value="">选择要发布的题目</option>
            {publishOptions.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
          <button
            className="primary-btn"
            disabled={!selectedQuestionId}
            onClick={() => run(() => props.onPublishQuestion(selectedQuestionId), "已发布到公共题库")}
          >
            <Send size={17} /> 发布
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>公共题库</h2>
        <div className="public-list">
          {props.publicQuestions.map((item) => {
            const isOpen = openQuestionId === item.id;
            const isMine = ownPublicIds.has(item.id);
            return (
              <article className="public-question" key={item.id}>
                <button className="public-question-title" onClick={() => setOpenQuestionId(isOpen ? "" : item.id)}>
                  <span>{item.chapter_title}</span>
                  <strong>{item.question}</strong>
                </button>
                {isOpen && <div className="answer-box" dangerouslySetInnerHTML={{ __html: renderAnswerMarkdown(item.answer) }} />}
                <div className="public-actions">
                  <button className="secondary-btn" onClick={() => run(() => props.onAddToMine(item.id), "已加入个人题库")}>
                    <Download size={17} /> 加入我的题库
                  </button>
                  {isMine && (
                    <button className="icon-btn danger" title="删除我的公共题" onClick={() => run(() => props.onDeletePublicQuestion(item.id), "公共题已删除")}>
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {!props.publicQuestions.length && <p className="muted">公共题库还没有题目。你可以先发布一道自己的题。</p>}
        </div>
      </div>
      {message && <p className="toast-inline">{message}</p>}
    </section>
  );
}
