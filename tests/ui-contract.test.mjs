import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, css, script] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('styles.css', 'utf8'),
  readFile('app.js', 'utf8'),
]);

test('the page explains the two-step Kiro workflow', () => {
  assert.match(html, /id="start-here"/);
  assert.match(html, /id="director-action-title"/);
  assert.match(html, /id="director-action-button"/);
  assert.match(html, /Kiro[^<]*→[^<]*网页[^<]*→[^<]*Kiro[^<]*→[^<]*网页/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(script, /请手动选择这段指令：\$\{prompt\}/);
});

test('the resurrected ghost stays behind the gravestone content', () => {
  assert.match(css, /\.ghost\s*\{[^}]*z-index:\s*1;/s);
  assert.match(css, /\.grave-wrap\s*\{[^}]*z-index:\s*2;/s);
});

test('decorative effects do not cross the gravestone copy', () => {
  assert.doesNotMatch(html, /grave-crack/);
  assert.doesNotMatch(css, /\.grave-crack/);
});
