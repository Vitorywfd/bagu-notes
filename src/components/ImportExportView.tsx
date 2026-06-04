import { useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportQuestionBank } from "../lib/importExport";
import { sampleBankJson } from "../data/sampleBank";
import type { Chapter, Question } from "../types";

type Props = {
  chapters: Chapter[];
  questions: Question[];
  onImport: (rawJson: string) => Promise<void>;
};

export function ImportExportView(props: Props) {
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");
  const exported = useMemo(() => exportQuestionBank(props.chapters, props.questions), [props.chapters, props.questions]);

  async function importRaw(value: string) {
    try {
      setMessage("");
      await props.onImport(value);
      setRaw("");
      setMessage("导入完成");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    }
  }

  async function copyExport() {
    await navigator.clipboard.writeText(exported);
    setMessage("已复制当前题库 JSON");
  }

  return (
    <section className="manage-stack">
      <div className="panel">
        <h2>导入题库</h2>
        <p className="muted">粘贴 JSON 后导入。建议先导出备份，再进行批量导入。</p>
        <textarea value={raw} onChange={(event) => setRaw(event.target.value)} rows={10} placeholder="粘贴题库 JSON" />
        <div className="quiz-actions">
          <button className="primary-btn" disabled={!raw.trim()} onClick={() => importRaw(raw)}>
            <Upload size={18} /> 导入
          </button>
          <button className="secondary-btn" onClick={() => setRaw(sampleBankJson)}>填入示例题库</button>
        </div>
      </div>

      <div className="panel">
        <h2>导出题库</h2>
        <p className="muted">当前共 {props.chapters.length} 个章节、{props.questions.length} 道题。</p>
        <textarea value={exported} readOnly rows={10} />
        <button className="primary-btn" onClick={copyExport}>
          <Download size={18} /> 复制导出 JSON
        </button>
      </div>
      {message && <p className="toast-inline">{message}</p>}
    </section>
  );
}
