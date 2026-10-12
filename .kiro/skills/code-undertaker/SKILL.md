---
name: code-undertaker
description: 'Conduct and diagnose the Code Funeral Hall workflow: safely remove the approved demo module, verify its metadata-only grave, interpret resurrection or rest, and guide a Bugfix Spec. Use for 葬礼、立碑、诈尸、安息、undertaker or funeral demo tasks in this workspace.'
---

# Code Undertaker

Conduct a deletion as an evidence-backed maintenance operation, not a theatrical file removal.

## Before acting

1. Read [references/domain.md](references/domain.md) before changing states, data fields, or user-facing funeral language.
2. Read [references/hook-contract.md](references/hook-contract.md) before changing Hooks, Undertaker commands, or troubleshooting a missed event.
3. Inspect `git status --short`, the selected Spec task, the target file, its callers, and the health test.
4. Proceed only when the approved target is exactly `demo-src/legacy-ghost.mjs`. Do not broaden the deletion.

## Funeral workflow

1. Establish that the demo file is tracked in Git and the baseline health test passes.
2. Delete only the approved file through the Kiro task. Do not edit its consumer in the same task; the controlled failure is required evidence.
3. Let `PostFileDelete` invoke `node scripts/undertaker.mjs bury`. Do not claim success until `data/cemetery.json` contains the expected relative path and contains no source text.
4. Let `PostTaskExec` invoke `node scripts/undertaker.mjs settle`. Interpret a failing health test as `resurrected`, not as permission to restore the deleted module.
5. Create a Bugfix Spec for the broken consumer. Preserve its public output, remove the obsolete dependency, and do not recreate `legacy-ghost.mjs`.
6. Re-run validation through the completed Bugfix task. The funeral is complete only when the health test passes and the grave is `resting`.

## Evidence to retain

- The Feature Spec task Kiro executed.
- The enabled `PostFileDelete` and `PostTaskExec` Hooks.
- The metadata-only grave after deletion.
- The failed health result and `resurrected` visual.
- The Bugfix Spec, Kiro's repair diff, the passing test, and `resting` visual.

Never persist raw Hook input, source content, secrets, or absolute user paths. Never manually fake a grave or edit a state only to improve the demo. If the primary Hook is unavailable, follow the disclosed fallback in `references/hook-contract.md` and label the evidence accurately.
