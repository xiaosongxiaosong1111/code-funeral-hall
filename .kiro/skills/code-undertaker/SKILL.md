---
name: code-undertaker
description: 'Assess, conduct, and diagnose the Code Funeral Hall workflow: investigate the approved demo module, safely retire it, verify its metadata-only grave, interpret resurrection or rest, and guide a Bugfix Spec. Use for 尸检、葬礼、立碑、诈尸、安息、undertaker or funeral demo tasks in this workspace.'
---

# Code Undertaker

Conduct a retirement as an evidence-backed Agent operation, not a theatrical file removal.

## Before acting

1. Read [references/domain.md](references/domain.md) before changing states, data fields, or user-facing funeral language.
2. Read [references/hook-contract.md](references/hook-contract.md) before changing Hooks, Undertaker commands, or troubleshooting a missed event.
3. Run exactly `npm run funeral:assess -- demo-src/legacy-ghost.mjs` before proposing a deletion. Report its tracked, workspace-clean, baseline, dependent-count, and risk evidence without inventing details.
4. Stop when risk is `blocked`. Otherwise ask the user to approve the exact target `demo-src/legacy-ghost.mjs`; do not treat assessment as approval.
5. After approval, execute `.kiro/specs/code-funeral-hall/tasks.md` task 7.2 through Kiro's Spec task entrypoint. Do not delete from ordinary chat or broaden the target; the Spec completion is required for `PostTaskExec` evidence.

The references directory is also configured as the Agent knowledge base. If the installed Kiro build cannot search it, read both reference files directly and disclose that fallback.

## Funeral workflow

1. Confirm that the v2 assessment belongs to the exact target and reflects the current workspace. A stale report must be rerun; burial permits only the task 7.2 completion update and the approved target deletion, never unrelated changes.
2. Delete only the approved file by executing task 7.2 through the Kiro Spec task entrypoint. Do not edit its consumer in the same task; the controlled failure is required evidence.
3. Let `PostFileDelete` invoke `node scripts/undertaker.mjs bury`. Do not claim success until `data/cemetery.json` contains the expected relative path and contains no source text.
4. Let `PostTaskExec` invoke `node scripts/undertaker.mjs settle`. Settlement must confirm the approved target remains a Git deletion and is physically absent. Interpret a failing health test as `resurrected`, not as permission to restore the deleted module.
5. Create a Bugfix Spec for the broken consumer. Preserve its public output, remove the obsolete dependency, and do not recreate `legacy-ghost.mjs`.
6. Re-run validation through the completed Bugfix task. The funeral is complete only when the health test passes and the grave is `resting`.

## Evidence to retain

- The v2 assessment and the exact deletion approval.
- The Feature Spec task Kiro executed.
- The enabled `PostFileDelete` and `PostTaskExec` Hooks.
- The metadata-only grave after deletion.
- The failed health result and `resurrected` visual.
- The Bugfix Spec, Kiro's repair diff, the passing test, and `resting` visual.

Never persist dependency paths, free-form Agent reasoning, raw Hook input, source content, secrets, or absolute user paths. Never directly edit cemetery data, the health test, or Hook configuration to improve the demo. If the primary Hook is unavailable, follow the disclosed fallback in `references/hook-contract.md` and label the evidence accurately.
