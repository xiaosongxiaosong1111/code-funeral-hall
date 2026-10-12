const DIRECTOR_PHASES = Object.freeze({
  local: Object.freeze({
    phase: 'local',
    kicker: '视觉回放',
    title: '这只是画面预览，不是 Kiro Hook 证据',
    description: '回放会自动演示三种状态；正式录屏仍要从 Kiro 的真实删除开始。',
    promptKey: null,
    buttonLabel: '',
    status: '回放不会删除文件，也不会修改真实墓园数据。',
  }),
  replay: Object.freeze({
    phase: 'replay',
    kicker: '录屏准备 · 第 1 步',
    title: '当前是回放数据，还不是比赛证据',
    description: '先切到 Kiro，让 Agent 只删除演示旧模块；真实 Hook 会自动把结果写回本页。',
    promptKey: 'delete',
    buttonLabel: '复制真实删除指令',
    status: '录屏从 Kiro 开始；这个页面负责展示 Hook 和测试结果。',
  }),
  ready: Object.freeze({
    phase: 'ready',
    kicker: '现场已就绪 · 第 1 步',
    title: '去 Kiro 删除演示旧模块',
    description: '粘贴指令并核对授权目标只有 legacy-ghost.mjs，然后回来观察页面。',
    promptKey: 'delete',
    buttonLabel: '复制删除指令',
    status: '按钮只复制文字，真正删除仍需你在 Kiro 中确认。',
  }),
  pending: Object.freeze({
    phase: 'pending',
    kicker: 'Hook 已接管 · 第 2 步',
    title: '文件已删除，正在运行健康测试',
    description: '现在不用点击任何按钮。测试结束后，页面会自动告诉你删除是否安全。',
    promptKey: null,
    buttonLabel: '',
    status: '保持本页可见，等待状态自动更新。',
  }),
  resurrected: Object.freeze({
    phase: 'resurrected',
    kicker: '测试失败 · 第 3 步',
    title: '残留依赖让旧代码“诈尸”了',
    description: '先录下失败画面，再回到 Kiro，让 Bugfix Spec 修复仍在调用旧模块的代码。',
    promptKey: 'fix',
    buttonLabel: '复制修复指令',
    status: '先保留诈尸证据，再交给 Kiro 修复。',
  }),
  resting: Object.freeze({
    phase: 'resting',
    kicker: '验证通过 · 演示完成',
    title: '同一块墓碑已经安息',
    description: 'Kiro 完成最小修复，健康测试通过。用这幅画面收尾即可。',
    promptKey: null,
    buttonLabel: '',
    status: '删除不是完成，验证通过才是完成。',
  }),
});

export function getDemoDirector({ mode, state = 'pending', hasGrave = false, localReplay = false }) {
  if (localReplay) return DIRECTOR_PHASES.local;
  if (mode !== 'live') return DIRECTOR_PHASES.replay;
  if (!hasGrave) return DIRECTOR_PHASES.ready;
  if (state === 'resurrected') return DIRECTOR_PHASES.resurrected;
  if (state === 'resting') return DIRECTOR_PHASES.resting;
  return DIRECTOR_PHASES.pending;
}

export function completedRitualSteps(state, hasGrave) {
  if (!hasGrave) return 0;
  if (state === 'resting') return 3;
  if (state === 'resurrected') return 2;
  return 1;
}
