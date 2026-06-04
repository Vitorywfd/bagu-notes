# 八股随记

手机优先的个人八股刷题网站，支持 Supabase 登录、云端题库同步、收藏、进度、题库管理和 JSON 导入导出。

## 本地运行

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量：

```bash
copy .env.example .env.local
```

3. 在 Supabase 控制台创建项目，把 Project URL 和 Publishable key 填入 `.env.local`。

4. 在 Supabase SQL Editor 执行 `supabase/migrations/001_initial_schema.sql`。

5. 启动：

```bash
npm run dev
```

如果暂时没有配置 Supabase，页面会自动进入本地预览模式。预览模式内置少量示例题，可以试用刷题、收藏、管理和导入导出；这些数据只用于当前浏览器会话，不会云端同步。

## 部署前自检

配置 `.env.local` 后执行：

```bash
npm run deploy:check
npm test
npm run build
```

`deploy:check` 会检查：

- Supabase URL 和 anon key 是否已配置；
- 是否误把 `service_role` key 写入前端环境变量；
- Supabase SQL 是否包含 RLS、`auth.uid()`、授权和章节唯一约束；
- PWA、Vercel、Supabase 迁移文件是否存在。

## 部署到 Vercel

1. 把项目推到 GitHub。
2. 在 Vercel 导入该仓库。
3. 在 Vercel Project Settings -> Environment Variables 添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 部署后用手机打开 Vercel 提供的网址。
5. 手机浏览器菜单选择“添加到主屏幕”，即可像 App 一样启动。

## 让 Codex 接入 Vercel / Supabase MCP

项目已包含 `.mcp.json`：

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com"
    }
  }
}
```

如果当前 Codex 会话仍看不到 Vercel/Supabase 工具，需要重启或刷新会话后触发 MCP 认证。Supabase 官方 MCP 文档说明远程地址是 `https://mcp.supabase.com/mcp`，首次使用会通过浏览器授权；Vercel 官方文档说明 Codex 可用 `codex mcp add vercel --url https://mcp.vercel.com` 添加远程 MCP。

如果 MCP 仍不可用，可以走 CLI：

```bash
npx vercel login
npx vercel
```

生产部署：

```bash
npx vercel --prod
```

Supabase 远程建表最稳的方式是在 Supabase 控制台 SQL Editor 执行：

```text
supabase/migrations/001_initial_schema.sql
```

执行成功后，可以再执行：

```text
supabase/verify_schema.sql
```

如果看到 `chapters`、`questions`、`favorites`、`study_progress` 四张表，并且 `row_security` 为 true，同时能看到各表策略，说明数据库结构和 RLS 已生效。

如果 SQL Editor 显示 `Error: Failed to fetch (api.supabase.com)`，这通常不是 SQL 写错，而是 Supabase 控制台网页请求管理 API 失败。处理顺序：

1. 刷新 Supabase 控制台页面后重新粘贴执行。
2. 确认当前浏览器能访问 `https://api.supabase.com`。
3. 换网络或代理节点后重试。
4. 如果网页控制台一直失败，改用 Supabase MCP 或 CLI 执行迁移。

## Supabase 环境变量在哪里找

`VITE_SUPABASE_URL`：

- `Project Settings -> General -> Project ID` 可推导 URL；
- 例如项目识别是 `fjmppvnxjuqkonrcgpkb`，URL 就是：

```text
https://fjmppvnxjuqkonrcgpkb.supabase.co
```

`VITE_SUPABASE_ANON_KEY`：

- 进入 `Project Settings -> API`；
- 在新界面里复制 `Publishable key -> default`，通常以 `sb_publishable_` 开头；
- 旧界面里对应的是 `anon public` / `anon key`；
- 不要复制 `Secret keys`、`service_role` 或任何 server/secret key，它们是服务端高权限密钥，不能放进前端。

## 题库导入格式

```json
{
  "version": 1,
  "exportedAt": "2026-05-27T00:00:00.000Z",
  "chapters": [
    { "title": "C语言篇", "sort_order": 1 }
  ],
  "questions": [
    {
      "chapterTitle": "C语言篇",
      "question": "sizeof 和 strlen 的区别是什么？",
      "answer": "sizeof 是操作符，strlen 是库函数。",
      "sort_order": 1
    }
  ]
}
```

## 验证

```bash
npm test
npm run build
```
