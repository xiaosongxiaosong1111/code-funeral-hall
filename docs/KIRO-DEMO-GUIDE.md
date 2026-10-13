# Kiro Agent 现场演示与录屏指南

这份指南只服务一件事：在同一次真实 Kiro 演示中形成“Agent 尸检 → 用户批准 → 受控删除 → Hook 诈尸 → Agent 修复 → 测试安息”的完整证据链。

页面数据、`agentId` 和动画不能单独证明 Kiro 执行过操作。

## 1. 录制前准备

使用干净的新克隆：

```powershell
git clone https://github.com/xiaosongxiaosong1111/code-funeral-hall.git
cd code-funeral-hall
git status --short
npm test
npm run validate
npm run dev
```

录制前确认：

- `git status --short` 没有不明改动；
- `demo-src/legacy-ghost.mjs` 存在且已被 Git 跟踪；
- 测试和契约校验通过；
- 页面通过本地 HTTP 地址打开，初始为 `replay`；其中的 high assessment/诈尸墓碑只是版式示例，不是本机证据；
- Kiro 打开的是同一个仓库根目录；
- `.kiro/agents/code-undertaker.md`、Feature Spec、Skill、Steering 和两个 Hooks 存在。

此时不要提前运行 `funeral:assess`。它不会改源码，但会写入现场 assessment，应该留在正式镜头中由 Agent 调用。

## 2. 选择真正的 Custom Agent

在 Kiro 的 **Agent Picker / Agent 下拉框**中选择 **Code Undertaker**。

不要输入 `/code-undertaker`：那会把 Workspace Skill 冒充成 Custom Agent，无法证明 Agent Picker 中的专用 Agent 被使用。

录屏中拍到：

1. Agent Picker 中的 Code Undertaker；
2. `.kiro/agents/code-undertaker.md`；
3. Agent 使用的 Feature Spec、Skill/Knowledge 资源；
4. 两个独立 Hooks。

如果 Picker 看不到 Agent，停止录制，检查工作区根目录、配置错误和 Kiro 版本。不要用页面上的 `agentId` 补证。

Knowledge Base 是否能在本机 IDE 中搜索必须实机确认。配置存在不等于检索成功；失败时如实标注“未实机验证”，可以让 Agent 直接读取 Skill references 排障，但不要伪造 Knowledge Base 证据。

## 3. 第一幕：只读尸检

把以下指令交给已经选中的 Code Undertaker：

```text
请读取当前 Feature Spec、Steering 和 code-undertaker Skill。现在只做退役前尸检，不删除也不修改源码。请调用：
npm run funeral:assess -- demo-src/legacy-ghost.mjs
根据工具返回的受控事实说明风险，并在任何删除前停下来请求我批准精确目标。
```

`funeral:assess` 是确定性本地事实工具，不是另一个 AI。它检查：

- 目标是否被 Git 跟踪；
- 执行前工作区是否无无关改动；
- 基线健康测试是否通过；
- `demo-src` 中有多少存活依赖。

预期 Evidence Console：

```text
agentId         code-undertaker
targetPath      demo-src/legacy-ghost.mjs
tracked         true
workspaceClean  true
baselinePassed  true
dependentCount  1
risk            high
```

`assess` 对源码只读，但会把这组脱敏事实写入 `data/cemetery.json`。拍到页面显示“**Kiro Agent · 现场评估**”、`high`、1 个依赖、尚无墓碑，以及 Agent 明确等待批准。删除立碑后，模式标签才应变成“**Kiro Hook · 实时**”。

如果结果是 `blocked`，按输出解决 Git/测试前置问题；如果是 `low`，说明演示依赖很可能已被改掉，应换干净克隆。不要手改风险字段。

## 4. 第二幕：批准唯一目标，从 Feature Spec 运行任务 7.2

确认 high 风险后，用户先明确回复：

```text
我批准退役的精确目标仅为 demo-src/legacy-ghost.mjs。不要通过普通聊天直接删除；接下来只允许由 code-funeral-hall Feature Spec 的任务 7.2 执行。本任务只删除旧模块，不要修改 demo-src/active-consumer.mjs，不要提前修复测试，也不要直接修改 data/cemetery.json。
```

接着打开 Kiro 的 `code-funeral-hall` Feature Spec，在任务列表里**点击/运行任务 7.2**。必须把这个操作录进视频；只有聊天授权、随后由自由聊天直接删除，不算 Spec 任务证据，也无法可靠证明后续 `PostTaskExec` 对应这次删除。

任务 7.2 的 burial 阶段允许的唯一 Spec 元数据文件变化，是 `.kiro/specs/code-funeral-hall/tasks.md` 中由真实执行产生的任务状态。不要修改 `requirements.md`、`design.md` 或其他任务内容，也不要手工勾选任务。

运行任务前确认屏幕中只有这一个删除目标。预期现场顺序：

1. Kiro 从 Feature Spec 启动任务 7.2，Code Undertaker 只删除目标；
2. `PostFileDelete` 自动运行 `bury`；
3. assessment 与墓碑使用同一稳定 ID，墓碑进入 `pending`；
4. Spec 任务完成后，`PostTaskExec` 自动运行 `settle`；
5. 消费者仍导入被删模块，健康测试失败；
6. 同一墓碑进入 `resurrected`，页面出现红色幽灵。

必须拍到：Kiro 删除操作、Hook 执行、目标文件消失、测试失败摘要和“测试失败 · 已诈尸”。`pending` 可能很短，不必强求停帧。

## 5. 第三幕：同一 Agent 创建 Bugfix Spec

让诈尸画面停留几秒，然后对同一个 Code Undertaker 说：

```text
刚才的退役导致健康测试失败。请基于真实失败创建并执行最小 Bugfix Spec：不得恢复 demo-src/legacy-ghost.mjs；不得改变 memorialMessage('旧接口') 返回 '旧接口 已归档' 的公开行为；不得修改健康测试或墓园 JSON 伪造通过。只修复仍依赖旧模块的消费者，并让 PostTaskExec 重新裁决。
```

镜头中核对：

- Bugfix Spec 写出当前行为、预期行为和不变行为；
- 修改集中在消费者，没有恢复旧文件；
- 没有降低测试标准；
- `PostTaskExec` 再次运行；
- 同一块墓碑从 `resurrected` 转为 `resting`；
- 页面出现白花和“测试通过 · 已安息”。

## 6. 最终验收

```powershell
npm test
npm run validate
npm run build
git status --short
git diff --stat
```

`npm run build` 会把公开快照强制标记为 `replay`，不会把静态站伪装成 Kiro 现场。

查看 `data/cemetery.json`，只允许出现受控元数据：Agent ID、相对目标路径、Git/工作区/基线事实、依赖数量、风险、文件统计、时间和测试摘要。

若出现以下内容，停止发布：

- 源码或依赖路径清单；
- 模型思维链或自由文本推理；
- Hook 原始输入；
- 用户绝对路径；
- Token、Cookie、邮箱或凭据。

## 7. 证据清单

最终视频必须包含：

- [ ] Agent Picker 选中 Code Undertaker；
- [ ] Agent 调用 `funeral:assess`；
- [ ] assessment 为 `high` 且 `dependentCount` 为 `1`；
- [ ] Agent 在删除前请求精确授权；
- [ ] 用户只批准 `demo-src/legacy-ghost.mjs`；
- [ ] 视频拍到在 `code-funeral-hall` Feature Spec 点击/运行任务 7.2；
- [ ] 任务 7.2 只删除目标，Spec 侧只有 `tasks.md` 的真实任务状态变化；
- [ ] `PostFileDelete` 和 `PostTaskExec` 真实输出；
- [ ] 同一退役案先 `resurrected` 再 `resting`；
- [ ] 同一个 Agent 创建并执行最小 Bugfix Spec；
- [ ] 旧文件没有恢复，公开行为保持；
- [ ] 元数据-only 数据和最终测试结果；
- [ ] 线上/构建页面明确是 `replay`。

连续 Kiro 录屏才是运行证据。允许加速等待或删去纯空白，但不要拼接不同克隆或不同演示轮次来伪造因果。

## 8. Hook 未触发时

依次检查：

1. 删除是否由当前 Kiro Agent 完成；
2. Kiro 是否打开仓库根目录；
3. 两个 Hook 是否启用且无配置错误；
4. 删除路径是否匹配受控目标；
5. 文件删除前是否有 Git 基线。

若 `PostFileDelete` 在当前 Kiro 版本仍不触发，只允许使用既有的 **Stop + Git diff fallback**：临时把 burial Hook 触发器改为 `Stop`，仍由 `node scripts/undertaker.mjs bury` 根据 Git 删除事实立碑。视频和提交说明必须明确写 fallback，不得声称 `PostFileDelete` 成功。

## 9. 重录与安全

- 第一次任务若把消费者一起修好，不要伪造诈尸；换新克隆重录。
- assessment 前若工作区不干净，先报告具体改动，不要宽泛清理。
- 不运行 `git reset --hard` 或 `git clean`。
- 不手改 `data/cemetery.json` 让页面变绿。
- 不把本项目夸大为通用多语言分析或生产无人值守删除平台。
- 最安全的重录方式是新克隆或新 Git 工作树。

## 10. 比赛口径

按本次线上赛页面口径，可交可运行 Demo 或 3–5 分钟录屏，并附 200 字内说明；评分为脑洞 35%、Kiro 使用深度 35%、交付完成度 30%。对应内容应分别拍清：工程隐喻、Custom Agent/Spec/Hooks 深度、可运行与可验证结果。

具体镜头和旁白见 [`VIDEO-SCRIPT.md`](./VIDEO-SCRIPT.md)。
