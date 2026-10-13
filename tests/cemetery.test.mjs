import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAssessment,
  createGrave,
  createReplaySnapshot,
  parseDeletedPaths,
  recordAssessment,
  settleActiveGrave,
  upsertGraves,
  validateCemeteryDocument,
} from '../scripts/cemetery.mjs';

test('parseDeletedPaths accepts only safe demo modules', () => {
  const output = [
    'D\tdemo-src/legacy-ghost.mjs',
    'D\tdemo-src/not-supported.js',
    'D\tsrc/production.mjs',
    'D\t../outside.mjs',
    'M\tdemo-src/still-alive.mjs',
  ].join('\n');

  assert.deepEqual(parseDeletedPaths(output), ['demo-src/legacy-ghost.mjs']);
});

test('createGrave stores metadata but never source code', () => {
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'export const secret = "must-not-leak";\n',
    firstCommitAt: '2024-12-16T00:00:00.000Z',
    deletedAt: '2026-10-12T00:00:00.000Z',
    commitCount: 13,
  });

  assert.equal(grave.fileName, 'legacy-ghost.mjs');
  assert.equal(grave.lineCount, 1);
  assert.equal(grave.ageDays, 665);
  assert.equal(grave.state, 'pending');
  assert.equal(JSON.stringify(grave).includes('must-not-leak'), false);
});

test('assessment and grave share a deterministic revision-and-target identity', () => {
  const assessment = createAssessment({
    targetPath: 'demo-src/legacy-ghost.mjs',
    revision: 'same-head',
    assessedAt: '2026-10-12T00:00:00.000Z',
    tracked: true,
    workspaceClean: true,
    baselinePassed: true,
    dependentCount: 1,
  });
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    revision: 'same-head',
    deletedAt: '2026-10-12T00:00:01.000Z',
  });

  assert.equal(assessment.id, grave.id);
  assert.equal(assessment.risk, 'high');
  assert.deepEqual(Object.keys(assessment), [
    'id', 'agentId', 'targetPath', 'assessedAt', 'tracked', 'workspaceClean', 'baselinePassed', 'dependentCount', 'risk',
  ]);
});

test('assessment risk follows repository facts', () => {
  const base = {
    targetPath: 'demo-src/legacy-ghost.mjs',
    revision: 'head',
    assessedAt: '2026-10-12T00:00:00.000Z',
    tracked: true,
    workspaceClean: true,
    baselinePassed: true,
    dependentCount: 0,
  };

  assert.equal(createAssessment(base).risk, 'low');
  assert.equal(createAssessment({ ...base, dependentCount: 1 }).risk, 'high');
  assert.equal(createAssessment({ ...base, tracked: false }).risk, 'blocked');
  assert.equal(createAssessment({ ...base, workspaceClean: false }).risk, 'blocked');
  assert.equal(createAssessment({ ...base, baselinePassed: false }).risk, 'blocked');
});

test('recordAssessment is immutable, refreshes evidence time, and replaces replay graves once', () => {
  const original = {
    version: 2,
    mode: 'replay',
    activeId: 'demo-grave',
    updatedAt: '2026-10-11T00:00:00.000Z',
    assessment: replayAssessment(),
    graves: [{
      ...createGrave({
        filePath: 'demo-src/legacy-ghost.mjs',
        source: 'one line',
        revision: 'replay',
        deletedAt: '2026-10-11T00:00:00.000Z',
      }),
      id: 'demo-grave',
    }],
  };
  const assessment = createAssessment({
    targetPath: 'demo-src/legacy-ghost.mjs',
    revision: 'live-head',
    assessedAt: '2026-10-12T00:00:00.000Z',
    tracked: true,
    workspaceClean: true,
    baselinePassed: true,
    dependentCount: 1,
  });

  const first = recordAssessment(original, assessment);
  const repeated = recordAssessment(first, { ...assessment, assessedAt: '2026-10-12T00:00:01.000Z' });
  const liveGrave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    revision: 'live-head',
    deletedAt: '2026-10-12T00:00:02.000Z',
  });
  const live = { ...first, activeId: liveGrave.id, graves: [liveGrave] };
  const reassessed = recordAssessment(live, createAssessment({
    targetPath: 'demo-src/legacy-ghost.mjs',
    revision: 'live-head',
    assessedAt: '2026-10-12T00:00:03.000Z',
    tracked: true,
    workspaceClean: true,
    baselinePassed: true,
    dependentCount: 0,
  }));

  assert.equal(original.mode, 'replay');
  assert.equal(original.graves.length, 1);
  assert.equal(first.mode, 'live');
  assert.equal(first.activeId, null);
  assert.deepEqual(first.graves, []);
  assert.equal(first.assessment, assessment);
  assert.notEqual(repeated, first);
  assert.equal(repeated.assessment.id, first.assessment.id);
  assert.equal(repeated.assessment.assessedAt, '2026-10-12T00:00:01.000Z');
  assert.equal(repeated.updatedAt, repeated.assessment.assessedAt);
  assert.equal(reassessed.graves, live.graves);
  assert.equal(reassessed.activeId, live.activeId);
  assert.equal(reassessed.assessment.risk, 'low');
});

test('upsertGraves is immutable and does not duplicate a grave', () => {
  const original = emptyDocument();
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    deletedAt: '2026-10-12T00:00:00.000Z',
    commitCount: 1,
  });

  const first = upsertGraves(original, [grave], '2026-10-12T00:00:01.000Z');
  const second = upsertGraves(first, [{ ...grave, commitCount: 2 }], '2026-10-12T00:00:02.000Z');

  assert.equal(original.graves.length, 0);
  assert.equal(second.graves.length, 1);
  assert.equal(second, first);
  assert.equal(second.graves[0].commitCount, 1);
  assert.equal(second.activeId, grave.id);
  assert.equal(second.mode, 'live');
});

test('the first live burial replaces replay-only graves', () => {
  const liveGrave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    revision: 'live-revision',
    deletedAt: '2026-10-12T00:00:00.000Z',
  });
  const replay = {
    version: 2,
    mode: 'replay',
    activeId: 'demo-grave',
    updatedAt: null,
    assessment: replayAssessment(),
    graves: [{ ...liveGrave, id: 'demo-grave', state: 'resurrected' }],
  };

  const result = upsertGraves(replay, [liveGrave], '2026-10-12T00:00:01.000Z');

  assert.equal(result.mode, 'live');
  assert.equal(result.graves.length, 1);
  assert.equal(result.graves[0].id, liveGrave.id);
  assert.equal(result.graves[0].state, 'pending');
  assert.equal(result.assessment, null);
});

test('settleActiveGrave maps health results to resurrection or rest', () => {
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    deletedAt: '2026-10-12T00:00:00.000Z',
    commitCount: 1,
  });
  const document = upsertGraves(
    { ...emptyDocument(), mode: 'live' },
    [grave],
    '2026-10-12T00:00:01.000Z',
  );

  const haunted = settleActiveGrave(document, { passed: false, failed: 1, durationMs: 21 }, '2026-10-12T00:00:02.000Z');
  const resting = settleActiveGrave(haunted, { passed: true, failed: 0, durationMs: 12 }, '2026-10-12T00:00:03.000Z');
  const replay = { ...haunted, mode: 'replay' };

  assert.equal(haunted.graves[0].state, 'resurrected');
  assert.equal(resting.graves[0].state, 'resting');
  assert.deepEqual(resting.graves[0].test, { passed: true, failed: 0, durationMs: 12 });
  assert.equal(settleActiveGrave(replay, { passed: true }), replay);
});

test('cemetery validation rejects publishable privacy leaks', () => {
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    deletedAt: '2026-10-12T00:00:00.000Z',
  });
  const valid = upsertGraves(emptyDocument(), [grave], '2026-10-12T00:00:01.000Z');

  assert.equal(validateCemeteryDocument(valid), valid);
  assert.throws(() => validateCemeteryDocument({ ...valid, token: 'secret' }), /Unexpected cemetery field/);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), reasoning: 'raw agent reasoning' },
  }), /Unexpected assessment field/);
  for (const field of ['source', 'output', 'dependentPaths']) {
    assert.throws(() => validateCemeteryDocument({
      ...valid,
      assessment: { ...replayAssessment(), [field]: ['private'] },
    }), /Unexpected assessment field/);
  }
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), risk: 'low' },
  }), /assessment risk/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), agentId: 'another-agent' },
  }), /assessment agent/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), dependentCount: -1 },
  }), /dependent count/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), assessedAt: '0' },
  }), /assessment identity/i);
  assert.throws(() => validateCemeteryDocument({ ...valid, updatedAt: '0' }), /update time/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    assessment: { ...replayAssessment(), targetPath: 'demo-src/another.mjs' },
  }), /approved assessment target/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    graves: [{ ...grave, rawSource: 'secret' }],
  }), /Unexpected grave field/);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    graves: [{ ...grave, deletedAt: '0' }],
  }), /grave identity/i);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    graves: [{ ...grave, filePath: 'C:\\Users\\someone\\secret.mjs' }],
  }), /Refusing path outside/);
});

test('public snapshots are replay-only without mutating live data', () => {
  const live = { ...emptyDocument(), mode: 'live', assessment: replayAssessment() };
  const snapshot = createReplaySnapshot(live);

  assert.equal(snapshot.mode, 'replay');
  assert.equal(snapshot.assessment, live.assessment);
  assert.equal(live.mode, 'live');
});

function emptyDocument() {
  return { version: 2, mode: 'replay', activeId: null, updatedAt: null, assessment: null, graves: [] };
}

function replayAssessment() {
  return {
    id: 'demo-assessment',
    agentId: 'code-undertaker',
    targetPath: 'demo-src/legacy-ghost.mjs',
    assessedAt: '2026-10-11T00:00:00.000Z',
    tracked: true,
    workspaceClean: true,
    baselinePassed: true,
    dependentCount: 1,
    risk: 'high',
  };
}
