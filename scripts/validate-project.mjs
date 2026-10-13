import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateCemeteryDocument } from './cemetery.mjs';

const ALLOWED_AGENT_SHELL_COMMANDS = [
  'git status --short',
  'git diff --stat',
  'git diff -- demo-src/legacy-ghost.mjs demo-src/active-consumer.mjs',
  'git log -5 --oneline',
  'npm test',
  'npm run validate',
  'npm run build',
  'npm run funeral:assess -- demo-src/legacy-ghost.mjs',
];

const hookFiles = [
  '.kiro/hooks/bury-on-delete.json',
  '.kiro/hooks/settle-after-task.json',
];

for (const file of hookFiles) {
  const document = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(document.version, 'v1', `${file}: version must be v1`);
  assert.ok(Array.isArray(document.hooks) && document.hooks.length > 0, `${file}: hooks are required`);
  for (const hook of document.hooks) {
    assert.ok(hook.name && hook.trigger, `${file}: hook name and trigger are required`);
    assert.equal(hook.action?.type, 'command', `${file}: command action required`);
    assert.ok(hook.action.command, `${file}: command is required`);
    if (hook.matcher) new RegExp(hook.matcher);
  }
}

const skill = await readFile('.kiro/skills/code-undertaker/SKILL.md', 'utf8');
assert.match(skill, /^---\r?\nname: code-undertaker\r?\ndescription: .+\r?\n---/);

const agent = (await readFile('.kiro/agents/code-undertaker.md', 'utf8')).replaceAll('\r\n', '\n');
assert.match(agent, /^---\nname: code-undertaker\n/);
const agentFrontmatter = agent.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
assert.doesNotMatch(agentFrontmatter, /^model:/m, 'Agent must inherit the available model.');
assert.equal(agentFrontmatter.match(/^tools:/gm)?.length, 1, 'Agent must have one tools declaration.');
assert.equal(agentFrontmatter.match(/^includeMcpJson:/gm)?.length, 1, 'Agent must have one MCP inheritance declaration.');
assert.equal(agentFrontmatter.match(/^includePowers:/gm)?.length, 1, 'Agent must have one Powers inheritance declaration.');
assert.equal(agentFrontmatter.match(/^    - capability:/gm)?.length, 3, 'Agent must have exactly three permission rules.');
for (const marker of [
  'tools: ["read", "write", "shell", "knowledge"]',
  'includeMcpJson: false',
  'includePowers: false',
  'file://.kiro/steering/**/*.md',
  'file://.kiro/specs/code-funeral-hall/**/*.md',
  'skill://.kiro/skills/code-undertaker/SKILL.md',
  'type: knowledgeBase',
  'source: file://.kiro/skills/code-undertaker/references',
  'indexType: best',
  'autoUpdate: true',
]) {
  assert.ok(agentFrontmatter.includes(marker), `Agent contract is missing: ${marker}`);
}
const allowedShell = permissionMatches(agentFrontmatter, 'shell', 'allow');
const deniedShell = permissionMatches(agentFrontmatter, 'shell', 'deny');
const deniedWrites = permissionMatches(agentFrontmatter, 'fs_write', 'deny');
assert.deepEqual(permissionValues(allowedShell), ALLOWED_AGENT_SHELL_COMMANDS, 'Agent shell allowlist must contain only fixed commands.');
assert.doesNotMatch(allowedShell, /"npm test(?:\*|\s+[^"\r\n]+)"/, 'npm test must not accept arbitrary arguments.');
assert.equal(permissionValues(allowedShell).some((command) => command.includes('*')), false, 'Agent shell allowlist must not contain wildcards.');
for (const command of ['npm test *', 'git reset --hard*', 'git clean*', 'git checkout --*', 'git restore*', 'git rm*', 'rm *', 'del *', 'rmdir *', 'Remove-Item *']) {
  assert.ok(deniedShell.includes(`"${command}"`), `Agent denied shell rule is missing: ${command}`);
}
for (const file of ['data/cemetery.json', 'tests/project-health.test.mjs', '.kiro/hooks/*']) {
  assert.ok(deniedWrites.includes(`"${file}"`), `Agent denied write rule is missing: ${file}`);
}

const [requirements, design, safety] = await Promise.all([
  readFile('.kiro/specs/code-funeral-hall/requirements.md', 'utf8'),
  readFile('.kiro/specs/code-funeral-hall/design.md', 'utf8'),
  readFile('.kiro/steering/safety.md', 'utf8'),
]);
for (const [label, document] of [['Agent', agent], ['Skill', skill], ['Requirements', requirements], ['Design', design]]) {
  assert.match(
    document,
    /\.kiro\/specs\/code-funeral-hall\/tasks\.md[\s\S]{0,120}(?:task|任务) 7\.2/i,
    `${label} must bind deletion to Kiro Spec task 7.2.`,
  );
}
assert.deepEqual(safetyFields(safety, '- 顶层字段仅限：'), ['version', 'mode', 'activeId', 'updatedAt', 'assessment', 'graves']);
assert.deepEqual(safetyFields(safety, '- `assessment`'), [
  'assessment', 'null', 'id', 'agentId', 'targetPath', 'assessedAt', 'tracked', 'workspaceClean', 'baselinePassed', 'dependentCount', 'risk',
]);
assert.deepEqual(safetyFields(safety, '- 每条墓碑字段仅限：'), [
  'id', 'filePath', 'fileName', 'deletedAt', 'ageDays', 'commitCount', 'lineCount', 'state', 'cause', 'test',
]);
assert.deepEqual(safetyFields(safety, '- `test`'), ['test', 'null', 'passed', 'failed', 'durationMs']);

const cemetery = JSON.parse(await readFile('data/cemetery.json', 'utf8'));
assert.equal(cemetery.version, 2, 'cemetery.json must use assessment schema v2');
assert.ok(Object.hasOwn(cemetery, 'assessment'), 'cemetery.json must declare assessment');
validateCemeteryDocument(cemetery);

console.log('Project contracts are valid.');

function permissionMatches(frontmatter, capability, effect) {
  const pattern = new RegExp(
    `^    - capability: ${capability}\\n      match:\\n((?:        - .+\\n)+)      effect: ${effect}$`,
    'm',
  );
  const matches = frontmatter.match(pattern);
  assert.ok(matches, `Agent requires a ${effect} ${capability} permission rule.`);
  return matches[1];
}

function permissionValues(block) {
  const lines = block.trimEnd().split('\n');
  for (const line of lines) assert.match(line, /^        - "[^"]+"$/, 'Permission list items must be double-quoted.');
  return lines.map((line) => line.slice(11, -1));
}

function safetyFields(document, prefix) {
  const line = document.split(/\r?\n/).find((candidate) => candidate.startsWith(prefix)) ?? '';
  return [...line.matchAll(/`([^`]+)`/g)].map(([, value]) => value);
}
