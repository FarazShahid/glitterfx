# Bot Execution Protocol

This protocol is shared by Claude, Codex and other developer agents.

## Prime directive
Execute exactly one micro-objective at a time. Verification is part of implementation, not a later activity.

## 1. Select work
1. Read `PROJECT_STATE.md`.
2. Confirm the named objective exists in `ROADMAP.md` and is not blocked.
3. Confirm all predecessor gates are PASS.
4. Create/use a feature branch `v2/p<phase>-o<objective>-<slug>` from current `v2-engine`.

## 2. Before coding
- Read the objective's acceptance criteria and verification list.
- Read referenced ADRs.
- Identify files/contracts expected to change.
- State a short implementation hypothesis.
- If the objective requires a new dependency or contract change not already approved, write an ADR first; do not smuggle the decision into code.

## 3. Implementation discipline
- Keep the diff scoped to the objective.
- Prefer tests before or alongside implementation.
- No unrelated cleanup.
- No protected V1 edits.
- Do not port additional effects because they are convenient.
- Do not add abstractions until at least two real consumers justify them, unless the roadmap explicitly requires the abstraction.
- Preserve deterministic seeds in tests and visual fixtures.
- Dispose all DOM listeners, RAF handles, GPU/Three resources and observers created by the objective.

## 4. Verification loop
Run the objective-specific checks plus the global checks in `VERIFICATION.md`. If any mandatory check fails:
1. keep objective status `IN_PROGRESS` or `BLOCKED`;
2. record the failure and evidence;
3. fix within the same objective or document the blocking architectural decision;
4. never advance the state pointer.

## 5. Evidence
Evidence must be reproducible. Record exact command, pass/fail result, relevant numerical measurement, and artifact/fixture path when applicable. Screenshots alone do not prove performance or semantic correctness.

## 6. Commit/PR rule
One micro-objective should normally produce one reviewable PR into `v2-engine`. Commits may be multiple but must remain objective-scoped. Do not merge into `main`.

## 7. State update
Only after PASS:
- mark the objective complete in `ROADMAP.md`;
- add the evidence record to `PROJECT_STATE.md`;
- set `Current objective` to the next unblocked objective;
- list known risks/debt explicitly.

## 8. Required handoff format
```text
Objective: P?.O? — <name>
Status: PASS | FAIL | BLOCKED
Changed: <files/modules>
Verified:
- <command/check> => <result>
Performance: <measurement or N/A>
Compatibility: <impact>
Risks: <remaining risks>
Next: <next objective only if PASS>
```

## 9. Prohibited agent behavior
- working ahead on later objectives;
- changing public semantics without an ADR;
- silently changing fallback behavior;
- silently reducing fidelity to make a test pass;
- weakening thresholds/tests without owner-approved rationale;
- introducing closed-source/proprietary runtime components;
- publishing packages or npm tags unless a roadmap objective explicitly authorizes it;