# Kiro Hook contract

Read this reference when editing, testing, or diagnosing `.kiro/hooks/*.json` or `scripts/undertaker.mjs`.

## Primary triggers

The committed Kiro v1 configuration has exactly two hooks:

| Trigger | Matcher | Command | Purpose |
|---|---|---|---|
| `PostFileDelete` | `demo-src` `.mjs` paths | `node scripts/undertaker.mjs bury` | Record a safe deletion as a pending grave |
| `PostTaskExec` | none | `node scripts/undertaker.mjs settle` | Run health verification and settle the active grave |

Command actions run from the project root and may receive event/session JSON on standard input. The burial command intentionally ignores that untrusted payload: it is neither interpolated into the shell command nor saved or echoed.

Kiro file hooks observe changes made by the Kiro Agent in the same workspace root. A manual deletion in Explorer or the editor is not valid proof that `PostFileDelete` works.

The Hooks do not perform or prove the preflight assessment. Code Undertaker must run `npm run funeral:assess -- demo-src/legacy-ghost.mjs`, report the v2 evidence, and receive approval for the exact target before the Feature Spec deletion. Burial and settlement preserve that assessment; they must not fabricate or overwrite it.

## Burial source of truth

A restricted Git deletion diff is the only source of truth. Only `D` entries under `demo-src/` ending in `.mjs` are eligible. Read a tracked pre-deletion blob only long enough to compute line count, then discard it.

Burial is fail-closed: it requires the current non-blocked assessment and matching HEAD identity. The only permitted post-assessment changes are the task 7.2 completion update in `.kiro/specs/code-funeral-hall/tasks.md` and deletion of the approved target. Any unrelated or unapproved demo deletion is rejected.

The command must be idempotent. Duplicate events update the same stable grave. No eligible diff means no fabricated record.

## Settlement semantics

`PostTaskExec` runs after a Spec task. `settle` attaches the project health result to the active grave:

- failed health test → `resurrected`;
- passed health test → `resting`;
- no active grave or replay-only data → no state mutation.

Before settlement, the approved target must still be recorded as a Git deletion and must be absent from disk. Restoring it or introducing another demo deletion invalidates the evidence chain and is rejected.

A test failure is an expected domain verdict during the first funeral task. The command should preserve the result and provide a concise message so Kiro can continue to a Bugfix Spec.

## Documented fallback only

If the installed Kiro build does not deliver `PostFileDelete` after these checks—Agent made the deletion, correct workspace root, enabled hook, matching path—temporarily replace the existing burial hook's trigger with `Stop` and remove its file matcher. Do not add a third hook. The same `bury` command can then detect `D` entries through `git diff` when the Agent stops.

Disclose this as **Stop + Git diff fallback**, not as a successful file-delete Hook. Restore the committed primary configuration before publishing unless the compatibility issue is part of the documented result.
