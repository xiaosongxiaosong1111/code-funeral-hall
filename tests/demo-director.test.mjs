import assert from 'node:assert/strict';
import test from 'node:test';

import { completedRitualSteps, getDemoDirector } from '../demo-director.mjs';

test('replay data never masquerades as a live Agent or Hook action', () => {
  const replay = getDemoDirector({
    mode: 'replay',
    risk: 'high',
    hasAssessment: true,
    state: 'resurrected',
    hasGrave: true,
  });
  const local = getDemoDirector({
    mode: 'replay',
    risk: 'high',
    hasAssessment: true,
    state: 'resurrected',
    hasGrave: true,
    localReplay: true,
  });

  assert.equal(replay.phase, 'replay');
  assert.equal(replay.promptKey, 'assess');
  assert.match(replay.status, /不能证明/);
  assert.equal(local.phase, 'local');
  assert.equal(local.promptKey, null);
});

test('the director requires a Kiro Agent assessment before deletion', () => {
  const director = getDemoDirector({ mode: 'live', hasAssessment: false, hasGrave: false });

  assert.equal(director.phase, 'assess');
  assert.equal(director.promptKey, 'assess');
  assert.match(director.description, /Agent Picker/);
  assert.match(director.description, /等待.*批准/);
});

test('an assessment unlocks approval and then exposes only the next valid action', () => {
  assert.equal(getDemoDirector({ mode: 'live', risk: 'high', hasAssessment: true }).phase, 'approval');
  assert.equal(getDemoDirector({ mode: 'live', risk: 'high', hasAssessment: true }).promptKey, 'delete');
  assert.equal(getDemoDirector({ mode: 'live', risk: 'high', hasAssessment: true, state: 'pending', hasGrave: true }).promptKey, null);
  assert.equal(getDemoDirector({ mode: 'live', risk: 'high', hasAssessment: true, state: 'resurrected', hasGrave: true }).promptKey, 'fix');
  assert.equal(getDemoDirector({ mode: 'live', risk: 'high', hasAssessment: true, state: 'resting', hasGrave: true }).phase, 'resting');
});

test('a blocked assessment never offers deletion', () => {
  const director = getDemoDirector({
    mode: 'live',
    risk: 'blocked',
    hasAssessment: true,
    hasGrave: false,
  });

  assert.equal(director.phase, 'blocked');
  assert.equal(director.promptKey, null);
  assert.match(director.description, /禁止删除/);
});

test('ritual progress starts at assessment and fully completes at rest', () => {
  assert.equal(completedRitualSteps('pending', false, false), 0);
  assert.equal(completedRitualSteps('pending', false, true), 1);
  assert.equal(completedRitualSteps('pending', true, true), 2);
  assert.equal(completedRitualSteps('resurrected', true, true), 3);
  assert.equal(completedRitualSteps('resting', true, true), 4);
});
