import { createHash } from 'node:crypto';
import path from 'node:path';

const DEMO_PREFIX = 'demo-src/';
const DEMO_FILE = /^[A-Za-z0-9._/-]+\.mjs$/;
const CEMETERY_FIELDS = new Set(['version', 'mode', 'activeId', 'updatedAt', 'graves']);
const GRAVE_FIELDS = new Set([
  'id', 'filePath', 'fileName', 'deletedAt', 'ageDays', 'commitCount', 'lineCount', 'state', 'cause', 'test',
]);
const TEST_FIELDS = new Set(['passed', 'failed', 'durationMs']);
const GRAVE_STATES = new Set(['pending', 'resurrected', 'resting']);

export function normalizeDemoPath(value) {
  if (typeof value !== 'string' || value.includes('\0')) {
    throw new TypeError('The deleted file path must be a string.');
  }

  const slashed = value.replaceAll('\\', '/').replace(/^\.\//, '');
  const normalized = path.posix.normalize(slashed);
  if (
    path.posix.isAbsolute(slashed)
    || normalized === '..'
    || normalized.startsWith('../')
    || !normalized.startsWith(DEMO_PREFIX)
    || !DEMO_FILE.test(normalized)
  ) {
    throw new Error(`Refusing path outside ${DEMO_PREFIX}: ${value}`);
  }
  return normalized;
}

export function parseDeletedPaths(output) {
  return String(output)
    .split(/\r?\n/)
    .flatMap((line) => {
      const [status, candidate] = line.split('\t');
      if (status !== 'D' || !candidate) return [];
      try {
        return [normalizeDemoPath(candidate)];
      } catch {
        return [];
      }
    });
}

function countLines(source) {
  if (!source) return 0;
  const lines = String(source).replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines.length;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function assertFields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Unexpected ${label.toLowerCase()} field: ${key}`);
  }
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function validateCemeteryDocument(document) {
  assertFields(document, CEMETERY_FIELDS, 'Cemetery');
  if (document.version !== 1 || !['live', 'replay'].includes(document.mode) || !Array.isArray(document.graves)) {
    throw new Error('Unsupported cemetery.json schema.');
  }
  if (document.updatedAt !== null && !isIsoTimestamp(document.updatedAt)) throw new Error('Invalid cemetery update time.');
  if (document.activeId !== null && typeof document.activeId !== 'string') throw new Error('Invalid active grave ID.');

  for (const grave of document.graves) {
    assertFields(grave, GRAVE_FIELDS, 'Grave');
    const safePath = normalizeDemoPath(grave.filePath);
    if (safePath !== grave.filePath || grave.fileName !== path.posix.basename(safePath)) throw new Error('Invalid grave path metadata.');
    if (!/^[a-z0-9-]{1,64}$/.test(grave.id) || !isIsoTimestamp(grave.deletedAt)) throw new Error('Invalid grave identity.');
    if (!GRAVE_STATES.has(grave.state) || grave.cause !== '死于重构') throw new Error('Invalid grave state.');
    if (![grave.ageDays, grave.commitCount, grave.lineCount].every(isNonNegativeInteger)) throw new Error('Invalid grave metrics.');

    if (grave.test === null) {
      if (grave.state !== 'pending') throw new Error('Settled graves require a test result.');
      continue;
    }
    assertFields(grave.test, TEST_FIELDS, 'Test');
    if (typeof grave.test.passed !== 'boolean'
      || !isNonNegativeInteger(grave.test.failed)
      || !isNonNegativeInteger(grave.test.durationMs)) {
      throw new Error('Invalid grave test result.');
    }
  }

  if (document.activeId !== null && !document.graves.some(({ id }) => id === document.activeId)) {
    throw new Error('Active grave ID is missing.');
  }
  return document;
}

export function createReplaySnapshot(document) {
  validateCemeteryDocument(document);
  return { ...document, mode: 'replay' };
}

export function createGrave({
  filePath,
  source,
  revision = 'unknown',
  firstCommitAt = null,
  deletedAt = new Date().toISOString(),
  commitCount = 0,
}) {
  const safePath = normalizeDemoPath(filePath);
  const deletedTime = Date.parse(deletedAt);
  const firstTime = firstCommitAt ? Date.parse(firstCommitAt) : Number.NaN;
  const ageDays = Number.isFinite(firstTime) && Number.isFinite(deletedTime)
    ? Math.max(0, Math.floor((deletedTime - firstTime) / 86_400_000))
    : 0;
  const id = createHash('sha256').update(`${revision}:${safePath}`).digest('hex').slice(0, 16);

  return {
    id,
    filePath: safePath,
    fileName: path.posix.basename(safePath),
    deletedAt,
    ageDays,
    commitCount: toNonNegativeInteger(commitCount),
    lineCount: countLines(source),
    state: 'pending',
    cause: '死于重构',
    test: null,
  };
}

export function upsertGraves(document, incomingGraves, now = new Date().toISOString()) {
  if (!Array.isArray(incomingGraves) || incomingGraves.length === 0) return document;

  const existingGraves = document.mode === 'replay' ? [] : document.graves;
  const additions = incomingGraves.map((grave) => {
    const existing = existingGraves.find(({ id }) => id === grave.id);
    return existing
      ? { ...grave, state: existing.state, test: existing.test }
      : { ...grave };
  });
  const incomingIds = new Set(additions.map(({ id }) => id));
  const graves = [
    ...additions,
    ...existingGraves.filter(({ id }) => !incomingIds.has(id)),
  ];

  return {
    ...document,
    mode: 'live',
    activeId: additions[0].id,
    updatedAt: now,
    graves,
  };
}

export function settleActiveGrave(document, result, now = new Date().toISOString()) {
  if (document.mode !== 'live' || !document.activeId) return document;
  const state = result.passed ? 'resting' : 'resurrected';
  const test = {
    passed: Boolean(result.passed),
    failed: toNonNegativeInteger(result.failed),
    durationMs: toNonNegativeInteger(result.durationMs),
  };

  return {
    ...document,
    mode: 'live',
    updatedAt: now,
    graves: document.graves.map((grave) => (
      grave.id === document.activeId ? { ...grave, state, test } : { ...grave }
    )),
  };
}

export function emptyCemetery() {
  return { version: 1, mode: 'live', activeId: null, updatedAt: null, graves: [] };
}
