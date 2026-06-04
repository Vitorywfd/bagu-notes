import { describe, expect, it } from "vitest";
import { checkDeploymentReadiness } from "./deployCheck.js";

const validSql = `
alter table public.chapters enable row level security;
select auth.uid();
grant select, insert, update, delete on public.chapters to authenticated;
unique (user_id, title);
unique (user_id, chapter_id, question);
foreign key (chapter_id, user_id) references public.chapters(id, user_id);
foreign key (question_id, user_id) references public.questions(id, user_id);
`;

describe("checkDeploymentReadiness", () => {
  it("accepts Supabase env from process-like environment", () => {
    const result = checkDeploymentReadiness({
      files: new Set(["package.json", "vercel.json", ".env.example", "supabase/migrations/001_initial_schema.sql", "public/manifest.webmanifest", "public/sw.js"]),
      envText: "",
      processEnv: {
        VITE_SUPABASE_URL: "https://demo.supabase.co",
        VITE_SUPABASE_ANON_KEY: "public-anon-key",
      },
      sqlText: validSql,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects service role keys in frontend env", () => {
    const result = checkDeploymentReadiness({
      files: new Set(["package.json", "vercel.json", ".env.example", "supabase/migrations/001_initial_schema.sql", "public/manifest.webmanifest", "public/sw.js"]),
      envText: "VITE_SUPABASE_URL=https://demo.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=secret",
      processEnv: { VITE_SUPABASE_ANON_KEY: "public-anon-key" },
      sqlText: validSql,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("service_role");
  });

  it("rejects new Supabase secret keys in frontend env", () => {
    const result = checkDeploymentReadiness({
      files: new Set(["package.json", "vercel.json", ".env.example", "supabase/migrations/001_initial_schema.sql", "public/manifest.webmanifest", "public/sw.js"]),
      envText: "VITE_SUPABASE_URL=https://demo.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_secret_this_is_wrong",
      processEnv: {},
      sqlText: validSql,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Publishable key");
  });
});
