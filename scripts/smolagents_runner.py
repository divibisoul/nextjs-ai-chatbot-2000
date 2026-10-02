import json, os, sys

def emit(payload, code=0):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    raise SystemExit(code)

try: request=json.load(sys.stdin)
except Exception as exc: emit({"state":"FAIL","code":"SMOLAGENTS_REQUEST_INVALID","detail":str(exc)},2)

root=os.path.abspath(str(request.get("root") or "").strip())
task=str(request.get("task") or "").strip()
model_id=str(request.get("modelId") or "Qwen/Qwen3-Next-80B-A3B-Thinking").strip()
provider=str(request.get("provider") or "auto").strip()
max_steps=int(request.get("maxSteps") or 20)
executor_type=str(request.get("executorType") or "docker").strip()

if not root or not os.path.isdir(root): emit({"state":"DEGRADED","code":"SMOLAGENTS_SOURCE_NOT_AVAILABLE"},0)
if not task: emit({"state":"FAIL","code":"SMOLAGENTS_TASK_REQUIRED"},2)
if not os.environ.get("HF_TOKEN"): emit({"state":"DEGRADED","code":"SMOLAGENTS_HF_TOKEN_NOT_AVAILABLE"},0)
if executor_type not in {"docker","e2b","modal","blaxel"}: emit({"state":"FAIL","code":"SMOLAGENTS_EXECUTOR_UNSUPPORTED","executorType":executor_type},2)

sys.path.insert(0,root)
try:
    from smolagents import CodeAgent, InferenceClientModel
except Exception as exc:
    emit({"state":"DEGRADED","code":"SMOLAGENTS_PYTHON_IMPORT_FAILED","detail":str(exc)},0)

try:
    model=InferenceClientModel(model_id=model_id, provider=provider or "auto", token=os.environ["HF_TOKEN"])
    agent=CodeAgent(tools=[], model=model, executor_type=executor_type, max_steps=max_steps)
    result=agent.run(task)
except Exception as exc:
    emit({"state":"FAIL","code":"SMOLAGENTS_EXECUTION_FAILED","detail":str(exc)},2)

emit({"state":"PASS","provider":"huggingface/smolagents","revision":"c30b115286e000e98711fae5e85993547b73d826","modelId":model_id,"executorType":executor_type,"result":result})
