---
inclusion: always
---

# 安全与隐私边界

## 元数据规则

`data/cemetery.json` 使用严格的 v2 白名单，不允许任何额外字段：

- 顶层字段仅限：`version`、`mode`、`activeId`、`updatedAt`、`assessment`、`graves`。
- `assessment` 可以为 `null`；否则字段仅限：`id`、`agentId`、`targetPath`、`assessedAt`、`tracked`、`workspaceClean`、`baselinePassed`、`dependentCount`、`risk`。
- 每条墓碑字段仅限：`id`、`filePath`、`fileName`、`deletedAt`、`ageDays`、`commitCount`、`lineCount`、`state`、`cause`、`test`。
- `test` 可以为 `null`；否则字段仅限：`passed`、`failed`、`durationMs`。

`assessment` 只保存固定 Agent/目标、布尔事实、依赖数量和派生风险，不保存依赖路径、命令输出、授权文本或自由推理。墓园数据不得持久化或渲染：

- 源码或源码片段；
- Hook 原始标准输入；
- 环境变量、访问令牌或账号信息；
- `C:\Users\...` 等绝对用户路径；
- Git 远端凭据或私人仓库地址。

即使为了计算行数临时读取 Git 中的删除前内容，也必须在内存中使用后立即丢弃。

## 删除边界

- 只有用户批准的 Spec 任务可以让 Kiro 删除文件。
- 首次演示只允许删除 `demo-src/legacy-ghost.mjs`。
- Undertaker 脚本永远不主动删除、恢复或覆盖源码。
- 拒绝绝对路径、`..`、符号链接逃逸、`demo-src` 外路径和非 `.mjs` 文件。
- 不使用 `git reset --hard`、`git clean` 或宽泛恢复命令准备演示；需要重录时使用干净副本或明确确认的文件级恢复。

## 执行边界

- 将 Hook 事件、Git 输出和 JSON 文件都视为不可信输入并验证。
- 子进程不通过拼接字符串执行用户可控内容。
- 不联网、不上传、不调用付费 API。
- 线上页面必须标注“回放模式”；只有本地 Kiro IDE/CLI 产生的链路可称为现场模式。
- 如果 Hook 没有触发，要如实记录并使用文档化降级方案，不能伪造成功日志。
