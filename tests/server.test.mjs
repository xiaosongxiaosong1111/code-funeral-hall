import assert from 'node:assert/strict';
import test from 'node:test';

import { createStaticServer } from '../scripts/serve.mjs';

test('static server exposes only the public site allowlist', async (context) => {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  assert.equal((await fetch(`${baseUrl}/`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/demo-director.mjs`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/data/cemetery.json`)).status, 200);
  assert.equal((await fetch(`${baseUrl}/.kiro/steering/product.md`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/package.json`)).status, 404);
});
