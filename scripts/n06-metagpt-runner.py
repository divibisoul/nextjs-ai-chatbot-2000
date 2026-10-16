#!/usr/bin/env python3
import asyncio, json, os, sys
UPSTREAM_COMMIT = '11cdf466d042aece04fc6cfd13b28e1a70341b1f'
DEFAULT_ROOT = 'integrations/soul-upstream/metagpt'
def emit(v, code=0): print(json.dumps(v, ensure_ascii=False)); raise SystemExit(code)
try: request=json.load(sys.stdin)
except Exception as exc: emit({'state':'FAIL','code':'METAGPT_REQUEST_INVALID','detail':str(exc)},2)
goal=str(request.get('goal') or '').strip()
if not goal: emit({'state':'FAIL','code':'METAGPT_GOAL_REQUIRED'},2)
root=os.path.abspath(str(request.get('root') or os.environ.get('N06_METAGPT_ROOT') or DEFAULT_ROOT))
rounds=max(1,min(20,int(request.get('maxRounds') or 3)))
if not os.path.isdir(root): emit({'state':'DEGRADED','code':'METAGPT_SOURCE_NOT_AVAILABLE','root':root})
if not os.environ.get('OPENAI_API_KEY'): emit({'state':'DEGRADED','code':'METAGPT_LLM_CREDENTIALS_NOT_AVAILABLE'})
sys.path.insert(0,root)
try: from metagpt.team import Team
except Exception as exc: emit({'state':'DEGRADED','code':'METAGPT_PYTHON_IMPORT_FAILED','detail':str(exc)})
async def main():
    team=Team(); team.invest(float(os.environ.get('N06_METAGPT_INVESTMENT','10'))); team.run_project(goal); history=await team.run(n_round=rounds, idea='', auto_archive=True)
    return {'state':'PASS','provider':'metagpt','upstreamCommit':UPSTREAM_COMMIT,'goal':goal,'maxRounds':rounds,'history':str(history)}
try: emit(asyncio.run(main()))
except Exception as exc: emit({'state':'FAIL','code':'METAGPT_EXECUTION_FAILED','detail':str(exc)},2)
