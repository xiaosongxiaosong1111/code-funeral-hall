import assert from 'node:assert/strict';
import test from 'node:test';

import { completedRitualSteps, getDemoDirector } from '../demo-director.mjs';

test('replay data always directs the presenter back to a real Kiro deletion', () => {
  const director = getDemoDirector({
    mode: 'replay',
    state: 'resurrected',
    hasGrave: true,
  });

  assert.equal(director.phase, 'replay');
  assert.equal(director.promptKey, 'delete');
});

test('live states expose only the next valid presenter action', () => {
  assert.equal(getDemoDirector({ mode: 'live', hasGrave: false }).phase, 'ready');
  assert.equal(getDemoDirector({ mode: 'live', state: 'pending', hasGrave: true }).promptKey, null);
  assert.equal(getDemoDirector({ mode: 'live', state: 'resurrected', hasGrave: true }).promptKey, 'fix');
  assert.equal(getDemoDirector({ mode: 'live', state: 'resting', hasGrave: true }).phase, 'resting');
});

test('ritual progress starts before deletion and fully completes at rest', () => {
  assert.equal(completedRitualSteps('pending', false), 0);
  assert.equal(completedRitualSteps('pending', true), 1);
  assert.equal(completedRitualSteps('resurrected', true), 2);
  assert.equal(completedRitualSteps('resting', true), 3);
});
