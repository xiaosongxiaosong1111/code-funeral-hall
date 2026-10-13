import { completedRitualSteps, getDemoDirector } from './demo-director.mjs';

const STATE_COPY = Object.freeze({
  pending: {
    label: '等待 Hook 验证',
    epitaph: '墓碑尚未落款。',
    status: 'Hook 正在运行健康测试，删除结果尚未裁定。',
  },
  resurrected: {
    label: '测试失败 · 已诈尸',
    epitaph: '有些依赖，只有失去后才会开口。',
    status: '健康测试失败。仍有代码依赖这个已删除模块。',
  },
  resting: {
    label: '测试通过 · 已安息',
    epitaph: '它删得干净，世界仍能运行。',
    status: '健康测试通过。旧代码已安全退役。',
  },
});

const KIRO_PROMPTS = Object.freeze({
  assess: '请先在 Kiro Agent Picker 选择 Code Undertaker，运行 npm run funeral:assess -- demo-src/legacy-ghost.mjs。读取 Steering、Undertaker Skill、Git 状态和基线测试，报告 tracked、workspaceClean、baselinePassed、dependentCount 与 risk。只报告，不删除、不修复；报告完成后等待我明确批准。',
  delete: '我已审阅 Code Undertaker 的 assessment，并明确批准退役。请在 Kiro 的 code-funeral-hall Feature Spec 中执行任务 7.2，由 Spec 任务入口执行；不要在普通聊天中直接删除，确保任务完成后形成 PostTaskExec 证据链。只删除 demo-src/legacy-ghost.mjs；不要修改 active-consumer.mjs，不要提前修复测试。',
  fix: "删除 demo-src/legacy-ghost.mjs 后，demo-src/active-consumer.mjs 仍导入该模块，导致健康测试失败。请让 Code Undertaker 诊断根因并生成最小 Bugfix Spec；不得恢复 legacy-ghost.mjs，不得改变 memorialMessage('旧接口') 返回 '旧接口 已归档' 的公开行为，也不得修改墓园 JSON 伪造通过。",
});

const COPY_STATUS = Object.freeze({
  assess: '尸检指令已复制：先在 Kiro Agent Picker 选择 Code Undertaker，报告后不要批准删除。',
  delete: '受控删除指令已复制：切回 Kiro，从 Feature Spec 任务 7.2 入口执行。',
  fix: '修复指令已复制：请在出现“已诈尸”后再交给 Code Undertaker。',
});

const elements = {
  body: document.body,
  scene: document.querySelector('#grave-scene'),
  modeChip: document.querySelector('#mode-chip'),
  modeLabel: document.querySelector('#mode-label'),
  updatedAt: document.querySelector('#updated-at'),
  stateBadge: document.querySelector('#state-badge'),
  graveName: document.querySelector('#grave-name'),
  gravePath: document.querySelector('#grave-path'),
  ageDays: document.querySelector('#age-days'),
  commitCount: document.querySelector('#commit-count'),
  lineCount: document.querySelector('#line-count'),
  epitaph: document.querySelector('#epitaph'),
  testStatus: document.querySelector('#test-status'),
  registryCount: document.querySelector('#registry-count'),
  graveList: document.querySelector('#grave-list'),
  replayButton: document.querySelector('#replay-button'),
  replayNote: document.querySelector('#replay-note'),
  directorCard: document.querySelector('#director-card'),
  directorKicker: document.querySelector('#director-kicker'),
  directorTitle: document.querySelector('#director-action-title'),
  directorCopy: document.querySelector('#director-action-copy'),
  directorButton: document.querySelector('#director-action-button'),
  copyStatus: document.querySelector('#copy-status'),
  agentConsole: document.querySelector('#agent-console'),
  evidenceAgent: document.querySelector('#evidence-agent'),
  evidenceTarget: document.querySelector('#evidence-target'),
  evidenceGit: document.querySelector('#evidence-git'),
  evidenceBaseline: document.querySelector('#evidence-baseline'),
  evidenceDependents: document.querySelector('#evidence-dependents'),
  evidenceRisk: document.querySelector('#evidence-risk'),
  evidenceStage: document.querySelector('#evidence-stage'),
  promptButtons: [...document.querySelectorAll('.prompt-button')],
  ritualSteps: [...document.querySelectorAll('.ritual-steps li')],
};

const validStates = new Set(Object.keys(STATE_COPY));
const validRisks = new Set(['low', 'high', 'blocked']);
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

let latestDocument = null;
let replayActive = false;
let polling = false;
let replayTimers = [];

function safeText(value, fallback = '', maxLength = 180) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function safeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

function safeBoolean(value) {
  return typeof value === 'boolean' ? value : null;
}

function normalizeAssessment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const risk = safeText(value.risk, 'blocked', 16);
  return {
    id: safeText(value.id, 'unknown-assessment', 100),
    agentId: safeText(value.agentId, 'unknown-agent', 100),
    targetPath: safeText(value.targetPath, '未知目标'),
    assessedAt: safeText(value.assessedAt, ''),
    tracked: safeBoolean(value.tracked),
    workspaceClean: safeBoolean(value.workspaceClean),
    baselinePassed: safeBoolean(value.baselinePassed),
    dependentCount: safeCount(value.dependentCount),
    risk: validRisks.has(risk) ? risk : 'blocked',
  };
}

function normalizeTest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  return {
    passed: typeof value.passed === 'boolean' ? value.passed : safeCount(value.passed),
    failed: safeCount(value.failed),
    durationMs: safeCount(value.durationMs),
  };
}

function normalizeGrave(value, index) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const filePath = safeText(value.filePath ?? value.path, '未知路径');
  const fallbackName = filePath.split(/[\\/]/).filter(Boolean).at(-1) || `无名模块 ${index + 1}`;
  const stateCandidate = safeText(value.state ?? value.status, 'pending', 24);

  return {
    id: safeText(value.id, `${filePath}-${index}`),
    filePath,
    fileName: safeText(value.fileName ?? value.name, fallbackName, 100),
    state: validStates.has(stateCandidate) ? stateCandidate : 'pending',
    ageDays: safeCount(value.ageDays),
    commitCount: safeCount(value.commitCount),
    lineCount: safeCount(value.lineCount),
    deletedAt: safeText(value.deletedAt, ''),
    test: normalizeTest(value.test),
  };
}

function normalizeDocument(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('墓园数据必须是对象');
  }

  const graves = Array.isArray(value.graves)
    ? value.graves.map(normalizeGrave).filter(Boolean).slice(0, 50)
    : [];

  return {
    mode: value.mode === 'live' ? 'live' : 'replay',
    activeId: safeText(value.activeId, ''),
    updatedAt: safeText(value.updatedAt, ''),
    assessment: normalizeAssessment(value.assessment),
    graves,
  };
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '时间待记录' : dateFormatter.format(date);
}

function formatMetric(value, suffix) {
  return value === null ? '—' : `${value}${suffix}`;
}

function activeGraveOf(documentData) {
  return documentData.graves.find((grave) => grave.id === documentData.activeId)
    ?? documentData.graves[0]
    ?? null;
}

function setMode(mode, updatedAt, localReplay = false, hasAssessment = false, hasGrave = false) {
  let label = '回放数据 · 非实时';
  let modeValue = 'replay';

  if (localReplay) {
    label = '本地演示 · 非实时';
    modeValue = 'local';
  } else if (mode === 'live') {
    label = hasGrave
      ? 'Kiro Hook · 实时'
      : hasAssessment ? 'Kiro Agent · 现场评估' : '本地现场 · 等待 Agent';
    modeValue = 'live';
  }

  elements.modeChip.dataset.mode = modeValue;
  elements.modeLabel.textContent = label;
  elements.updatedAt.textContent = updatedAt
    ? `墓园更新于 ${formatDate(updatedAt)}`
    : '等待第一条 Kiro 事件';
}

async function copyKiroPrompt(button) {
  const prompt = KIRO_PROMPTS[button.dataset.prompt];
  if (!prompt) return;

  try {
    await navigator.clipboard.writeText(prompt);
    elements.copyStatus.textContent = COPY_STATUS[button.dataset.prompt];
  } catch {
    elements.copyStatus.textContent = `浏览器未允许复制，请手动选择这段指令：${prompt}`;
  }
}

function setState(state) {
  const copy = STATE_COPY[state];
  elements.body.dataset.state = state;
  elements.scene.dataset.state = state;
  elements.stateBadge.dataset.state = state;
  elements.stateBadge.textContent = copy.label;
}

function renderDirector(documentData, activeGrave, options = {}) {
  const director = getDemoDirector({
    mode: documentData.mode,
    state: activeGrave?.state,
    risk: documentData.assessment?.risk,
    hasAssessment: Boolean(documentData.assessment),
    hasGrave: Boolean(activeGrave),
    localReplay: options.localReplay === true,
  });
  const previousPhase = elements.directorCard.dataset.phase;

  elements.directorCard.dataset.phase = director.phase;
  elements.directorKicker.textContent = director.kicker;
  elements.directorTitle.textContent = director.title;
  elements.directorCopy.textContent = director.description;

  if (director.promptKey) {
    elements.directorButton.hidden = false;
    elements.directorButton.dataset.prompt = director.promptKey;
    elements.directorButton.textContent = director.buttonLabel;
  } else {
    elements.directorButton.hidden = true;
    delete elements.directorButton.dataset.prompt;
  }

  if (previousPhase !== director.phase) {
    elements.copyStatus.textContent = director.status;
  }

  const reachedStep = completedRitualSteps(
    activeGrave?.state,
    Boolean(activeGrave),
    Boolean(documentData.assessment),
  );
  elements.ritualSteps.forEach((step, index) => {
    step.dataset.progress = index < reachedStep
      ? 'done'
      : index === reachedStep && reachedStep < elements.ritualSteps.length
        ? 'active'
        : 'waiting';
  });
}

function assessmentStage(assessment, grave) {
  if (!assessment) return '选择 Agent 并先尸检';
  if (assessment.risk === 'blocked') return '阻塞 · 禁止删除';
  if (!grave) return '风险已评估 · 等待用户批准';
  if (grave.state === 'resurrected') return 'Agent 诊断 · 生成 Bugfix Spec';
  if (grave.state === 'resting') return '验证通过 · 安全退役';
  return 'Hook 裁决中';
}

function renderEvidence(assessment, grave) {
  if (!assessment) {
    elements.evidenceAgent.textContent = '等待在 Kiro 中选择';
    elements.evidenceTarget.textContent = '等待尸检目标';
    elements.evidenceGit.textContent = '尚未检查';
    elements.evidenceBaseline.textContent = '尚未运行';
    elements.evidenceDependents.textContent = '—';
    elements.evidenceRisk.textContent = '等待评估';
    elements.evidenceRisk.dataset.risk = 'waiting';
    elements.evidenceStage.textContent = assessmentStage(null, grave);
    elements.agentConsole.dataset.stage = 'assess';
    return;
  }

  const agentName = assessment.agentId === 'code-undertaker'
    ? 'Code Undertaker'
    : assessment.agentId;
  const tracked = assessment.tracked === null
    ? '跟踪状态未知'
    : assessment.tracked ? '目标已被 Git 跟踪' : '目标未被 Git 跟踪';
  const workspace = assessment.workspaceClean === null
    ? '工作区状态未知'
    : assessment.workspaceClean ? '工作区干净' : '存在未提交改动';
  const riskLabels = {
    low: 'LOW · 可审查',
    high: 'HIGH · 需人工批准',
    blocked: 'BLOCKED · 禁止删除',
  };

  elements.evidenceAgent.textContent = assessment.assessedAt
    ? `${agentName} · ${formatDate(assessment.assessedAt)}`
    : agentName;
  elements.evidenceTarget.textContent = assessment.targetPath;
  elements.evidenceGit.textContent = `${tracked} · ${workspace}`;
  elements.evidenceBaseline.textContent = assessment.baselinePassed === null
    ? '结果未知'
    : assessment.baselinePassed ? '健康测试通过' : '基线测试失败';
  elements.evidenceDependents.textContent = assessment.dependentCount === null
    ? '未知'
    : `${assessment.dependentCount} 个调用者`;
  const stage = assessmentStage(assessment, grave);
  elements.evidenceRisk.textContent = riskLabels[assessment.risk];
  elements.evidenceRisk.dataset.risk = assessment.risk;
  elements.evidenceStage.textContent = stage;
  elements.agentConsole.dataset.stage = assessment.risk === 'blocked'
    ? 'blocked'
    : grave?.state ?? 'approval';
}

function testStatusFor(grave) {
  if (grave.state === 'resurrected' && Number.isFinite(grave.test?.failed)) {
    return `${grave.test.failed} 项健康测试失败。仍有代码依赖这个已删除模块。`;
  }

  if (grave.state === 'resting' && Number.isFinite(grave.test?.durationMs)) {
    return `健康测试通过，用时 ${grave.test.durationMs} ms。旧代码已安全退役。`;
  }

  return STATE_COPY[grave.state].status;
}

function renderActiveGrave(grave) {
  setState(grave.state);
  elements.graveName.textContent = grave.fileName;
  elements.gravePath.textContent = grave.filePath;
  elements.ageDays.textContent = formatMetric(grave.ageDays, '天');
  elements.commitCount.textContent = formatMetric(grave.commitCount, '次');
  elements.lineCount.textContent = formatMetric(grave.lineCount, '行');
  elements.epitaph.textContent = STATE_COPY[grave.state].epitaph;
  elements.testStatus.textContent = testStatusFor(grave);
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderRegistry(graves) {
  elements.registryCount.textContent = `${graves.length} 座`;
  elements.graveList.replaceChildren();

  if (graves.length === 0) {
    const empty = makeElement('li', 'grave-list__empty');
    const symbol = makeElement('span', '', '＋');
    symbol.setAttribute('aria-hidden', 'true');
    empty.append(symbol, makeElement('p', '', '名册仍是空的。下一次由 Kiro 完成的删除会在这里立碑。'));
    elements.graveList.append(empty);
    return;
  }

  [...graves]
    .sort((left, right) => (Date.parse(right.deletedAt) || 0) - (Date.parse(left.deletedAt) || 0))
    .slice(0, 5)
    .forEach((grave, index) => {
      const item = makeElement('li', 'grave-list__item');
      const order = makeElement('span', 'grave-list__order', String(index + 1).padStart(2, '0'));
      const body = makeElement('div', 'grave-list__body');
      const name = makeElement('p', 'grave-list__name', grave.fileName);
      const path = makeElement('p', 'grave-list__path', grave.filePath);
      const meta = makeElement(
        'p',
        'grave-list__meta',
        `${formatDate(grave.deletedAt)} · ${formatMetric(grave.lineCount, ' 行')}`,
      );
      const badge = makeElement('span', 'mini-state', STATE_COPY[grave.state].label);
      badge.dataset.state = grave.state;
      body.append(name, path, meta);
      item.append(order, body, badge);
      elements.graveList.append(item);
    });
}

function renderDocument(documentData, options = {}) {
  const activeGrave = activeGraveOf(documentData);
  setMode(
    documentData.mode,
    documentData.updatedAt,
    options.localReplay === true,
    Boolean(documentData.assessment),
    Boolean(activeGrave),
  );
  renderRegistry(documentData.graves);
  renderEvidence(documentData.assessment, activeGrave);
  renderDirector(documentData, activeGrave, options);
  if (!activeGrave) {
    setState('pending');
    elements.graveName.textContent = '尚无逝者';
    elements.gravePath.textContent = '等待 Kiro 删除演示模块';
    elements.ageDays.textContent = '—';
    elements.commitCount.textContent = '—';
    elements.lineCount.textContent = '—';
    elements.epitaph.textContent = STATE_COPY.pending.epitaph;
    elements.testStatus.textContent = '正在等待第一条删除事件。';
    return;
  }

  renderActiveGrave(activeGrave);
}

function setConnectionFailure() {
  if (replayActive) return;
  elements.modeChip.dataset.mode = 'waiting';
  if (latestDocument) {
    elements.modeLabel.textContent = '连接中断 · 显示缓存';
    elements.updatedAt.textContent = latestDocument.updatedAt
      ? `上次更新于 ${formatDate(latestDocument.updatedAt)}`
      : '正在自动重试';
    return;
  }

  elements.modeLabel.textContent = '等待本地数据';
  elements.updatedAt.textContent = '启动 npm run dev 后将自动重试';
}

async function pollCemetery() {
  if (polling || document.visibilityState === 'hidden') return;
  polling = true;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch('./data/cemetery.json', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.text();
    if (payload.length > 131_072) throw new Error('墓园数据过大');

    latestDocument = normalizeDocument(JSON.parse(payload));
    if (!replayActive) renderDocument(latestDocument);
  } catch {
    setConnectionFailure();
  } finally {
    window.clearTimeout(timeout);
    polling = false;
  }
}

function replayDocument(state) {
  const sourceGrave = latestDocument ? activeGraveOf(latestDocument) : null;
  const baseGrave = sourceGrave ?? {
    id: 'local-replay-grave',
    filePath: 'demo-src/legacy-ghost.mjs',
    fileName: 'legacy-ghost.mjs',
    ageDays: 666,
    commitCount: 13,
    lineCount: 48,
    deletedAt: new Date().toISOString(),
  };
  const test = state === 'pending'
    ? null
    : state === 'resurrected'
      ? { passed: false, failed: 1, durationMs: 824 }
      : { passed: true, failed: 0, durationMs: 612 };
  const grave = { ...baseGrave, id: 'local-replay-grave', state, test };

  return {
    version: 2,
    mode: 'replay',
    activeId: grave.id,
    updatedAt: new Date().toISOString(),
    assessment: {
      id: 'local-replay-assessment',
      agentId: 'code-undertaker',
      targetPath: 'demo-src/legacy-ghost.mjs',
      assessedAt: new Date().toISOString(),
      tracked: true,
      workspaceClean: true,
      baselinePassed: true,
      dependentCount: 1,
      risk: 'high',
    },
    graves: [grave],
  };
}

function clearReplayTimers() {
  replayTimers.forEach(window.clearTimeout);
  replayTimers = [];
}

function exitReplay() {
  clearReplayTimers();
  replayActive = false;
  elements.replayButton.setAttribute('aria-pressed', 'false');
  elements.replayButton.textContent = '播放本地回放（非实时）';
  elements.replayNote.textContent = '只在浏览器中演示尸检和三种裁决状态，不会修改真实墓园数据。';
  renderDocument(latestDocument ?? { mode: 'replay', activeId: '', updatedAt: '', assessment: null, graves: [] });
  pollCemetery();
}

function startReplay() {
  clearReplayTimers();
  replayActive = true;
  elements.replayButton.setAttribute('aria-pressed', 'true');
  elements.replayButton.textContent = '退出本地回放';
  elements.replayNote.textContent = '本地演示回放正在播放；此画面不是实时 Hook 结果。';

  const renderReplay = (state) => renderDocument(replayDocument(state), { localReplay: true });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderReplay('resting');
    return;
  }

  renderReplay('pending');
  replayTimers.push(window.setTimeout(() => renderReplay('resurrected'), 2200));
  replayTimers.push(window.setTimeout(() => renderReplay('resting'), 5600));
}

elements.replayButton.addEventListener('click', () => {
  if (replayActive) exitReplay();
  else startReplay();
});

elements.promptButtons.forEach((button) => {
  button.addEventListener('click', () => copyKiroPrompt(button));
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pollCemetery();
});

renderDocument({ mode: 'replay', activeId: '', updatedAt: '', assessment: null, graves: [] });
pollCemetery();
window.setInterval(pollCemetery, 2000);
