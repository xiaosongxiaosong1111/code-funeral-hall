# 4 分钟参赛录屏脚本

目标时长：3 分 40 秒至 4 分 20 秒。主角是 Kiro 的 **Code Undertaker Custom Agent**，墓园是它留下的证据与结果。

## 录制前只检查这 8 件事

1. 使用干净的新克隆，Kiro 与浏览器打开同一个根目录。
2. `demo-src/legacy-ghost.mjs` 存在且已被 Git 跟踪。
3. `npm test` 与 `npm run validate` 通过。
4. 本地页面通过 HTTP 地址打开，初始是 `replay`。
5. Kiro Agent Picker 能看到 **Code Undertaker**。
6. Feature Spec、Skill/Knowledge、Steering 和两个 Hooks 可见。
7. 尚未运行 `funeral:assess`，Feature Spec 任务 7.2 尚未执行，演示代码尚未删除或修复。
8. 录制 1920×1080，确保 Agent 名称、任务 7.2、Evidence Console、风险和墓碑状态能直接读清。

Knowledge Base 若没有在本机实际搜索成功，旁白只说“配置了知识资源”或“当前未实机验证”，不要说“已经检索成功”。

## 逐镜头照读

| 时间 | 画面与操作 | 直接照读的旁白 | 必须拍到的证据 |
|---|---|---|---|
| 0:00–0:20 | 浏览器首页和 Agent Evidence Console | “屏幕上先是回放样例。多数 AI 帮人写代码，我们反过来，让 Agent 为删除代码负责。墓园只是记忆点，真正的鬼点子是可追责的代码退役。” | 标题、Evidence Console、`replay` 标识 |
| 0:20–0:45 | 切到 Kiro，在 Agent Picker 选择 Code Undertaker；快速展示 Agent、Spec、Skill 和 Hooks | “我在 Kiro Agent Picker 里选择专用的 Code Undertaker。它受 Steering、Skill 和 Spec 约束，两个 Hooks 分别负责立碑和测试裁决。” | Picker 中的 Agent、`.kiro/agents`、Spec、两个 Hooks |
| 0:45–1:20 | 向 Agent 发尸检指令；Agent 调用 `npm run funeral:assess -- demo-src/legacy-ghost.mjs`；切到页面证据台 | “Agent 先调用本地确定性工具做只读尸检，而不是直接删文件。Git 已跟踪、工作区干净、基线通过，但仍有一个存活依赖，所以风险是 high。” | Agent 调用命令、“Kiro Agent · 现场评估”、依赖数 `1`、`high` |
| 1:20–1:45 | 回到 Kiro，拍到 Agent 请求批准；用户只批准目标文件；打开 `code-funeral-hall` Feature Spec，点击/运行任务 7.2 | “高风险不会自动删除。Agent 必须先等我批准；然后我从 Feature Spec 运行任务 7.2，而不是在普通聊天里叫它直接删。这个任务只允许删除目标，不提前修复。” | Agent 等待批准、用户授权、任务 7.2 启动画面、唯一目标 |
| 1:45–2:15 | 显示 Hook 输出，再切网页停在诈尸状态 | “删除触发 PostFileDelete 立碑；Spec 任务结束后，PostTaskExec 运行健康测试。消费者仍依赖旧模块，测试失败，所以同一块墓碑诈尸。” | “Kiro Hook · 实时”、两个 Hook、失败摘要、`resurrected`、红色幽灵 |
| 2:15–3:10 | 同一 Agent 创建 Bugfix Spec，展示三项约束和消费者最小 diff | “同一个 Agent 根据真实失败创建 Bugfix Spec：不恢复旧文件，不改变公开行为，不改测试或 JSON 伪造通过。它只修复仍依赖旧模块的消费者。” | 同一 Agent、Bugfix Spec、三项约束、最小修改 |
| 3:10–3:40 | Hook 再次运行，网页变为安息和白花 | “任务完成后，Hook 再次裁决。测试通过，同一个退役案从诈尸变成安息。删除不是完成，验证通过才是完成。” | `resting`、通过摘要、白花、同一目标 |
| 3:40–4:05 | 展示 `data/cemetery.json` 的字段和终端最终测试，再回首页 | “页面只展示 Agent ID、相对路径、依赖数量、风险和测试摘要，不保存源码、思维链或用户路径。Kiro 负责决策，确定性工具负责事实，页面负责把证据讲清楚。” | 元数据-only JSON、最终测试、收束画面 |

## 镜头中使用的三段指令

### 1. 只读尸检

```text
请读取当前 Feature Spec、Steering 和 code-undertaker Skill。现在只做退役前尸检，不删除也不修改源码。请调用：
npm run funeral:assess -- demo-src/legacy-ghost.mjs
根据工具返回的受控事实说明风险，并在任何删除前停下来请求我批准精确目标。
```

### 2. 批准唯一目标，然后运行 Feature Spec 任务 7.2

```text
我批准退役的精确目标仅为 demo-src/legacy-ghost.mjs。不要通过普通聊天直接删除；接下来只允许由 code-funeral-hall Feature Spec 的任务 7.2 执行。本任务只删除旧模块，不要修改 demo-src/active-consumer.mjs，不要提前修复测试，也不要直接修改 data/cemetery.json。
```

发出授权后，切到 Kiro 的 `code-funeral-hall` Feature Spec 任务列表，**点击/运行任务 7.2**。镜头不要跳过这一步。burial 阶段允许的唯一 Spec 元数据文件变化，是 `.kiro/specs/code-funeral-hall/tasks.md` 的真实任务状态；不要改 requirements、design 或其他任务内容。

### 3. 最小 Bugfix

```text
刚才的退役导致健康测试失败。请基于真实失败创建并执行最小 Bugfix Spec：不得恢复 demo-src/legacy-ghost.mjs；不得改变 memorialMessage('旧接口') 返回 '旧接口 已归档' 的公开行为；不得修改健康测试或墓园 JSON 伪造通过。只修复仍依赖旧模块的消费者，并让 PostTaskExec 重新裁决。
```

## 剪辑规则

- 保留同一次 Kiro 会话中的“选择 Agent → assess → 请求批准 → 删除 → Hooks → 失败 → Bugfix → 通过”。
- 可以加速 Kiro 思考、命令和测试等待，但不要用不同克隆或不同录次的结果拼接因果链。
- 不要把页面 `agentId`、`live` 标签或本地回放当作 Kiro 证明。
- 不要输入 `/code-undertaker`；必须拍到 Agent Picker 选择 Code Undertaker。
- 不要让普通聊天直接执行删除；必须拍到 `code-funeral-hall` Feature Spec 任务 7.2 被点击/运行。
- 第一次删除如果顺手修好了消费者，停止并用新克隆重录，不要伪造诈尸。
- Hook 使用 fallback 时必须在旁白和提交说明中明确说 **Stop + Git diff fallback**。
- 不需要逐行讲代码；评委应看懂创意、Kiro 的不可替代作用和真实验证结果。

## 录完后补拍的验收画面

```powershell
npm test
npm run validate
npm run build
git diff --stat
```

只需保留一小段最终通过画面。不要在录屏里显示凭据、用户绝对路径或无关终端历史。

## 可直接提交的 200 字内说明

> 代码守灵堂是一名可在 Kiro Agent Picker 选择的代码退役 Agent。它先对源码做只读尸检，核对 Git、依赖与测试，等待批准后通过 Spec 任务 7.2 删除旧模块；Hooks 自动立碑并裁定，失败则“诈尸”，Agent 以 Bugfix Spec 最小修复，测试通过才“安息”。网页只展示可审计证据，不伪造 AI 结果。

按本次线上赛页面口径，提交可运行 Demo 或 3–5 分钟录屏并附 200 字内说明；评审为脑洞 35%、Kiro 使用深度 35%、交付完成度 30%。
