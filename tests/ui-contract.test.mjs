import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, css, script] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('styles.css', 'utf8'),
  readFile('app.js', 'utf8'),
]);

test('the page presents Code Undertaker as a Kiro Custom Agent workflow', () => {
  assert.match(html, /id="start-here"/);
  assert.match(html, /id="director-action-title"/);
  assert.match(html, /id="director-action-button"/);
  assert.match(html, /Code Undertaker[^<]*Kiro Custom Agent/);
  assert.match(html, /AI 都在教你怎么写代码，我们让 Agent 为删除代码负责/);
  assert.match(html, /Agent 尸检/);
  assert.match(html, /Evidence Console/);
  assert.match(html, /id="agent-console"/);
  assert.match(html, /id="evidence-agent"/);
  assert.match(html, /id="evidence-knowledge"/);
  assert.match(html, /id="evidence-target"/);
  assert.match(html, /id="evidence-git"/);
  assert.match(html, /id="evidence-baseline"/);
  assert.match(html, /id="evidence-dependents"/);
  assert.match(html, /id="evidence-risk"/);
  assert.match(html, /id="evidence-stage"/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /请手动选择这段指令：\$\{prompt\}/);
});

test('assessment data is normalized and rendered without an HTML injection sink', () => {
  assert.match(script, /function normalizeAssessment/);
  assert.match(script, /dependentCount/);
  assert.match(script, /risk/);
  assert.match(script, /assessment:/);
  assert.match(script, /elements\.evidenceAgent\.textContent/);
  assert.match(script, /elements\.evidenceTarget\.textContent/);
  assert.doesNotMatch(script, /\.(?:innerHTML|outerHTML)\s*=/);
  assert.doesNotMatch(script, /insertAdjacentHTML|document\.write/);
});

test('live assessment is not mislabeled as Hook execution evidence', () => {
  assert.match(script, /Kiro Agent · 现场评估/);
  assert.match(script, /hasGrave[\s\S]*\? 'Kiro Hook · 实时'[\s\S]*hasAssessment \? 'Kiro Agent · 现场评估'/);
});

test('the deletion prompt enters through Feature Spec task 7.2', () => {
  assert.match(
    script,
    /delete: .*code-funeral-hall Feature Spec.*任务 7\.2.*Spec 任务入口.*普通聊天.*PostTaskExec/s,
  );
  assert.match(
    script,
    /只删除.*demo-src\/legacy-ghost\.mjs.*不要修改 active-consumer\.mjs.*不要提前修复测试/s,
  );
});

test('local replay carries a sanitized high-risk assessment', () => {
  assert.match(script, /agentId:\s*'code-undertaker'/);
  assert.match(script, /targetPath:\s*'demo-src\/legacy-ghost\.mjs'/);
  assert.match(script, /dependentCount:\s*1/);
  assert.match(script, /risk:\s*'high'/);
});

test('the resurrected ghost stays behind the gravestone content', () => {
  assert.match(css, /\.ghost\s*\{[^}]*z-index:\s*1;/s);
  assert.match(css, /\.grave-wrap\s*\{[^}]*z-index:\s*2;/s);
});

test('decorative effects do not cross the gravestone copy', () => {
  assert.doesNotMatch(html, /grave-crack/);
  assert.doesNotMatch(css, /\.grave-crack/);
});

test('the original ghost idea remains visible as the result layer', () => {
  assert.match(html, /代码守灵堂/);
  assert.match(html, /class="ghost"/);
  assert.match(html, /class="flowers"/);
  assert.match(html, /class="grave-stone"/);
});
