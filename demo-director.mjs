const DIRECTOR_PHASES = Object.freeze({
  local: Object.freeze({
    phase: 'local',
    kicker: '视觉回放 · 非现场证据',
    title: '正在预览尸检、诈尸与安息画面',
    description: '本地回放不会调用 Agent、删除文件或触发 Hook；正式录屏仍要从 Kiro 的真实尸检开始。',
    promptKey: null,
    buttonLabel: '',
    status: '回放只验证视觉效果，不会修改真实墓园数据。',
  }),
  replay: Object.freeze({
    phase: 'replay',
    kicker: '公开回放 · 还不是比赛证据',
    title: '先回到 Kiro，让 Agent 做一次真实尸检',
    description: '当前 assessment 和墓碑都是脱敏样例；请在 Kiro Agent Picker 选择 Code Undertaker，从 assess 开始录制。',
    promptKey: 'assess',
    buttonLabel: '复制 Agent 尸检指令',
    status: '回放数据只解释创意，不能证明 Agent 或 Hooks 已执行。',
  }),
  assess: Object.freeze({
    phase: 'assess',
    kicker: 'Agent 尸检 · 第 1 步',
    title: '先调查，再决定旧代码能不能删',
    description: '在 Kiro Agent Picker 选择 Code Undertaker，运行 assess；让它只报告证据，然后等待你的批准。',
    promptKey: 'assess',
    buttonLabel: '复制 Agent 尸检指令',
    status: 'Agent 名称不是执行证明；尸检结果写入 Evidence Console 后才进入批准阶段。',
  }),
  approval: Object.freeze({
    phase: 'approval',
    kicker: '风险已评估 · 第 2 步',
    title: '证据齐了，等待你批准删除',
    description: '核对目标、Git 状态、基线测试和依赖数量；确认风险可接受后，再授权 Agent 删除演示旧模块。',
    promptKey: 'delete',
    buttonLabel: '复制受控删除指令',
    status: '按钮只复制文字，真正删除仍需你在 Kiro 中明确批准。',
  }),
  blocked: Object.freeze({
    phase: 'blocked',
    kicker: '尸检阻塞 · 禁止下葬',
    title: '当前证据不允许删除',
    description: '评估发现阻塞项，禁止删除。先按 Agent 报告清理未提交改动、基线失败或未跟踪目标，再重新 assess。',
    promptKey: null,
    buttonLabel: '',
    status: '删除入口已关闭；处理阻塞项后重新运行 Code Undertaker 尸检。',
  }),
  pending: Object.freeze({
    phase: 'pending',
    kicker: 'Hook 裁决 · 第 3 步',
    title: '文件已删除，Hook 正在验尸',
    description: '现在不用点击任何按钮。健康测试结束后，页面会自动裁定这次退役是否安全。',
    promptKey: null,
    buttonLabel: '',
    status: '保持本页可见，等待状态自动更新。',
  }),
  resurrected: Object.freeze({
    phase: 'resurrected',
    kicker: 'Agent 诊断 · 第 4 步',
    title: '残留依赖让旧代码“诈尸”了',
    description: '先录下失败证据，再回到 Kiro，让 Code Undertaker 诊断根因并生成最小 Bugfix Spec。',
    promptKey: 'fix',
    buttonLabel: '复制 Agent 修复指令',
    status: '先保留诈尸证据，再交给 Agent 修复。',
  }),
  resting: Object.freeze({
    phase: 'resting',
    kicker: '验证通过 · 演示完成',
    title: '同一块墓碑已经安息',
    description: 'Code Undertaker 完成最小修复，健康测试通过。用这幅安息画面收尾即可。',
    promptKey: null,
    buttonLabel: '',
    status: '删除不是完成，验证通过才是完成。',
  }),
});

export function getDemoDirector({
  mode = 'replay',
  state = 'pending',
  risk,
  hasAssessment = false,
  hasGrave = false,
  localReplay = false,
}) {
  if (localReplay) return DIRECTOR_PHASES.local;
  if (mode !== 'live') return DIRECTOR_PHASES.replay;
  if (!hasAssessment) return DIRECTOR_PHASES.assess;
  if (risk === 'blocked') return DIRECTOR_PHASES.blocked;
  if (!hasGrave) return DIRECTOR_PHASES.approval;
  if (state === 'resurrected') return DIRECTOR_PHASES.resurrected;
  if (state === 'resting') return DIRECTOR_PHASES.resting;
  return DIRECTOR_PHASES.pending;
}

export function completedRitualSteps(state, hasGrave, hasAssessment) {
  if (!hasAssessment) return 0;
  if (!hasGrave) return 1;
  if (state === 'resting') return 4;
  if (state === 'resurrected') return 3;
  return 2;
}
