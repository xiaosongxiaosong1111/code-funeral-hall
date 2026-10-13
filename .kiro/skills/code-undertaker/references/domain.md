# Funeral domain

Read this reference when interpreting or changing assessment, cemetery state, copy, or data fields.

## Assessment v2

Schema version 2 adds a controlled preflight assessment before deletion. The top-level `assessment` is either `null` or an object containing exactly:

- `id`: the stable case ID later reused by the grave;
- `agentId`: always `code-undertaker`;
- `targetPath`: always `demo-src/legacy-ghost.mjs`;
- `assessedAt`: an ISO timestamp;
- `tracked`, `workspaceClean`, `baselinePassed`: boolean facts;
- `dependentCount`: a non-negative count, never a list of paths;
- `risk`: one of `low`, `high`, or `blocked`.

Risk is derived, not narrated:

- if the target is untracked, the workspace has unrelated changes, or the baseline fails, use `blocked`;
- otherwise, if `dependentCount` is greater than zero, use `high`;
- otherwise use `low`.

Assessment never authorizes deletion. `blocked` stops the workflow; `high` or `low` still requires the user's approval of the exact target. Do not store dependency paths, source, command output, free-form Agent reasoning, or approval text.

## State machine

```text
Code Undertaker assessment
        |
        +-- blocked ------------> stop
        |
        v
 exact target approved
        |
        v
Kiro Spec deletion confirmed
        |
        v
     pending
      /   \
 test fail test pass
    /       \
resurrected  resting
    |
Bugfix task + passing test
    |
    +-------------> resting
```

- `pending`: a safe demo deletion was found and recorded, but no health verdict has been attached.
- `resurrected`: the health test failed after deletion. The grave stays visible and the next action is a focused Bugfix Spec.
- `resting`: the health test passed. This is the only state that may use “安息” language.

Repeated settlement may move `resurrected` to `resting`; it must not invent a new grave. A failed test must never be presented as resting.

## Public grave contract

Allowed fields are limited to:

- stable grave ID;
- repository-relative file path and basename;
- non-negative line count, age in days, and commit count;
- ISO deletion/update timestamps;
- a fixed, program-controlled cause label;
- one of the three states above;
- a small test summary: passed flag, failed count, and duration.

The data document may also contain schema version 2, `live` or `replay` mode, current grave ID, update time, and the strict assessment object above.

Never derive the cause label from source or Hook input. Never add source text, diffs, commit messages, author names/emails, absolute paths, Hook payloads, environment values, or remote URLs. The page is a public visualization, not a source archive.

## Canonical demo story

`active-consumer.mjs` depends on `legacy-ghost.mjs`. Code Undertaker first records a high-risk assessment with one surviving dependent and asks for exact approval. Kiro then removes the legacy module as a discrete Feature Spec task. The import fails, proving that deletion safety cannot be judged by confidence alone. Kiro creates a Bugfix Spec that preserves `memorialMessage('旧接口') === '旧接口 已归档'` without restoring the deleted module. A passing health test grants rest.

Keep this story deterministic. It is a controlled `.mjs` retirement demonstration, not a claim of general multi-language or arbitrary-repository dependency analysis. Do not add random failures, multiple graves, arbitrary repositories, or function-level parsing to the MVP.
