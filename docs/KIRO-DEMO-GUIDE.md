# Kiro 现场演示与录屏指南

这份指南用于完成真正的 Kiro 操作证据。不要先手工制造最终 JSON；评委需要看到状态由 Kiro、Git 和测试共同产生。

## 1. 录制前准备

1. 使用项目的干净副本。确认 `demo-src/legacy-ghost.mjs` 已被 Git 跟踪，且没有需要保留的未提交改动。
2. 在项目根目录运行：

   ```powershell
   git status --short
   npm test
   npm run validate
   npm run dev
   ```

3. 保持本地墓园页面打开；另开 Kiro IDE 打开同一个项目根目录。
4. 在 Kiro 面板依次展示：
   - `code-funeral-hall` Feature Spec；
   - `code-undertaker` Workspace Skill；
   - 已启用的 `PostFileDelete` 和 `PostTaskExec` Hooks。
5. 如果基线测试不通过或 Git 状态包含不明改动，先停止录制并排查；不要用宽泛 Git 命令清理工作区。

## 2. 让 Kiro 执行葬礼

在 Kiro 聊天中调用 Skill 并指定 Spec：

```text
/code-undertaker 请使用 #spec:code-funeral-hall 执行任务 6.1。先检查调用者和 Git 状态，只删除 demo-src/legacy-ghost.mjs；不要修改 active-consumer.mjs，也不要提前修复测试。
```

在授权删除前，核对 Kiro 显示的目标路径只有这一项。删除必须由 Kiro Agent 完成；手工删除不会证明 `PostFileDelete` 被使用。

预期现场顺序：

1. `PostFileDelete` 自动执行 `node scripts/undertaker.mjs bury`。
2. `data/cemetery.json` 出现 `legacy-ghost.mjs` 的墓碑，初始状态为 `pending`。
3. 本地页面无需手工刷新即可出现等待裁定的墓碑。
4. Spec 删除任务结束后，`PostTaskExec` 自动执行 `node scripts/undertaker.mjs settle`。
5. `active-consumer.mjs` 的旧 import 导致健康测试失败，墓碑进入 `resurrected`，页面出现幽灵和红色状态反馈。

此时暂停并拍清楚失败摘要。不要把旧文件恢复回来；诈尸正是下一阶段的输入。

## 3. 用 Bugfix Spec 安葬幽灵

在 Kiro 中发起一个新的 Bugfix Spec，使用下面的描述：

```text
删除 demo-src/legacy-ghost.mjs 后，demo-src/active-consumer.mjs 仍导入该模块，导致项目健康测试失败。预期 memorialMessage('旧接口') 仍返回 '旧接口 已归档'。不得恢复 legacy-ghost.mjs，不得改变该公开行为，也不得修改墓园 JSON 来伪造通过。请生成并执行最小 Bugfix Spec。
```

录制 Kiro 生成的当前行为、预期行为和保持不变行为，确认后再让 Kiro执行修复任务。修复应聚焦消费者，不新增依赖。

Bugfix 任务完成时，`PostTaskExec` 会再次裁定。预期结果：

- 健康测试通过；
- 同一块墓碑从 `resurrected` 转为 `resting`，没有重复墓碑；
- 页面显示白花/安息反馈；
- `legacy-ghost.mjs` 仍然不存在；
- `memorialMessage('旧接口')` 的输出没有变化。

最后运行：

```powershell
npm test
npm run validate
npm run build
git diff --stat
```

## 4. 元数据隐私核对

公开或录屏前查看 `data/cemetery.json`，确认它只包含：相对路径、文件名、行数、年龄、提交次数、时间、程序内置死因、状态和测试摘要。

以下任何内容出现都应停止发布：

- `legacy-ghost.mjs` 的源码文本；
- Hook 的完整标准输入；
- 用户名或 `C:\Users\...` 绝对路径；
- Token、Cookie、邮箱、Git 远端凭据；
- 私人仓库 URL。

终端中如果意外出现个人信息，剪掉对应录屏片段；不要用遮罩掩盖仍会随项目发布的数据。

## 5. 推荐录屏镜头

线上赛要求 3–5 分钟录屏。正式录制直接照着 [`VIDEO-SCRIPT.md`](./VIDEO-SCRIPT.md) 的 4 分钟导播表执行；里面已经写好每段时间、画面、旁白和必须出现的证据。

等待 Kiro 或测试的空白时间可以剪短，但必须保留“删除 → Hook → 失败 → Bugfix → 通过”的完整因果链。

## 6. Hook 未触发时的排查顺序

先依次确认：

1. 删除是 Kiro Agent 做的，不是手工操作。
2. Kiro 打开的文件夹就是包含 `.kiro` 的项目根目录。
3. `bury-on-delete.json` 已启用且 Kiro 面板没有配置错误。
4. 被删路径匹配 `demo-src/**/*.mjs`。
5. 文件在删除前已有 Git 基线。

如果仍然无法收到 `PostFileDelete`，使用唯一的兼容降级：临时把**现有** burial Hook 的触发器改为 `Stop`，删除文件 matcher，命令仍保持 `node scripts/undertaker.mjs bury`。不要新增第三个 Hook。Agent 停止时，脚本通过 `git diff --name-status --diff-filter=D` 找到删除记录。

录屏和说明中必须称它为 **Stop + Git diff fallback**，不得声称 `PostFileDelete` 成功。问题排除后恢复仓库中提交的主配置。

## 7. 重录原则

最安全的方式是为每次正式录制准备新的项目副本或 Git 工作树。只有在确认演示目录没有其他需要保留的改动时，才对明确列出的演示文件做文件级恢复；不要运行 `git reset --hard` 或 `git clean`。
