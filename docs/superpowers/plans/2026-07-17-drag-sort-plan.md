# 拖拽排序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理页通过手机和电脑均可用的拖拽操作重排章节与题目，并把结果同步到题库。

**Architecture:** 使用 `dnd-kit` 渲染带拖动手柄的排序列表。纯函数负责根据 ID 列表生成连续的 `sort_order` 和章节标题编号；云端 hook 与本地预览 store 分别保存这些变更，管理页只发出排序后的 ID 列表。

**Tech Stack:** React 19、TypeScript、dnd-kit、Supabase REST、Vitest、Testing Library。

## Global Constraints

- 不修改 Supabase 表结构、RLS 或登录逻辑。
- 新增章节和题目仍排在各自列表最后。
- 只在拖放结束时写入排序结果。
- 拖拽必须支持鼠标和触摸；题目只在当前章节内排序。

---

### Task 1: 排序数据逻辑

**Files:**
- Create: `src/lib/reorder.ts`
- Create: `src/lib/reorder.test.ts`

**Interfaces:**
- Produces: `reorderById(items, activeId, overId)` 和 `renumberChapterTitles(chapters)`。

- [ ] **Step 1: 写失败测试**

```ts
expect(reorderById(chapters, "chapter-1", "chapter-3").map((item) => item.id))
  .toEqual(["chapter-2", "chapter-3", "chapter-1"]);
expect(renumberChapterTitles(chapters).map((chapter) => chapter.title))
  .toEqual(["1. MCU篇", "2. C语言篇", "3. 操作系统篇"]);
```

- [ ] **Step 2: 运行失败测试**

运行：`npm test -- src/lib/reorder.test.ts`

预期：FAIL，因为排序模块尚不存在。

- [ ] **Step 3: 实现最小逻辑**

```ts
export function reorderById<T extends { id: string }>(items: T[], activeId: string, overId: string): T[] {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
```

为每一项重写连续 `sort_order`；章节标题仅匹配数字前缀时重编号。

- [ ] **Step 4: 运行测试确认通过**

运行：`npm test -- src/lib/reorder.test.ts`

预期：PASS。

### Task 2: 题库排序持久化

**Files:**
- Modify: `src/hooks/useQuestionBank.ts`
- Modify: `src/hooks/useDemoQuestionBank.ts`
- Modify: `src/lib/demoBank.ts`
- Modify: `src/lib/demoBank.test.ts`

**Interfaces:**
- Produces: `reorderChapters(activeId, overId)` 和 `reorderQuestions(chapterId, activeId, overId)`。

- [ ] **Step 1: 写失败测试**

```ts
store.reorderQuestions("chapter-1", "question-1", "question-3");
expect(store.getState().questions.filter((item) => item.chapter_id === "chapter-1").map((item) => item.sort_order))
  .toEqual([1, 2, 3]);
```

- [ ] **Step 2: 运行失败测试**

运行：`npm test -- src/lib/demoBank.test.ts`

预期：FAIL，因为本地预览题库还没有排序接口。

- [ ] **Step 3: 实现保存**

```ts
await Promise.all(items.map((item) => supabaseRest<Question[]>(
  `/rest/v1/questions?id=eq.${encodeURIComponent(item.id)}`,
  { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: item.sort_order }) },
)));
```

云端失败时调用 `refresh()`；本地预览模式以相同排序结果更新 store。

- [ ] **Step 4: 运行测试确认通过**

运行：`npm test -- src/lib/demoBank.test.ts`

预期：PASS。

### Task 3: 管理页拖动界面

**Files:**
- Modify: `package.json`
- Modify: `src/components/ManageView.tsx`
- Modify: `src/components/ManageView.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `onReorderChapters(activeId, overId)` 与 `onReorderQuestions(chapterId, activeId, overId)`。

- [ ] **Step 1: 写失败测试**

```tsx
render(<ManageView {...props} />);
expect(screen.getAllByLabelText("拖动排序章节")).toHaveLength(3);
expect(screen.getAllByLabelText("拖动排序题目")).toHaveLength(3);
```

- [ ] **Step 2: 运行失败测试**

运行：`npm test -- src/components/ManageView.test.tsx`

预期：FAIL，因为拖动手柄和排序回调不存在。

- [ ] **Step 3: 实现拖放**

```tsx
<DndContext sensors={sensors} onDragEnd={handleChapterDragEnd}>
  <SortableContext items={props.chapters.map((chapter) => chapter.id)} strategy={verticalListSortingStrategy}>
    {props.chapters.map((chapter) => <SortableChapterItem key={chapter.id} chapter={chapter} />)}
  </SortableContext>
</DndContext>
```

把拖动监听器只挂在手柄按钮，保留编辑和删除按钮的原有行为；拖动时显示半透明占位和投影反馈。

- [ ] **Step 4: 运行测试确认通过**

运行：`npm test -- src/components/ManageView.test.tsx`

预期：PASS。

### Task 4: 全量验证与部署

**Files:**
- Verify: `src/lib/reorder.test.ts`
- Verify: `src/lib/demoBank.test.ts`
- Verify: `src/components/ManageView.test.tsx`

- [ ] **Step 1: 全量验证**

运行：`npm test`、`npm run build`、`npm run deploy:check`

预期：全部通过。

- [ ] **Step 2: 发布生产环境**

运行：`npx vercel@latest --prod --yes`

预期：生产部署状态为 Ready，并别名到 `https://bagu-notes.vercel.app`。
