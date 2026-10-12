import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT'),
);

function run(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: testEnvironment,
    timeout: 20_000,
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

async function cemetery(root) {
  return JSON.parse(await readFile(path.join(root, 'data', 'cemetery.json'), 'utf8'));
}

test('undertaker completes the staged-delete funeral without publishing live mode', { timeout: 30_000 }, async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'code-funeral-hall-'));
  context.after(() => rm(root, { recursive: true, force: true }));

  for (const directory of ['data', 'scripts']) {
    await cp(path.join(sourceRoot, directory), path.join(root, directory), { recursive: true });
  }
  await cp(
    path.join(sourceRoot, 'tests', 'fixtures', 'demo-src'),
    path.join(root, 'demo-src'),
    { recursive: true },
  );
  await mkdir(path.join(root, 'tests'));
  await cp(path.join(sourceRoot, 'tests', 'project-health.test.mjs'), path.join(root, 'tests', 'project-health.test.mjs'));
  for (const file of ['index.html', 'app.js', 'demo-director.mjs', 'styles.css']) {
    await cp(path.join(sourceRoot, file), path.join(root, file));
  }

  run(root, 'git', ['init', '-b', 'main']);
  run(root, 'git', ['config', 'user.name', 'Funeral Test']);
  run(root, 'git', ['config', 'user.email', 'test@local.invalid']);
  run(root, 'git', ['config', 'commit.gpgsign', 'false']);
  run(root, 'git', ['config', 'core.hooksPath', '.git/hooks']);
  run(root, 'git', ['add', '--all']);
  run(root, 'git', ['-c', 'commit.gpgSign=false', 'commit', '--no-verify', '-m', 'test: baseline']);
  const replaySeed = await cemetery(root);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  assert.deepEqual(await cemetery(root), replaySeed);
  run(root, 'git', ['rm', '--', 'demo-src/legacy-ghost.mjs']);

  run(root, process.execPath, ['scripts/undertaker.mjs', 'bury']);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'bury']);
  const pending = await cemetery(root);
  assert.equal(pending.mode, 'live');
  assert.equal(pending.graves.length, 1);
  assert.equal(pending.graves[0].state, 'pending');

  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  const resurrected = await cemetery(root);
  assert.equal(resurrected.graves[0].state, 'resurrected');
  assert.equal(resurrected.graves[0].test.passed, false);

  await writeFile(
    path.join(root, 'demo-src', 'active-consumer.mjs'),
    "export function memorialMessage(name) {\n  return `${name} 已归档`;\n}\n",
    'utf8',
  );
  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  const resting = await cemetery(root);
  assert.equal(resting.graves[0].state, 'resting');
  assert.equal(resting.graves[0].test.passed, true);
  assert.equal(JSON.stringify(resting).includes('source'), false);

  run(root, process.execPath, ['scripts/build.mjs']);
  const published = JSON.parse(await readFile(path.join(root, 'dist', 'data', 'cemetery.json'), 'utf8'));
  assert.equal((await cemetery(root)).mode, 'live');
  assert.equal(published.mode, 'replay');
});
