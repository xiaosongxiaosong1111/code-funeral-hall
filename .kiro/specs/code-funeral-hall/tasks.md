# 实施任务

> 已勾选部分是交付的安全脚手架；未勾选部分必须在 Kiro 中真实执行并录制，才能形成参赛证据。

- [x] 1. 建立无依赖 Node.js 项目和可控演示夹具
  - 配置 Node.js 20+、ES Modules、`node:test` 和构建/开发命令。
  - 创建只用于比赛演示的 `legacy-ghost.mjs`、消费者以及健康测试。
  - _Requirements: 3.3, 5.1, 5.3_

- [x] 2. 实现墓园领域模型
  - 过滤并规范化 Git 删除路径，只接受 `demo-src/**/*.mjs`。
  - 创建只包含元数据的墓碑，并实现不可变 upsert 和状态裁定。
  - 用单元测试证明路径越界被拒绝、源码不会持久化、重复事件不会重复立碑。
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 3.2, 3.3, 3.4_

- [x] 3. 实现确定性的 Undertaker 命令
  - 实现 `bury`：从受限 Git diff 找到删除文件并安全提取 Git 元数据。
  - 实现 `settle`：运行健康测试并原子更新当前墓碑状态。
  - 验证缺少 Git 基线、无匹配删除和无当前墓碑时不会伪造数据。
  - _Requirements: 1.2, 2.2, 2.3, 3.2, 3.3, 5.2_

- [x] 4. 实现现场/回放墓园页面
  - 渲染墓碑的文件名、生平元数据和测试摘要。
  - 为 `pending`、`resurrected`、`resting` 提供清晰且可访问的视觉状态。
  - 在现场模式轮询 JSON，并为线上环境提供明确标注的回放数据。
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. 配置 Kiro 项目上下文和自动化
  - 添加 Feature Spec、四份 Steering 文件和 `code-undertaker` Workspace Skill。
  - 添加 `PostFileDelete` 和 `PostTaskExec` v1 Hook。
  - 编写真实演示、录屏证据、隐私规则和兼容降级指南。
  - _Requirements: 1.1, 3.1, 6.1, 6.4_

- [ ] 6. 用 Kiro Agent 执行第一次代码葬礼
  - [ ] 6.1 在确认 Git 工作区除预期演示改动外干净后，只删除 `demo-src/legacy-ghost.mjs`；不要同时修复 `active-consumer.mjs`，也不要手工删除文件。
    - _Requirements: 1.1, 1.5, 5.1, 6.2_
  - [ ] 6.2 核对 `data/cemetery.json` 已出现当前墓碑，且文件中不含删除前源码、绝对用户路径或 Hook 原始载荷。
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. 记录预期的诈尸证据
  - [ ] 7.1 完成删除任务，让 `PostTaskExec` 自动运行裁定；确认健康测试失败且墓碑进入 `resurrected`。
    - _Requirements: 3.1, 3.2, 3.5, 4.2, 6.2_
  - [ ] 7.2 在页面和 Kiro 中记录同一次删除产生的墓碑、失败测试摘要和幽灵视觉，不把它描述为随机故障。
    - _Requirements: 4.2, 4.4, 6.2_

- [ ] 8. 让 Kiro 通过 Bugfix Spec 安葬幽灵
  - [ ] 8.1 为断裂 import 创建 Bugfix Spec，写明预期保持 `memorialMessage('旧接口') === '旧接口 已归档'`，且不得恢复 `legacy-ghost.mjs`。
    - _Requirements: 3.5, 5.1, 6.3_
  - [ ] 8.2 由 Kiro 执行 Bugfix 任务，保持公开行为不变，并让任务完成后的 Hook 再次裁定。
    - _Requirements: 3.1, 3.3, 6.3_
  - [ ] 8.3 确认健康测试通过、墓碑进入 `resting`，页面显示安息视觉。
    - _Requirements: 3.3, 4.3, 4.4, 6.3_

- [ ] 9. 完成最终可核验演示
  - [ ] 9.1 运行项目验证和构建，检查无源码、密钥、绝对用户路径或无效 Hook 配置进入公开产物。
    - _Requirements: 2.4, 5.2, 5.3_
  - [ ] 9.2 录制包含 Spec、Skill、Hooks、删除、诈尸、Bugfix 和安息的连续证据，并将线上页面明确标为回放模式。
    - _Requirements: 4.5, 6.1, 6.2, 6.3_

