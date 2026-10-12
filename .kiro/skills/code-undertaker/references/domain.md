# Funeral domain

Read this reference when interpreting or changing cemetery state, copy, or data fields.

## State machine

```text
Kiro deletion confirmed
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

The data document may also contain schema version, `live` or `replay` mode, current grave ID, and update time.

Never derive the cause label from source or Hook input. Never add source text, diffs, commit messages, author names/emails, absolute paths, Hook payloads, environment values, or remote URLs. The page is a public visualization, not a source archive.

## Canonical demo story

`active-consumer.mjs` depends on `legacy-ghost.mjs`. Kiro removes the legacy module as a discrete task. The import then fails, proving that deletion safety cannot be judged by confidence alone. Kiro creates a Bugfix Spec that preserves `memorialMessage('旧接口') === '旧接口 已归档'` without restoring the deleted module. A passing health test grants rest.

Keep this story deterministic. Do not add random failures, multiple graves, arbitrary repositories, or function-level parsing to the MVP.
