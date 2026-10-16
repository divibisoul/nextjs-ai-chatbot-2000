#!/usr/bin/env python3
"""Execute the pinned Hugging Face smolagents runtime; never return a mocked PASS."""
import contextlib
import json
import os
import re
import sys
from pathlib import Path

UPSTREAM_COMMIT = "c30b115286e000e98711fae5e85993547b73d826"
ALLOWED_EXECUTORS = {"docker", "e2b", "modal", "blaxel"}
ALLOWED_PROVIDERS = {
    "auto", "cerebras", "cohere", "fal", "fireworks-ai", "hf-inference",
    "hyperbolic", "nebius", "novita", "replicate", "sambanova", "together",
}


def emit(state, code, **extra):
    print(json.dumps({"state": state, "code": code, "provider": "huggingface/smolagents",
                      "upstreamCommit": UPSTREAM_COMMIT, **extra}, ensure_ascii=False, default=str))


def main():
    try:
        request = json.load(sys.stdin)
    except Exception:
        emit("FAIL", "SMOLAGENTS_REQUEST_INVALID")
        return

    if not isinstance(request, dict):
        emit("FAIL", "SMOLAGENTS_REQUEST_OBJECT_REQUIRED")
        return
    task = request.get("task")
    if not isinstance(task, str) or not task.strip():
        emit("FAIL", "SMOLAGENTS_TASK_REQUIRED")
        return

    root = Path(str(request.get("root") or os.environ.get("SOUL_N06_SMOLAGENTS_ROOT")
                             or "integrations/soul-upstream/smolagents")).expanduser().resolve()
    source_root = root / "src"
    if not (source_root / "smolagents" / "__init__.py").is_file():
        source_root = root
        if not (source_root / "smolagents" / "__init__.py").is_file():
            emit("DEGRADED", "SMOLAGENTS_SOURCE_NOT_AVAILABLE", root=str(root), executionProven=False)
            return

    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        emit("DEGRADED", "SMOLAGENTS_HF_TOKEN_NOT_AVAILABLE", root=str(root), executionProven=False)
        return

    model_id = str(request.get("modelId") or os.environ.get("SOUL_N06_SMOLAGENTS_MODEL_ID")
                   or "Qwen/Qwen3-Next-80B-A3B-Thinking").strip()
    if not model_id:
        emit("FAIL", "SMOLAGENTS_MODEL_ID_REQUIRED")
        return
    # Never allow a remote mesh message to redirect the configured HF token to an arbitrary URL.
    requested_model = request.get("modelId")
    if isinstance(requested_model, str) and re.match(r"^https?://", requested_model.strip(), re.I):
        emit("FAIL", "SMOLAGENTS_REMOTE_MODEL_URL_OVERRIDE_DENIED")
        return

    provider = str(request.get("provider") or os.environ.get("SOUL_N06_SMOLAGENTS_MODEL_PROVIDER")
                   or "auto").strip().lower()
    if provider not in ALLOWED_PROVIDERS:
        emit("FAIL", "SMOLAGENTS_PROVIDER_UNSUPPORTED", providerRequested=provider)
        return

    executor = str(request.get("executorType") or os.environ.get("SOUL_N06_SMOLAGENTS_EXECUTOR")
                   or "docker").strip().lower()
    if executor not in ALLOWED_EXECUTORS:
        emit("FAIL", "SMOLAGENTS_EXECUTOR_UNSUPPORTED", executorType=executor)
        return
    try:
        max_steps = max(1, min(100, int(request.get("maxSteps", 20))))
    except (TypeError, ValueError):
        emit("FAIL", "SMOLAGENTS_MAX_STEPS_INVALID")
        return

    try:
        sys.path.insert(0, str(source_root))
        # The library may log progress to stdout; reserve stdout exclusively for the JSON protocol.
        with contextlib.redirect_stdout(sys.stderr):
            from smolagents import CodeAgent, InferenceClientModel

            model = InferenceClientModel(model_id=model_id, provider=provider, token=token)
            agent = CodeAgent(
                tools=[],
                model=model,
                max_steps=max_steps,
                executor_type=executor,
                verbosity_level=0,
            )
            output = agent.run(task, max_steps=max_steps)
        emit("PASS", "SMOLAGENTS_EXECUTION_COMPLETED", root=str(root), modelId=model_id,
             modelProvider=provider, executorType=executor, maxSteps=max_steps,
             result=str(output)[:25000], executionProven=True)
    except Exception as exc:
        emit("FAIL", "SMOLAGENTS_EXECUTION_FAILED", root=str(root),
             detail=f"{type(exc).__name__}: {str(exc)}"[:1200], executionProven=False)


if __name__ == "__main__":
    main()
