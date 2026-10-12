# 代码守灵堂需求

## 项目愿景

“代码守灵堂”把一次不可见的代码删除，变成可解释、可验证的告别仪式：Kiro 删除演示模块后，系统为它立碑；测试失败时它以“幽灵”状态复活；修复依赖且测试通过后，它才真正安息。

## 术语

- **葬礼**：Kiro Agent 删除 `demo-src/**/*.mjs` 后，由 Hook 记录墓碑的流程。
- **墓碑**：仅包含文件元数据和验证结果的 JSON 记录，不包含源码。
- **诈尸**：删除后项目健康测试失败，墓碑进入 `resurrected` 状态。
- **安息**：删除后项目健康测试通过，墓碑进入 `resting` 状态。
- **现场模式**：展示本地 Hook 真实产生的数据。
- **回放模式**：线上静态站展示预先录制且脱敏的演示数据。

## 需求 1：为 Kiro 删除的演示代码立碑

### 用户故事

作为演示观众，我希望看到 Kiro 删除文件后自动出现墓碑，从而理解 Agent Hook 确实参与了作品运行，而不只是帮助编写页面。

### 验收标准

1. WHEN Kiro Agent 删除匹配 `demo-src/**/*.mjs` 的文件 THEN THE SYSTEM SHALL 通过 `PostFileDelete` Hook 执行葬礼登记。
2. WHEN 葬礼登记发现一个允许范围内的 Git 删除记录 THEN THE SYSTEM SHALL 创建或更新一条墓碑记录，并将其设为当前墓碑。
3. WHEN 同一文件的删除事件被重复处理 THEN THE SYSTEM SHALL 更新现有墓碑，而不是生成重复记录。
4. WHEN 删除发生在 `demo-src` 之外、扩展名不是 `.mjs` 或路径逃逸工作区 THEN THE SYSTEM SHALL 忽略该路径且不写入墓园数据。
5. WHEN 文件由用户在资源管理器或编辑器中手工删除 THEN THE SYSTEM SHALL NOT 声称该操作触发了 Kiro 文件 Hook。

## 需求 2：只记录可公开的代码元数据

### 用户故事

作为参赛者，我希望展示代码的“生平”而不泄漏源码或凭据，从而可以安全录屏和公开部署。

### 验收标准

1. WHEN 系统创建墓碑 THEN THE SYSTEM SHALL 只保存稳定标识、相对路径、文件名、行数、Git 年龄、提交次数、删除时间、受控死因文案、状态和测试摘要。
2. WHEN 系统为了计算行数读取删除前版本 THEN THE SYSTEM SHALL 只在内存中处理内容且不得把源码写入 JSON、日志或页面。
3. WHEN Hook 从标准输入收到事件载荷 THEN THE SYSTEM SHALL 将载荷视为不可信输入，且不得原样持久化。
4. WHEN 页面展示墓碑 THEN THE SYSTEM SHALL 只读取脱敏后的 `data/cemetery.json`。

## 需求 3：用测试裁定安息或诈尸

### 用户故事

作为开发者，我希望代码删除完成后自动运行健康测试，从而让“已安息”代表可验证的安全删除。

### 验收标准

1. WHEN Kiro 完成一个 Spec 任务 THEN THE SYSTEM SHALL 通过 `PostTaskExec` Hook 运行墓园裁定。
2. WHEN 项目健康测试失败 THEN THE SYSTEM SHALL 把当前墓碑设为 `resurrected`，并记录失败数量和耗时。
3. WHEN 项目健康测试通过 THEN THE SYSTEM SHALL 把当前墓碑设为 `resting`，并记录通过结果和耗时。
4. WHEN 没有当前墓碑 THEN THE SYSTEM SHALL 安全退出且不得伪造墓碑。
5. WHEN 测试失败仅代表预期的“诈尸”剧情 THEN THE SYSTEM SHALL 完成状态记录，并将修复工作交给后续 Bugfix Spec。

## 需求 4：让状态变化易于观看

### 用户故事

作为评委，我希望在一个网页中立刻分辨等待裁定、诈尸和安息，从而在短时间内理解创意和技术闭环。

### 验收标准

1. WHEN 墓碑状态为 `pending` THEN THE SYSTEM SHALL 展示正在等待裁定的视觉状态。
2. WHEN 墓碑状态为 `resurrected` THEN THE SYSTEM SHALL 展示墓碑裂开或幽灵出现的视觉反馈，并明确说明测试失败。
3. WHEN 墓碑状态为 `resting` THEN THE SYSTEM SHALL 展示白花或安息视觉反馈，并明确说明测试通过。
4. WHEN 页面在现场模式运行 THEN THE SYSTEM SHALL 周期性读取墓园数据并在无需手工刷新的情况下反映状态变化。
5. WHEN 线上环境无法运行本地 Kiro Hook THEN THE SYSTEM SHALL 使用明确标注的回放模式展示真实录制的脱敏事件。

## 需求 5：保持演示安全、确定且可复现

### 用户故事

作为项目维护者，我希望演示只操作专用样例代码，从而不会误删真实业务文件，也不会依赖付费服务。

### 验收标准

1. WHEN 执行葬礼任务 THEN THE SYSTEM SHALL 只允许删除事先提交到 Git 的 `demo-src/legacy-ghost.mjs`。
2. WHEN 脚本执行 Git 或测试命令 THEN THE SYSTEM SHALL 使用参数数组而不是拼接不可信路径到 Shell 命令。
3. WHEN 运行完整项目 THEN THE SYSTEM SHALL 仅依赖 Node.js 20+、Git 和浏览器，不需要数据库、云 API 或密钥。
4. WHEN 用户准备重复录制 THEN THE SYSTEM SHALL 使用干净副本或明确的 Git 基线，避免覆盖未提交工作。

## 需求 6：保留可核验的 Kiro 使用证据

### 用户故事

作为参赛者，我希望演示能证明 Spec、Steering、Skill 和 Hooks 都被实际使用，从而完整呈现 Kiro 的开发深度。

### 验收标准

1. WHEN 录制演示 THEN THE SYSTEM SHALL 展示本 Spec、`code-undertaker` Skill 和两个已启用 Hook。
2. WHEN Kiro 删除演示文件 THEN THE SYSTEM SHALL 在同一段录制中展示墓碑产生以及测试失败后的诈尸状态。
3. WHEN Kiro 根据 Bugfix Spec 修复依赖 THEN THE SYSTEM SHALL 展示测试转为通过以及墓碑进入安息状态。
4. IF 当前 Kiro 构建未触发 `PostFileDelete` THEN THE SYSTEM SHALL 允许把同一登记命令临时改由 `Stop` 触发，并继续通过 `git diff` 识别删除；不得把该降级描述成文件删除 Hook 成功。
