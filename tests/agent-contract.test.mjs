import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const AGENT_PATH = '.kiro/agents/code-undertaker.md';
const ALLOWED_SHELL_COMMANDS = [
  'git status --short',
  'git diff --stat',
  'git diff -- demo-src/legacy-ghost.mjs demo-src/active-consumer.mjs',
  'git log -5 --oneline',
  'npm test',
  'npm run validate',
  'npm run build',
  'npm run funeral:assess -- demo-src/legacy-ghost.mjs',
];

test('Code Undertaker exposes only the bounded Kiro agent contract', async () => {
  const source = await readFile(AGENT_PATH, 'utf8');
  const normalized = source.replaceAll('\r\n', '\n');
  const [, frontmatter = '', prompt = ''] = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/) ?? [];

  assert.match(frontmatter, /^name: code-undertaker$/m);
  assert.doesNotMatch(frontmatter, /^model:/m);
  assert.match(frontmatter, /^tools: \["read", "write", "shell", "knowledge"\]$/m);
  assert.equal(frontmatter.match(/^tools:/gm)?.length, 1);
  assert.doesNotMatch(frontmatter, /^tools:.*\*/m);
  assert.match(frontmatter, /^includeMcpJson: false$/m);
  assert.match(frontmatter, /^includePowers: false$/m);
  assert.equal(frontmatter.match(/^includeMcpJson:/gm)?.length, 1);
  assert.equal(frontmatter.match(/^includePowers:/gm)?.length, 1);

  assert.match(frontmatter, /file:\/\/.kiro\/steering\/\*\*\/\*.md/);
  assert.match(frontmatter, /file:\/\/.kiro\/specs\/code-funeral-hall\/\*\*\/\*.md/);
  assert.match(frontmatter, /skill:\/\/.kiro\/skills\/code-undertaker\/SKILL.md/);
  assert.match(frontmatter, /type: knowledgeBase/);
  assert.match(frontmatter, /source: file:\/\/.kiro\/skills\/code-undertaker\/references/);
  assert.match(frontmatter, /indexType: best/);
  assert.match(frontmatter, /autoUpdate: true/);

  assert.equal(frontmatter.match(/^    - capability:/gm)?.length, 3);
  const allowedShell = ruleMatches(frontmatter, 'shell', 'allow');
  const deniedShell = ruleMatches(frontmatter, 'shell', 'deny');
  const deniedWrites = ruleMatches(frontmatter, 'fs_write', 'deny');
  assert.doesNotMatch(frontmatter, /^    - capability: write$/m);

  assert.deepEqual(quotedValues(allowedShell), ALLOWED_SHELL_COMMANDS);
  assert.doesNotMatch(allowedShell, /"npm test(?:\*|\s+[^"\r\n]+)"/);
  assert.equal(quotedValues(allowedShell).some((command) => command.includes('*')), false);

  for (const forbidden of [
    'npm test *',
    'git reset --hard*',
    'git clean*',
    'git checkout --*',
    'git restore*',
    'git rm*',
    'rm *',
    'del *',
    'rmdir *',
    'Remove-Item *',
  ]) {
    assert.ok(deniedShell.includes(`"${forbidden}"`), `missing denied shell operation: ${forbidden}`);
  }
  for (const forbidden of [
    'data/cemetery.json',
    'tests/project-health.test.mjs',
    '.kiro/hooks/*',
  ]) {
    assert.ok(deniedWrites.includes(`"${forbidden}"`), `missing denied write: ${forbidden}`);
  }

  assert.match(prompt, /npm run funeral:assess -- demo-src\/legacy-ghost\.mjs/);
  assert.match(prompt, /exact deletion target/i);
  assert.match(prompt, /request\s+(?:the\s+)?user(?:'s)?\s+approval/i);
  assert.match(prompt, /\.kiro\/specs\/code-funeral-hall\/tasks\.md[\s\S]*task 7\.2/i);
  assert.match(prompt, /smallest\s+behavior-preserving\s+Bugfix/i);
  assert.match(prompt, /never (?:invent|fabricate|fake)/i);
  assert.match(prompt, /live.*replay/is);
});

test('the Skill, Spec, and always-loaded safety rules share the v2 contract', async () => {
  const [skill, domain, requirements, design, tasks, safety] = await Promise.all([
    readFile('.kiro/skills/code-undertaker/SKILL.md', 'utf8'),
    readFile('.kiro/skills/code-undertaker/references/domain.md', 'utf8'),
    readFile('.kiro/specs/code-funeral-hall/requirements.md', 'utf8'),
    readFile('.kiro/specs/code-funeral-hall/design.md', 'utf8'),
    readFile('.kiro/specs/code-funeral-hall/tasks.md', 'utf8'),
    readFile('.kiro/steering/safety.md', 'utf8'),
  ]);

  assert.match(skill, /npm run funeral:assess -- demo-src\/legacy-ghost\.mjs/);
  assert.match(skill, /references\/domain\.md|references\\domain\.md/);
  assert.match(skill, /references\/hook-contract\.md|references\\hook-contract\.md/);
  assert.match(skill, /\.kiro\/specs\/code-funeral-hall\/tasks\.md[\s\S]*7\.2/i);
  assert.match(domain, /version.{0,12}2/is);
  assert.match(domain, /low.*high.*blocked/is);
  assert.match(domain, /dependentCount/);
  assert.match(requirements, /需求 7/);
  assert.match(design, /Code Undertaker/);
  assert.match(`${requirements}\n${design}`, /\.kiro\/specs\/code-funeral-hall\/tasks\.md[\s\S]*7\.2/i);
  assert.match(tasks, /\[x\].*Code Undertaker/i);
  assert.match(`${requirements}\n${design}`, /不.{0,8}(?:通用|任意).{0,8}(?:语言|代码库)/s);

  const assessmentLine = safety.split(/\r?\n/).find((line) => line.startsWith('- `assessment`')) ?? '';
  assert.deepEqual(backtickValues(assessmentLine).slice(2), [
    'id',
    'agentId',
    'targetPath',
    'assessedAt',
    'tracked',
    'workspaceClean',
    'baselinePassed',
    'dependentCount',
    'risk',
  ]);
});

test('permission extraction rejects an unquoted command hidden beside the fixed allowlist', () => {
  const valid = ALLOWED_SHELL_COMMANDS.map((command) => `        - "${command}"`).join('\n');
  const rogue = `${valid}\n        - npm test -- --import=data:text/javascript,process.exit(0)\n`;

  assert.throws(() => quotedValues(rogue), /double-quoted/);
});

function ruleMatches(frontmatter, capability, effect) {
  const pattern = new RegExp(
    `^    - capability: ${capability}\\n      match:\\n((?:        - .+\\n)+)      effect: ${effect}$`,
    'm',
  );
  const matches = frontmatter.match(pattern);
  assert.ok(matches, `missing ${effect} rule for ${capability}`);
  return matches[1];
}

function quotedValues(block) {
  const lines = block.trimEnd().split('\n');
  for (const line of lines) {
    if (!/^        - "[^"]+"$/.test(line)) throw new Error('Permission list items must be double-quoted.');
  }
  return lines.map((line) => line.slice(11, -1));
}

function backtickValues(line) {
  return [...line.matchAll(/`([^`]+)`/g)].map(([, value]) => value);
}
