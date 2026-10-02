import json, os, sys

def emit(payload, code=0):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    raise SystemExit(code)

try: request=json.load(sys.stdin)
except Exception as exc: emit({"state":"FAIL","code":"DSPY_REQUEST_INVALID","detail":str(exc)},2)

root=os.path.abspath(str(request.get("root") or "").strip())
model=str(request.get("model") or "openai/gpt-5-mini").strip()
signature=str(request.get("signature") or "question -> answer").strip()
inputs=request.get("inputs") or {}
temperature=float(request.get("temperature",0.2))

if not root or not os.path.isdir(root): emit({"state":"DEGRADED","code":"DSPY_SOURCE_NOT_AVAILABLE"},0)
if not os.environ.get("OPENAI_API_KEY"): emit({"state":"DEGRADED","code":"DSPY_OPENAI_CREDENTIALS_NOT_AVAILABLE"},0)
if not signature: emit({"state":"FAIL","code":"DSPY_SIGNATURE_REQUIRED"},2)
if not isinstance(inputs,dict) or not inputs: emit({"state":"FAIL","code":"DSPY_INPUTS_REQUIRED"},2)

sys.path.insert(0,root)
try:
    import dspy
except Exception as exc:
    emit({"state":"DEGRADED","code":"DSPY_PYTHON_IMPORT_FAILED","detail":str(exc)},0)

try:
    lm=dspy.LM(model, api_key=os.environ["OPENAI_API_KEY"], temperature=temperature)
    dspy.configure(lm=lm)
    predictor=dspy.Predict(signature)
    result=predictor(**inputs)
except Exception as exc:
    emit({"state":"FAIL","code":"DSPY_EXECUTION_FAILED","detail":str(exc)},2)

try:
    output=result.toDict()
except Exception:
    output={k:v for k,v in result.items()} if hasattr(result,"items") else {"result":str(result)}

emit({"state":"PASS","provider":"stanfordnlp/dspy","revision":"ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2","model":model,"signature":signature,"output":output})
