import { useState } from "react";
import { LogIn } from "lucide-react";
import { getAuthErrorMessage, signInWithPassword, signUpWithPassword } from "../lib/authApi";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

export function AuthGate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signin") {
        await signInWithPassword({ username, password });
      } else {
        await signUpWithPassword({ username, password });
      }

      setMessage(mode === "signin" ? "登录成功" : "注册成功，可以开始使用。");
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <main className="auth-screen">
        <section className="setup-card">
          <h1>八股随记</h1>
          <p>缺少 Supabase 环境变量，应用没有白屏，但需要配置后才能登录和同步题库。</p>
          <pre>{`VITE_SUPABASE_URL=你的 Project URL\nVITE_SUPABASE_ANON_KEY=你的 anon key`}</pre>
          <p className="muted">复制 `.env.example` 为 `.env.local`，填入配置后重新启动开发服务器。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand-mark"><LogIn size={22} /> 八股随记</div>
        <h1>登录后开始刷题</h1>
        <p>题库、收藏和学习进度会同步到云端，手机随时打开就能继续。</p>
        <label>
          用户名
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            autoComplete="username"
            placeholder="自定义用户名"
          />
        </label>
        <label>
          密码
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="至少 6 位"
          />
        </label>
        <button className="primary-btn" disabled={busy || !username.trim() || !password} onClick={submit}>
          {busy ? "处理中..." : mode === "signin" ? "登录" : "注册"}
        </button>
        <button className="text-btn" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "还没有账号？注册" : "已有账号？登录"}
        </button>
        {message && <p className="form-message">{message}</p>}
      </section>
    </main>
  );
}
