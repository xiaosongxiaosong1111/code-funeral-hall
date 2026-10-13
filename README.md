# 代码守灵堂 · Code Funeral Hall

> 别人让 AI 写代码，我们让 Agent 为删除代码负责。

代码守灵堂是一个 **Kiro 原生的代码退役 Agent 演示**。用户先在 Kiro Agent Picker 中选择 `Code Undertaker`，Agent 调用本地确定性工具完成只读“尸检”：检查 Git 跟踪状态、工作区、基线测试和存活依赖。发现风险后，它必须等待用户批准；删除只能通过 `code-funeral-hall` Feature Spec 中的任务 **7.2** 执行。两个 Hooks 随后自动立碑、运行健康测试，并把结果裁定为“诈尸”或“安息”。

墓碑、幽灵和白花不是产品的全部，而是 Agent 决策与测试证据的结果可视化。

## “鬼点子”是什么

这里的“鬼点子”不只是鬼怪视觉，而是一组容易记住的工程隐喻：

- 存活依赖 = 旧代码“诈尸”；
- 回归测试 = 死亡证明；
- 测试通过 = 安全“安息”；
- `Code Undertaker` = 调查风险、请求批准、执行退役和修复回归的专用 Agent。

因此项目既保留了“代码守灵堂”的趣味，也把真正价值落在一个严肃问题上：**删除文件不等于重构完成，验证通过才算完成。**

## 完整工作流

```text
在 Kiro Agent Picker 选择 Code Undertaker
  → Agent 调用 funeral:assess 做只读尸检
  → Git / 工作区 / 基线测试 / 依赖数形成 v2 assessment
  → 发现 1 个存活依赖，风险为 high，等待用户批准
  → 用户在 code-funeral-hall Feature Spec 中点击/运行任务 7.2
  → Agent 只删除 legacy-ghost.mjs
  → PostFileDelete Hook 自动立碑
  → PostTaskExec Hook 运行健康测试
  → 测试失败，墓碑“诈尸”
  → 同一 Agent 创建并执行最小 Bugfix Spec
  → 测试通过，同一块墓碑“安息”
```

`funeral:assess` 是确定性本地工具，不是假装成 AI 的脚本：它只提供可复现的事实；Kiro Agent 负责读取项目约束、组织步骤、向用户请求授权、生成 Spec、诊断失败并完成最小修复。项目不接外部模型 API。

## Kiro 在这里做了什么

- **Custom Agent**：`.kiro/agents/code-undertaker.md` 可由 Agent Picker 选择。
- **Knowledge Base + Skill**：复用安全退役规则和 Hook 契约；能否被本机 IDE 实际检索需在录制机器上验证。
- **Feature / Bugfix Spec**：把删除与修复拆成可审计任务。
- **Steering**：持续约束技术、目录、隐私和删除边界。
- **Agent Hooks**：`PostFileDelete` 立碑，`PostTaskExec` 用测试裁决。
- **本地证据工具**：Git、Node.js 测试和 v2 assessment 提供受控事实。

页面上的 `agentId`、风险标签或动画都不是 Kiro 执行证明。真正的比赛证据是同一段连续录屏中出现 Agent Picker、Agent 操作、Hooks 输出和页面状态变化。

## 运行要求

- Kiro IDE 1.x 或 Kiro CLI V3；
- Node.js 20+；
- Git，且演示文件已提交为基线；
- 现代浏览器。

项目没有第三方运行时依赖，不需要数据库、API Key 或云服务。

## 快速开始

```powershell
git clone https://github.com/xiaosongxiaosong1111/code-funeral-hall.git
cd code-funeral-hall
npm test
npm run validate
npm run dev
```

通过终端给出的 HTTP 地址打开页面，不要直接双击 `index.html`。正式演示时：

1. 用 Kiro 打开仓库根目录。
2. 在 **Agent Picker** 选择 **Code Undertaker**，不要输入 `/code-undertaker` 把 Skill 冒充 Agent。
3. 让 Agent 先运行：

   ```powershell
   npm run funeral:assess -- demo-src/legacy-ghost.mjs
   ```

4. 页面进入“**Kiro Agent · 现场评估**”，Evidence Console 显示：目标已跟踪、基线通过、依赖数 `1`、风险 `high`，且尚无墓碑。
5. Agent 必须停下来请求对精确删除目标的批准。
6. 批准后打开 `code-funeral-hall` Feature Spec，**点击/运行任务 7.2**；不要只在普通聊天里叫 Agent 删除。
7. burial 阶段允许的唯一 Spec 元数据文件变化是 `.kiro/specs/code-funeral-hall/tasks.md` 的真实任务状态；不要修改 requirements、design 或其他任务内容。
8. 再按 [Kiro 现场指南](docs/KIRO-DEMO-GUIDE.md) 完成“删除 → 诈尸 → Bugfix → 安息”。

`assess` 不修改或删除源码，但会把脱敏评估结果写入 `data/cemetery.json` 供证据台展示。正式录屏前请保留仓库的 `replay` 基线，在镜头中由 Agent 触发评估。

## 数据与安全边界

`data/cemetery.json` 只保存受控元数据：Agent ID、仓库相对目标、Git/工作区/基线布尔值、依赖数量、风险级别、文件统计和测试摘要。它不得保存源码、依赖路径清单、模型思维链、Hook 原始输入、用户绝对路径或凭据。

- `replay`：公开演示数据，不是现场证据；
- `live`：仅有 assessment 时显示“Kiro Agent · 现场评估”，出现墓碑后才显示“Kiro Hook · 实时”；单凭标签仍不能证明由 Kiro 调用；
- 当前原型只支持受控的 `demo-src/legacy-ghost.mjs` 演示，不宣称通用多语言分析，也不会在无人批准时生产化自动删除。

## 项目地图

```text
.kiro/agents/      可选择的 Code Undertaker Custom Agent
.kiro/specs/       Feature Spec；录制中由 Agent 创建 Bugfix Spec
.kiro/steering/    始终生效的项目约束
.kiro/skills/      安全退役 Skill 与知识资料
.kiro/hooks/       PostFileDelete / PostTaskExec
demo-src/          受控演示代码
scripts/           assessment、墓园领域逻辑和 Hook 命令
data/              元数据-only v2 状态
index.html 等      Agent 证据台与墓园结果可视化
tests/             契约、领域和健康测试
docs/              AI 交接与录屏指南
```

## 比赛提交口径

按本次线上赛页面口径，可提交可运行 Demo 或 3–5 分钟录屏，并附 200 字内说明；评审权重是脑洞 35%、Kiro 使用深度 35%、交付完成度 30%。本项目的对应关系是：

- 脑洞：把风险、回归和验证映射为“尸检、诈尸、安息”；
- Kiro 深度：Custom Agent + Knowledge Base/Skill + Spec + Steering + 两个 Hooks；
- 交付：可运行本地页面、确定性测试、公开仓库和可复现录屏流程。

### 200 字内项目说明

> 代码守灵堂是一名可在 Kiro Agent Picker 选择的代码退役 Agent。它先对源码做只读尸检，核对 Git、依赖与测试，等待批准后通过 Spec 任务 7.2 删除旧模块；Hooks 自动立碑并裁定，失败则“诈尸”，Agent 以 Bugfix Spec 最小修复，测试通过才“安息”。网页只展示可审计证据，不伪造 AI 结果。

## 录屏与接手

- [AI 接手与回家录屏说明](docs/AI-HANDOFF.md)
- [Kiro 现场演示指南](docs/KIRO-DEMO-GUIDE.md)
- [3–5 分钟录屏脚本](docs/VIDEO-SCRIPT.md)

开始录制前请先用真实 Kiro 验证 Agent Picker、Knowledge Base 和两个 Hooks。仓库中的配置与页面只能证明设计和数据契约存在，不能代替本机运行时证据。
