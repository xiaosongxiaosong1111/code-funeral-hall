import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGrave,
  createReplaySnapshot,
  parseDeletedPaths,
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

test('upsertGraves is immutable and does not duplicate a grave', () => {
  const original = { version: 1, mode: 'replay', activeId: null, updatedAt: null, graves: [] };
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
  assert.equal(second.graves[0].commitCount, 2);
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
    version: 1,
    mode: 'replay',
    activeId: 'demo-grave',
    updatedAt: null,
    graves: [{ ...liveGrave, id: 'demo-grave', state: 'resurrected' }],
  };

  const result = upsertGraves(replay, [liveGrave], '2026-10-12T00:00:01.000Z');

  assert.equal(result.mode, 'live');
  assert.equal(result.graves.length, 1);
  assert.equal(result.graves[0].id, liveGrave.id);
  assert.equal(result.graves[0].state, 'pending');
});

test('settleActiveGrave maps health results to resurrection or rest', () => {
  const grave = createGrave({
    filePath: 'demo-src/legacy-ghost.mjs',
    source: 'one line',
    deletedAt: '2026-10-12T00:00:00.000Z',
    commitCount: 1,
  });
  const document = upsertGraves(
    { version: 1, mode: 'live', activeId: null, updatedAt: null, graves: [] },
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
    graves: [{ ...grave, rawSource: 'secret' }],
  }), /Unexpected grave field/);
  assert.throws(() => validateCemeteryDocument({
    ...valid,
    graves: [{ ...grave, filePath: 'C:\\Users\\someone\\secret.mjs' }],
  }), /Refusing path outside/);
});

test('public snapshots are replay-only without mutating live data', () => {
  const live = { ...emptyDocument(), mode: 'live' };
  const snapshot = createReplaySnapshot(live);

  assert.equal(snapshot.mode, 'replay');
  assert.equal(live.mode, 'live');
});

function emptyDocument() {
  return { version: 1, mode: 'replay', activeId: null, updatedAt: null, graves: [] };
}
