export const requiredDeployFiles = [
  "package.json",
  "vercel.json",
  ".env.example",
  "supabase/migrations/001_initial_schema.sql",
  "public/manifest.webmanifest",
  "public/sw.js",
];

function parseEnvText(envText) {
  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

export function checkDeploymentReadiness(input) {
  const missingFiles = requiredDeployFiles.filter((file) => !input.files.has(file));
  if (missingFiles.length) {
    return {
      ok: false,
      message: `缺少部署必需文件：\n${missingFiles.map((file) => `- ${file}`).join("\n")}`,
    };
  }

  const env = { ...input.processEnv, ...parseEnvText(input.envText) };
  const missingEnv = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"].filter(
    (key) => !env[key] || String(env[key]).includes("your-"),
  );
  if (missingEnv.length) {
    return {
      ok: false,
      message: `Supabase 环境变量未配置完整：${missingEnv.join(", ")}`,
    };
  }

  if (Object.keys(env).some((key) => key.toLowerCase().includes("service_role"))) {
    return {
      ok: false,
      message: "不要把 Supabase service_role key 写入前端环境变量。",
    };
  }

  if (String(env.VITE_SUPABASE_ANON_KEY).startsWith("sb_secret_")) {
    return {
      ok: false,
      message: "VITE_SUPABASE_ANON_KEY 必须使用 Publishable key，不能使用 Secret key。",
    };
  }

  const sqlText = input.sqlText.toLowerCase();
  const requiredSqlSnippets = [
    "enable row level security",
    "auth.uid()",
    "grant select, insert, update, delete",
    "unique (user_id, title)",
    "unique (user_id, chapter_id, question)",
    "foreign key (chapter_id, user_id) references public.chapters(id, user_id)",
    "foreign key (question_id, user_id) references public.questions(id, user_id)",
  ];
  const missingSql = requiredSqlSnippets.filter((snippet) => !sqlText.includes(snippet));
  if (missingSql.length) {
    return {
      ok: false,
      message: `Supabase SQL 缺少关键片段：${missingSql.join(", ")}`,
    };
  }

  return {
    ok: true,
    message: "部署前自检通过。下一步可执行 npm run build，并在 Vercel 配置相同环境变量。",
  };
}
