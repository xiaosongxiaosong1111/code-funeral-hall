import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateCemeteryDocument } from './cemetery.mjs';

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

const cemetery = JSON.parse(await readFile('data/cemetery.json', 'utf8'));
validateCemeteryDocument(cemetery);

console.log('Project contracts are valid.');
