import assert from 'node:assert/strict';
import test from 'node:test';

import { memorialMessage } from '../demo-src/active-consumer.mjs';

test('active module still produces its public message', () => {
  assert.equal(memorialMessage('旧接口'), '旧接口 已归档');
});
