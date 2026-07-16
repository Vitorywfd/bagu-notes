import { BookOpen, Database, LibraryBig, LogOut, RefreshCcw, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AuthGate } from "./components/AuthGate";
import { ImportExportView } from "./components/ImportExportView";
import { ManageView } from "./components/ManageView";
import { PublicBankView } from "./components/PublicBankView";
import { QuizView } from "./components/QuizView";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import { useDemoQuestionBank } from "./hooks/useDemoQuestionBank";
import { useQuestionBank } from "./hooks/useQuestionBank";
import { getLatestProgressQuestionId } from "./lib/progress";
import type { AppTab } from "./types";

function App() {
  if (!hasSupabaseConfig) return <DemoApp />;
  return <CloudApp />;
}

function CloudApp() {
  const { user, loading: authLoading } = useAuth();
  const bank = useQuestionBank(user);

  if (authLoading) {
    return <main className="auth-screen"><section className="auth-card">正在恢复登录状态...</section></main>;
  }

  if (!user) return <AuthGate />;

  return <AppShell bank={bank} modeMessage={bank.message} currentUserId={user.id} />;
}

function DemoApp() {
  const bank = useDemoQuestionBank();
  return <AppShell bank={bank} modeMessage={bank.message} currentUserId="demo-user" />;
}

type BankFacade = ReturnType<typeof useQuestionBank> | ReturnType<typeof useDemoQuestionBank>;

function AppShell({ bank, modeMessage, currentUserId }: { bank: BankFacade; modeMessage: string; currentUserId?: string }) {
  const [tab, setTab] = useState<AppTab>("quiz");
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const viewedCount = useMemo(() => {
    return bank.progress.filter((item) => item.viewed_count > 0).length;
  }, [bank.progress]);
  const latestProgressQuestionId = useMemo(() => {
    return getLatestProgressQuestionId(bank.progress, bank.questions);
  }, [bank.progress, bank.questions]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand">八股随记</div>
          <p>个人刷题库</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="刷新" onClick={bank.refresh}><RefreshCcw size={18} /></button>
          {hasSupabaseConfig && <button className="icon-btn" title="退出登录" onClick={() => supabase?.auth.signOut()}><LogOut size={18} /></button>}
        </div>
      </header>

      {modeMessage && <p className={hasSupabaseConfig ? "error-banner" : "info-banner"}>{modeMessage}</p>}

      {tab === "quiz" && (
        <QuizView
          chapters={bank.chapters}
          questions={bank.questions}
          favoriteIds={bank.favoriteIds}
          viewedCount={viewedCount}
          resumeQuestionId={latestProgressQuestionId}
          loading={bank.loading}
          onToggleFavorite={bank.toggleFavorite}
          onRecordView={bank.recordView}
          onCurrentQuestionChange={setActiveQuestionId}
        />
      )}
      {tab === "manage" && (
        <ManageView
          chapters={bank.chapters}
          questions={bank.questions}
          activeQuestionId={activeQuestionId}
          onCreateChapter={bank.createChapter}
          onUpdateChapter={bank.updateChapter}
          onDeleteChapter={bank.deleteChapter}
          onSaveQuestion={bank.upsertQuestion}
          onDeleteQuestion={bank.deleteQuestion}
        />
      )}
      {tab === "import" && (
        <ImportExportView chapters={bank.chapters} questions={bank.questions} onImport={bank.importBank} />
      )}
      {tab === "public" && (
        <PublicBankView
          chapters={bank.chapters}
          questions={bank.questions}
          publicQuestions={bank.publicQuestions}
          currentUserId={currentUserId}
          onPublishQuestion={bank.publishQuestion}
          onAddToMine={bank.addPublicQuestionToMine}
          onDeletePublicQuestion={bank.deletePublicQuestion}
        />
      )}

      <nav className="bottom-nav" aria-label="主导航">
        <button className={tab === "quiz" ? "active" : ""} onClick={() => setTab("quiz")}>
          <BookOpen size={20} /> 刷题
        </button>
        <button className={tab === "manage" ? "active" : ""} onClick={() => setTab("manage")}>
          <LibraryBig size={20} /> 管理
        </button>
        <button className={tab === "public" ? "active" : ""} onClick={() => setTab("public")}>
          <UsersRound size={20} /> 公共题库
        </button>
        <button className={tab === "import" ? "active" : ""} onClick={() => setTab("import")}>
          <Database size={20} /> 导入导出
        </button>
      </nav>
    </main>
  );
}

export default App;
