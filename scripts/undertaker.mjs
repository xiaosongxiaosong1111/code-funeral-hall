import { spawnSync } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createGrave,
  emptyCemetery,
  normalizeDemoPath,
  parseDeletedPaths,
  settleActiveGrave,
  upsertGraves,
  validateCemeteryDocument,
} from './cemetery.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cemeteryPath = path.join(projectRoot, 'data', 'cemetery.json');

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
  const temporaryPath = path.join(path.dirname(cemeteryPath), `.cemetery-${process.pid}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, cemeteryPath);
}

function deletedPaths(candidate) {
  const workingTree = git(['diff', '--name-status', '--diff-filter=D', '--', 'demo-src']);
  const staged = git(['diff', '--cached', '--name-status', '--diff-filter=D', '--', 'demo-src']);
  const detected = [...new Set(parseDeletedPaths(`${workingTree}\n${staged}`))];
  if (!candidate) return detected;

  const safeCandidate = normalizeDemoPath(candidate);
  return detected.includes(safeCandidate) ? [safeCandidate] : [];
}

function historyFor(filePath, deletedAt) {
  const revision = git(['rev-parse', 'HEAD']);
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
  const graves = paths.map((filePath) => historyFor(filePath, now));
  const next = upsertGraves(await readCemetery(), graves, now);
  await writeCemetery(next);
  console.log(`Buried ${graves.length} deleted module(s); awaiting regression tests.`);
}

async function settle() {
  const document = await readCemetery();
  if (document.mode !== 'live' || !document.activeId) {
    console.log('No live grave is awaiting verification.');
    return;
  }

  const startedAt = Date.now();
  const result = run(process.execPath, ['--test', 'tests/project-health.test.mjs']);
  const passed = result.status === 0;
  const next = settleActiveGrave(document, {
    passed,
    failed: passed ? 0 : 1,
    durationMs: Date.now() - startedAt,
  });
  await writeCemetery(next);
  console.log(passed
    ? 'Regression tests passed. The deleted module may rest.'
    : 'Regression tests failed. The deleted module has resurrected.');
}

async function main() {
  const [command, candidate] = process.argv.slice(2);
  if (command === 'bury') return bury(candidate);
  if (command === 'settle') return settle();
  throw new Error('Usage: node scripts/undertaker.mjs <bury [filePath]|settle>');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
