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

function runFailure(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: testEnvironment,
    timeout: 20_000,
    windowsHide: true,
  });
  assert.notEqual(result.status, 0, result.stdout);
  return `${result.stdout}\n${result.stderr}`;
}

async function cemetery(root) {
  return JSON.parse(await readFile(path.join(root, 'data', 'cemetery.json'), 'utf8'));
}

async function writeCemetery(root, document) {
  await writeFile(
    path.join(root, 'data', 'cemetery.json'),
    `${JSON.stringify(document, null, 2)}\n`,
    'utf8',
  );
}

test('undertaker completes the staged-delete funeral without publishing live mode', { timeout: 60_000 }, async (context) => {
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
  await mkdir(path.join(root, '.kiro', 'specs', 'code-funeral-hall'), { recursive: true });
  await writeFile(
    path.join(root, '.kiro', 'specs', 'code-funeral-hall', 'tasks.md'),
    '- [ ] 7.2 Retire the approved module\n',
    'utf8',
  );
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
  run(root, 'git', ['-c', 'commit.gpgSign=false', 'commit', '-m', 'test: baseline']);
  const replaySeed = await cemetery(root);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  assert.deepEqual(await cemetery(root), replaySeed);

  run(root, 'git', ['rm', '--', 'demo-src/active-consumer.mjs']);
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /unapproved deleted module/i,
  );
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'settle']),
    /unapproved deleted module/i,
  );
  run(root, 'git', ['restore', '--source=HEAD', '--staged', '--worktree', '--', 'demo-src/active-consumer.mjs']);

  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'assess', 'demo-src/active-consumer.mjs']),
    /approved target/i,
  );

  run(root, 'git', ['rm', '--cached', '--', 'demo-src/legacy-ghost.mjs']);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'assess']);
  const untracked = await cemetery(root);
  assert.equal(untracked.assessment.tracked, false);
  assert.equal(untracked.assessment.risk, 'blocked');
  run(root, 'git', ['add', '--', 'demo-src/legacy-ghost.mjs']);

  const consumerPath = path.join(root, 'demo-src', 'active-consumer.mjs');
  const consumerSource = await readFile(consumerPath, 'utf8');
  await writeFile(consumerPath, "export function memorialMessage() { return 'broken'; }\n", 'utf8');
  run(root, process.execPath, ['scripts/undertaker.mjs', 'assess']);
  const failedBaseline = await cemetery(root);
  assert.equal(failedBaseline.assessment.baselinePassed, false);
  assert.equal(failedBaseline.assessment.workspaceClean, false);
  assert.equal(failedBaseline.assessment.risk, 'blocked');
  await writeFile(consumerPath, consumerSource, 'utf8');

  run(root, process.execPath, ['scripts/undertaker.mjs', 'assess']);
  const assessed = await cemetery(root);
  assert.equal(assessed.version, 2);
  assert.equal(assessed.mode, 'live');
  assert.equal(assessed.activeId, null);
  assert.equal(assessed.graves.length, 0);
  assert.equal(assessed.assessment.agentId, 'code-undertaker');
  assert.equal(assessed.assessment.targetPath, 'demo-src/legacy-ghost.mjs');
  assert.equal(assessed.assessment.tracked, true);
  assert.equal(assessed.assessment.workspaceClean, true);
  assert.equal(assessed.assessment.baselinePassed, true);
  assert.equal(assessed.assessment.dependentCount, 1);
  assert.equal(assessed.assessment.risk, 'high');
  assert.equal(JSON.stringify(assessed).includes('formatLegacyMessage'), false);

  run(root, process.execPath, ['scripts/undertaker.mjs', 'assess']);
  const refreshed = await cemetery(root);
  assert.equal(refreshed.assessment.id, assessed.assessment.id);
  assert.notEqual(refreshed.assessment.assessedAt, assessed.assessment.assessedAt);
  assert.equal(refreshed.updatedAt, refreshed.assessment.assessedAt);
  assert.deepEqual(refreshed.graves, assessed.graves);

  run(root, 'git', ['-c', 'commit.gpgSign=false', 'commit', '--allow-empty', '-m', 'test: advance head']);
  run(root, 'git', ['rm', '--', 'demo-src/legacy-ghost.mjs']);
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /assessment is stale/i,
  );
  run(root, 'git', ['restore', '--source=HEAD', '--staged', '--worktree', '--', 'demo-src/legacy-ghost.mjs']);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'assess']);
  const currentAssessment = await cemetery(root);
  assert.notEqual(currentAssessment.assessment.id, refreshed.assessment.id);

  run(root, 'git', ['rm', '--', 'demo-src/legacy-ghost.mjs']);

  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury', 'demo-src/active-consumer.mjs']),
    /approved target/i,
  );

  await writeCemetery(root, { ...currentAssessment, assessment: null });
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /current live assessment is required/i,
  );

  await writeCemetery(root, {
    ...currentAssessment,
    assessment: { ...currentAssessment.assessment, workspaceClean: false, risk: 'blocked' },
  });
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /assessment is blocked/i,
  );

  await writeCemetery(root, {
    ...currentAssessment,
    assessment: { ...currentAssessment.assessment, targetPath: 'demo-src/active-consumer.mjs' },
  });
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /approved assessment target/i,
  );

  await writeCemetery(root, currentAssessment);
  const unrelatedPath = path.join(root, '.kiro', 'unexpected.md');
  await writeFile(unrelatedPath, 'changed after assessment', 'utf8');
  assert.match(
    runFailure(root, process.execPath, ['scripts/undertaker.mjs', 'bury']),
    /unrelated workspace changes/i,
  );
  await rm(unrelatedPath);
  await writeFile(
    path.join(root, '.kiro', 'specs', 'code-funeral-hall', 'tasks.md'),
    '- [x] 7.2 Retire the approved module\n',
    'utf8',
  );

  run(root, process.execPath, ['scripts/undertaker.mjs', 'bury']);
  const firstBurial = await cemetery(root);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'bury']);
  const pending = await cemetery(root);
  assert.deepEqual(pending, firstBurial);
  assert.equal(pending.mode, 'live');
  assert.equal(pending.graves.length, 1);
  assert.equal(pending.graves[0].state, 'pending');
  assert.equal(pending.graves[0].id, pending.assessment.id);

  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  const resurrected = await cemetery(root);
  assert.equal(resurrected.graves[0].state, 'resurrected');
  assert.equal(resurrected.graves[0].test.passed, false);

  run(root, 'git', ['restore', '--source=HEAD', '--staged', '--worktree', '--', 'demo-src/legacy-ghost.mjs']);
  run(root, process.execPath, ['scripts/undertaker.mjs', 'settle']);
  const restored = await cemetery(root);
  assert.equal(restored.graves[0].state, 'resurrected');
  assert.equal(restored.graves[0].test.passed, false);
  run(root, 'git', ['rm', '--', 'demo-src/legacy-ghost.mjs']);

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
  assert.deepEqual(published.assessment, resting.assessment);
});
