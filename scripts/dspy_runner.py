#!/usr/bin/env python3
"""Execute a real DSPy Predict call against the pinned source tree; never synthesize output."""
import contextlib
import json
import os
import re
import sys
from pathlib import Path

UPSTREAM_COMMIT = "ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2"


def emit(state, code, **extra):
    print(json.dumps({"state": state, "code": code, "provider": "stanfordnlp/dspy",
                      "upstreamCommit": UPSTREAM_COMMIT, **extra}, ensure_ascii=False, default=str))


def main():
    try:
        request = json.load(sys.stdin)
    except Exception:
        emit("FAIL", "DSPY_REQUEST_INVALID")
        return
    if not isinstance(request, dict):
        emit("FAIL", "DSPY_REQUEST_OBJECT_REQUIRED")
        return

    root = Path(str(request.get("root") or os.environ.get("SOUL_N06_DSPY_ROOT")
                             or "integrations/soul-upstream/dspy")).expanduser().resolve()
    if not (root / "dspy" / "__init__.py").is_file():
        emit("DEGRADED", "DSPY_SOURCE_NOT_AVAILABLE", root=str(root), executionProven=False)
        return

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        emit("DEGRADED", "DSPY_OPENAI_CREDENTIALS_NOT_AVAILABLE", root=str(root), executionProven=False)
        return

    signature = str(request.get("signature") or "question -> answer").strip()
    if not signature or len(signature) > 512:
        emit("FAIL", "DSPY_SIGNATURE_INVALID")
        return
    inputs = request.get("inputs")
    if not isinstance(inputs, dict) or not inputs:
        emit("FAIL", "DSPY_INPUTS_REQUIRED")
        return
    if len(inputs) > 64 or any(not isinstance(key, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key)
                               for key in inputs):
        emit("FAIL", "DSPY_INPUT_KEYS_INVALID")
        return
    try:
        temperature = float(request.get("temperature", 0.2))
    except (TypeError, ValueError):
        emit("FAIL", "DSPY_TEMPERATURE_INVALID")
        return
    if not 0.0 <= temperature <= 2.0:
        emit("FAIL", "DSPY_TEMPERATURE_OUT_OF_RANGE")
        return

    model = str(request.get("model") or os.environ.get("N06_DSPY_MODEL") or "openai/gpt-5-mini").strip()
    # This adapter supplies an OpenAI credential; do not let an incoming peer redirect it to another provider.
    if not model.startswith("openai/") or len(model) > 256:
        emit("FAIL", "DSPY_MODEL_PROVIDER_NOT_ALLOWED")
        return

    try:
        sys.path.insert(0, str(root))
        with contextlib.redirect_stdout(sys.stderr):
            import dspy

            lm = dspy.LM(model, api_key=api_key, temperature=temperature)
            predictor = dspy.Predict(signature)
            with dspy.context(lm=lm):
                prediction = predictor(**inputs)
            output = dict(prediction.items())
        emit("PASS", "DSPY_EXECUTION_COMPLETED", root=str(root), model=model,
             signature=signature, output=output, executionProven=True)
    except Exception as exc:
        emit("FAIL", "DSPY_EXECUTION_FAILED", root=str(root),
             detail=f"{type(exc).__name__}: {str(exc)}"[:1200], executionProven=False)


if __name__ == "__main__":
    main()
