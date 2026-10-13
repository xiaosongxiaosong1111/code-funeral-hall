import { spawnSync } from 'node:child_process';
import { access, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APPROVED_TARGET,
  createAssessment,
  createGrave,
  emptyCemetery,
  normalizeDemoPath,
  parseDeletedPaths,
  recordAssessment,
  settleActiveGrave,
  upsertGraves,
  validateCemeteryDocument,
} from './cemetery.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cemeteryPath = path.join(projectRoot, 'data', 'cemetery.json');
const expectedSpecTasks = '.kiro/specs/code-funeral-hall/tasks.md';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 45_000,
    ...options,
  });
}

function git(args, { allowFailure = false } = {}) {
  const result = run('git', args);
  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed`);
  }
  return result.stdout.trim();
}

async function readCemetery() {
  try {
    return validateCemeteryDocument(JSON.parse(await readFile(cemeteryPath, 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return emptyCemetery();
    throw error;
  }
}

async function writeCemetery(document) {
  validateCemeteryDocument(document);
  const temporaryPath = path.join(path.dirname(cemeteryPath), `.cemetery-${process.pid}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, cemeteryPath);
}

function approvedTarget(candidate = APPROVED_TARGET) {
  const safeCandidate = normalizeDemoPath(candidate);
  if (safeCandidate !== APPROVED_TARGET) throw new Error(`Refusing unapproved target: ${safeCandidate}`);
  return safeCandidate;
}

function workspaceCleanExcept(paths) {
  return git([
    'status', '--porcelain=v1', '--untracked-files=all', '--', '.',
    ...paths.map((filePath) => `:(exclude)${filePath}`),
  ]).length === 0;
}

function deletedPaths(candidate) {
  const target = approvedTarget(candidate);
  const workingTree = git(['diff', '--no-renames', '--name-status', '--diff-filter=D', '--', 'demo-src']);
  const staged = git(['diff', '--cached', '--no-renames', '--name-status', '--diff-filter=D', '--', 'demo-src']);
  const detected = [...new Set(parseDeletedPaths(`${workingTree}\n${staged}`))];
  const unapproved = detected.filter((filePath) => filePath !== APPROVED_TARGET);
  if (unapproved.length > 0) {
    throw new Error(`Refusing unapproved deleted module(s): ${unapproved.join(', ')}`);
  }
  return detected.includes(target) ? [target] : [];
}

async function fileExists(filePath) {
  try {
    await access(path.join(projectRoot, filePath));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(entryPath);
    return entry.isFile() ? [entryPath] : [];
  }));
  return nested.flat();
}

async function countDependents(targetPath) {
  const targetName = path.posix.basename(targetPath);
  const files = await filesBelow(path.join(projectRoot, 'demo-src'));
  const matches = await Promise.all(files
    .filter((filePath) => filePath.endsWith('.mjs'))
    .filter((filePath) => path.relative(projectRoot, filePath).replaceAll('\\', '/') !== targetPath)
    .map(async (filePath) => (await readFile(filePath, 'utf8')).includes(targetName)));
  return matches.filter(Boolean).length;
}

async function assess(candidate) {
  const targetPath = approvedTarget(candidate);
  const revision = git(['rev-parse', 'HEAD']);
  const tracked = run('git', ['ls-files', '--error-unmatch', '--', targetPath]).status === 0;
  const workspaceClean = workspaceCleanExcept(['data/cemetery.json']);
  const baselinePassed = run(process.execPath, ['--test', 'tests/project-health.test.mjs']).status === 0;
  const dependentCount = await countDependents(targetPath);
  const assessment = createAssessment({
    targetPath,
    revision,
    tracked,
    workspaceClean,
    baselinePassed,
    dependentCount,
  });
  const next = recordAssessment(await readCemetery(), assessment);
  await writeCemetery(next);
  console.log(
    `Assessment ${assessment.risk}: tracked=${tracked}, clean=${workspaceClean}, baseline=${baselinePassed}, dependents=${dependentCount}.`,
  );
}

function historyFor(filePath, deletedAt, revision) {
  const source = git(['show', `${revision}:${filePath}`]);
  const history = git(['log', '--follow', '--format=%aI', '--', filePath], { allowFailure: true })
    .split(/\r?\n/)
    .filter(Boolean);
  const commits = git(['log', '--format=%H', '--', filePath], { allowFailure: true })
    .split(/\r?\n/)
    .filter(Boolean);

  return createGrave({
    filePath,
    source,
    revision,
    firstCommitAt: history.at(-1) ?? null,
    deletedAt,
    commitCount: commits.length,
  });
}

async function bury(candidate) {
  const paths = deletedPaths(candidate);
  if (paths.length === 0) {
    console.log('No tracked deletion found under demo-src; no grave was created.');
    return;
  }

  const now = new Date().toISOString();
  const document = await readCemetery();
  const [filePath] = paths;
  if (document.mode !== 'live' || !document.assessment) {
    throw new Error('A current live assessment is required before burial.');
  }
  if (document.assessment.risk === 'blocked') {
    throw new Error('The current assessment is blocked; burial is refused.');
  }
  if (document.assessment.targetPath !== filePath) {
    throw new Error('The current assessment does not match the approved burial target.');
  }
  if (!workspaceCleanExcept(['data/cemetery.json', filePath, expectedSpecTasks])) {
    throw new Error('Unrelated workspace changes invalidate the assessment; burial is refused.');
  }
  const revision = git(['rev-parse', 'HEAD']);
  const expectedId = createGrave({ filePath, source: '', revision, deletedAt: now }).id;
  if (document.assessment.id !== expectedId) {
    throw new Error('The assessment is stale for the current HEAD; run funeral:assess again.');
  }
  const graves = paths.map((deletedPath) => historyFor(deletedPath, now, revision));
  const next = upsertGraves(document, graves, now);
  await writeCemetery(next);
  console.log(`Buried ${graves.length} deleted module(s); awaiting regression tests.`);
}

async function settle() {
  const paths = deletedPaths();
  const document = await readCemetery();
  if (document.mode !== 'live' || !document.activeId) {
    console.log('No live grave is awaiting verification.');
    return;
  }

  const startedAt = Date.now();
  const result = run(process.execPath, ['--test', 'tests/project-health.test.mjs']);
  const targetStillDeleted = paths.includes(APPROVED_TARGET) && !(await fileExists(APPROVED_TARGET));
  const passed = result.status === 0 && targetStillDeleted;
  const next = settleActiveGrave(document, {
    passed,
    failed: passed ? 0 : 1,
    durationMs: Date.now() - startedAt,
  });
  await writeCemetery(next);
  console.log(passed
    ? 'Regression tests passed. The deleted module may rest.'
    : targetStillDeleted
      ? 'Regression tests failed. The deleted module has resurrected.'
      : 'Retirement verification failed. The target module is no longer deleted.');
}

async function main() {
  const [command, candidate] = process.argv.slice(2);
  if (command === 'assess') return assess(candidate);
  if (command === 'bury') return bury(candidate);
  if (command === 'settle') return settle();
  throw new Error('Usage: node scripts/undertaker.mjs <assess [filePath]|bury [filePath]|settle>');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
