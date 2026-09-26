# V2 Checks

Keep verification proportional to the work.

For every objective:
- build/typecheck/tests relevant to the changed code must pass
- V1 protected files must remain unchanged
- visual effects must be checked in the playground with a fixed seed/config
- performance-sensitive work should get a simple before/after measurement
- destroy/unmount work must not leave its own RAF/listeners/resources running

No additional process is required unless a real bug or regression needs it.
