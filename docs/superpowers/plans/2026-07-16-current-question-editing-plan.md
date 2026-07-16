# 当前刷题编辑联动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理页默认编辑刷题页当前题目，并通过“新增题目”显式切换到创建模式。

**Architecture:** `AppShell` 保存刷题页上报的当前题目 ID，并把它传给 `ManageView`。`QuizView` 在可见题目变化时上报 ID；`ManageView` 在非新建模式下将共享 ID 映射为表单内容。保存继续调用现有题库 hook。

**Tech Stack:** React 19、TypeScript、Vitest、Testing Library。

## Global Constraints

- 不修改 Supabase 表、RLS 或现有保存接口。
- “新增题目”是唯一清空编辑表单并进入创建模式的按钮。
- 管理页在共享题目有效时默认编辑该题目。

---

### Task 1: 管理页的当前题目编辑状态

**Files:**
- Modify: `src/components/ManageView.tsx`
- Create: `src/components/ManageView.test.tsx`

**Interfaces:**
- Consumes: `activeQuestionId: string` 和现有 `Question[]`。
- Produces: `ManageView` 的 `onSaveQuestion` 调用包含当前题目 `id`，或在新增模式中省略 `id`。

- [ ] **Step 1: 写失败测试**

```tsx
render(<ManageView activeQuestionId="question-5" {...props} />);
expect(screen.getByRole("heading", { name: "编辑题目" })).toBeInTheDocument();
expect(screen.getByDisplayValue("第五题")).toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "新增题目" }));
expect(screen.getByRole("heading", { name: "新增题目" })).toBeInTheDocument();
expect(screen.getByPlaceholderText("输入题目")).toHaveValue("");
```

- [ ] **Step 2: 运行失败测试**

运行：`npm test -- src/components/ManageView.test.tsx`

预期：FAIL，因为 `ManageView` 尚未接收 `activeQuestionId`，且没有“新增题目”状态切换。

- [ ] **Step 3: 实现最小功能**

```tsx
type Props = { activeQuestionId: string; /* existing props */ };
const activeQuestion = props.questions.find((question) => question.id === props.activeQuestionId);
const [creatingQuestion, setCreatingQuestion] = useState(false);

function startCreatingQuestion() {
  setCreatingQuestion(true);
  setForm({ ...emptyForm, chapter_id: currentChapterId });
}
```

当 `activeQuestion` 有效且 `creatingQuestion` 为 `false` 时，把表单同步成该题目；保存后不重置成空表单。按钮文本使用“新增题目”。

- [ ] **Step 4: 运行测试确认通过**

运行：`npm test -- src/components/ManageView.test.tsx`

预期：PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/components/ManageView.tsx src/components/ManageView.test.tsx
git commit -m "Edit current quiz question from manage view"
```

### Task 2: 从刷题页传递当前题目

**Files:**
- Modify: `src/components/QuizView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/QuizView.test.tsx`

**Interfaces:**
- Consumes: `QuizView` 当前计算出的 `currentQuestion`。
- Produces: `onCurrentQuestionChange(questionId: string)` 回调，并由 `AppShell` 传入管理页的 `activeQuestionId`。

- [ ] **Step 1: 写失败测试**

```tsx
const onCurrentQuestionChange = vi.fn();
render(<QuizView {...props} onCurrentQuestionChange={onCurrentQuestionChange} />);
expect(onCurrentQuestionChange).toHaveBeenCalledWith("question-1");
```

- [ ] **Step 2: 运行失败测试**

运行：`npm test -- src/components/QuizView.test.tsx`

预期：FAIL，因为 `QuizView` 尚未提供该回调。

- [ ] **Step 3: 实现最小功能**

```tsx
useEffect(() => {
  if (currentQuestion) props.onCurrentQuestionChange(currentQuestion.id);
}, [currentQuestion?.id, props]);
```

在 `AppShell` 创建 `activeQuestionId` 状态，传给 `QuizView` 与 `ManageView`。

- [ ] **Step 4: 运行测试确认通过**

运行：`npm test -- src/components/QuizView.test.tsx`

预期：PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/App.tsx src/components/QuizView.tsx src/components/QuizView.test.tsx
git commit -m "Share active quiz question with management"
```

### Task 3: 整体验证与生产部署

**Files:**
- Verify: `src/components/ManageView.test.tsx`
- Verify: `src/components/QuizView.test.tsx`

- [ ] **Step 1: 运行完整验证**

运行：`npm test; npm run build; npm run deploy:check`

预期：所有测试通过，TypeScript 构建成功，部署前自检通过。

- [ ] **Step 2: 部署生产环境**

运行：`npx vercel@latest --prod --yes`

预期：Vercel 返回 Ready 的生产部署 URL。

- [ ] **Step 3: 线上连通性检查**

运行：`Invoke-WebRequest https://bagu-notes.vercel.app/ -UseBasicParsing`

预期：HTTP 200。
