# 代码守灵堂

> 被删除的代码不会立刻离开；只有测试通过，它才真正安息。

代码守灵堂是一个 Kiro 原生演示项目。Kiro Agent 删除一个受控的旧模块时，`PostFileDelete` Hook 自动为它立碑；Spec 任务完成后，`PostTaskExec` Hook 运行健康测试。失败的删除会“诈尸”，Kiro 再通过 Bugfix Spec 修复依赖，测试通过后墓碑才开出白花。

## 为什么适合 Kiro

- **Feature Spec** 固化需求、设计和逐项任务。
- **Steering** 保持技术、结构与隐私约束始终生效。
- **Workspace Skill** 指导安全葬礼和 Bugfix 流程。
- **Agent Hooks** 把 Kiro 的真实文件操作与测试结果接入作品。

## 运行要求

- Kiro IDE 1.x 或 Kiro CLI V3；真实 Hook 不能只靠 Kiro Web 执行。
- Node.js 20+。
- Git，并且演示文件已经提交为基线。
- 现代浏览器。

项目没有第三方运行时依赖，不需要执行 `npm install`，也不需要数据库、API 密钥或云服务。

## 快速开始

在 PowerShell 中进入项目目录：

```powershell
node --version
git status --short
npm test
npm run validate
npm run build
npm run dev
```

终端会显示本地访问地址。请通过该 HTTP 地址打开页面；不要直接双击 HTML，因为浏览器需要读取 `data/cemetery.json`。

然后在 Kiro 中：

1. 选择 **File → Open Folder**，打开本项目根目录并仅信任这个项目。
2. 在 Kiro 面板确认能看到 `code-funeral-hall` Spec、`code-undertaker` Skill 和两个 Hooks。
3. 打开 [Kiro 演示指南](docs/KIRO-DEMO-GUIDE.md)，按顺序让 Kiro 执行尚未勾选的 Spec 任务。
4. 不要手工删除 `legacy-ghost.mjs`；Kiro 文件 Hook 只对 Agent 在同一工作区造成的变更生效。
5. 正式录屏时直接照着 [4 分钟参赛录屏脚本](docs/VIDEO-SCRIPT.md) 的画面和旁白执行。

如果要换一台电脑或交给另一个 AI 接手，请先完整阅读 [AI 接手与回家录屏交接说明](docs/AI-HANDOFF.md)。

## 数据与隐私

`data/cemetery.json` 只允许保存文件名、仓库相对路径、行数、Git 年龄、提交次数、时间、程序内置死因、状态和测试摘要。源码、Hook 原始输入、绝对用户路径、凭据和远端地址不得写入数据或页面。

本地页面是 **现场模式**；公开静态站点是明确标注的 **回放模式**。回放保证评委随时访问，但真实 Hook 证据来自 Kiro IDE 录屏。

## 项目地图

```text
.kiro/specs/       Kiro Feature Spec
.kiro/steering/    始终生效的项目约束
.kiro/skills/      按需启用的 Code Undertaker
.kiro/hooks/       PostFileDelete / PostTaskExec
demo-src/          唯一允许删除的演示代码
scripts/           墓园领域逻辑与 Hook 命令
data/              元数据-only 墓园状态
index.html 等      静态体验
tests/             领域测试和项目健康测试
```

## 验收

完整演示必须形成以下状态链：

```text
Kiro 删除 legacy-ghost.mjs
  → pending 墓碑
  → 健康测试失败
  → resurrected 幽灵
  → Kiro Bugfix Spec 修复消费者
  → 健康测试通过
  → resting 白花
```

若 `PostFileDelete` 在当前 Kiro 构建中未触发，请先检查工作区、匹配器和删除者；最后才使用文档中的 **Stop + Git diff** 兼容降级，并如实标注。

## Kiro 官方参考

- [Feature Specs](https://kiro.dev/docs/specs/feature-specs/)
- [Steering inclusion modes](https://kiro.dev/docs/steering/)
- [Agent Skills](https://kiro.dev/docs/skills/)
- [Hook triggers](https://kiro.dev/docs/hooks/types/)
- [Hook actions](https://kiro.dev/docs/hooks/actions/)
