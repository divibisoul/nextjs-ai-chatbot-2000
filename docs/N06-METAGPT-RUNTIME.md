# N06 MetaGPT Runtime Adapter

MetaGPT is retained as an intact Git submodule at `integrations/soul-upstream/metagpt` and is owned by N06 for execution. The adapter exposes `metagpt.project.run` and `metagpt.project.status` through the existing `N06Processor` and Soul Mesh route.

Execution modes:
- remote sidecar: `N06_METAGPT_URL` points to a trusted runner exposing `POST /execute`;
- local: `N06_METAGPT_LOCAL_PYTHON` enables `scripts/n06-metagpt-runner.py`, which imports the pinned MetaGPT source and calls `Team.run()`.

The adapter preserves the Soul correlation ID and the exact upstream commit. Missing runtime, missing credentials, import failure, timeout or non-PASS runner state are returned as explicit runtime errors; source presence alone never becomes success.
