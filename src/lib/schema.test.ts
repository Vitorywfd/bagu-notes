import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/001_initial_schema.sql", "utf8").toLowerCase();

describe("supabase schema security", () => {
  it("ties child rows to the same owner through composite foreign keys", () => {
    expect(sql).toContain("unique (id, user_id)");
    expect(sql).toContain("foreign key (chapter_id, user_id) references public.chapters(id, user_id)");
    expect(sql).toContain("foreign key (question_id, user_id) references public.questions(id, user_id)");
  });

  it("prevents duplicate question imports per user and chapter", () => {
    expect(sql).toContain("unique (user_id, chapter_id, question)");
  });
});
