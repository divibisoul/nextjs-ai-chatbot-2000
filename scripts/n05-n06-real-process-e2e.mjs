import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const n06Root = process.env.SOUL_N06_WORKDIR || process.cwd();
const n05Root = process.env.SOUL_N05_WORKDIR;
if (!existsSync(resolve(n06Root, 'node_modules/next/dist/bin/next'))) {
  throw new Error('N06 production dependencies/build are required before E2E.');
}
if (!n05Root || !existsSync(resolve(n05Root, 'node_modules/next/dist/bin/next'))) {
  throw new Error('SOUL_N05_WORKDIR must identify the checked-out N05 runtime.');
}

const n05Port = Number(process.env.SOUL_TEST_N05_PORT || 18505);
const n06Port = Number(process.env.SOUL_TEST_N06_PORT || 18506);
const n05Url = 'http://127.0.0.1:' + n05Port;
const n06Url = 'http://127.0.0.1:' + n06Port;
const secret = process.env.SOUL_MESH_HMAC_SECRET || randomBytes(48).toString('hex');
const token = process.env.SOUL_MESH_TOKEN || randomBytes(32).toString('hex');
const commonEnv = {
  ...process.env,
  NODE_ENV: 'production',
  AUTH_SECRET: process.env.AUTH_SECRET || 'ci-only-not-a-production-secret',
  POSTGRES_URL: process.env.POSTGRES_URL || 'postgresql://soulmesh:soulmesh@127.0.0.1:5432/soulmesh',
  SOUL_MESH_HMAC_SECRET: secret,
  SOUL_MESH_TOKEN: token,
  SOUL_MESH_HOST: '127.0.0.1',
};
const children = [];
const logs = new Map();

function start(name, cwd, port, peerEnv) {
  const child = spawn(process.execPath, [
    resolve(cwd, 'node_modules/next/dist/bin/next'),
    'start',
    '--hostname', '127.0.0.1',
    '--port', String(port),
  ], {
    cwd,
    env: {
      ...commonEnv,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      ...peerEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  logs.set(name, '');
  const collect = chunk => logs.set(name, (logs.get(name) + String(chunk)).slice(-24000));
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.on('error', error => collect(String(error)));
  return child;
}

function assertRunning(name, child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(name + ' exited before E2E completed.\n' + logs.get(name));
  }
}

async function jsonGet(url, bearer = false) {
  const headers = bearer ? { authorization: 'Bearer ' + token } : {};
  const response = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(5000) });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function waitFor(name, child, probe) {
  let last = 'no response';
  for (let i = 0; i < 80; i += 1) {
    assertRunning(name, child);
    try {
      const result = await probe();
      if (result) return;
      last = 'probe returned unexpected response';
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
  }
  throw new Error(name + ' did not become ready: ' + last + '\n' + logs.get(name));
}

function runClient(name, cwd, driver, timeoutMs = 20000) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', driver], {
      cwd,
      env: {
        ...commonEnv,
        SOUL_MESH_N05_URL: n05Url,
        SOUL_MESH_N06_URL: n06Url,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let captured = '';
    const collect = chunk => { captured = (captured + String(chunk)).slice(-24000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', error => rejectPromise(new Error(name + ' could not start: ' + error.message)));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error(name + ' timed out.\n' + captured));
    }, timeoutMs);
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolvePromise(captured);
      else rejectPromise(new Error(name + ' exited with ' + code + '.\n' + captured));
    });
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolveExit => child.once('exit', resolveExit)),
    new Promise(resolveDelay => setTimeout(resolveDelay, 4000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

try {
  const n05 = start('N05 real Next.js runtime', n05Root, n05Port, {
    SOUL_MESH_N06_URL: n06Url,
  });
  const n06 = start('N06 real Next.js runtime', n06Root, n06Port, {
    SOUL_MESH_N05_URL: n05Url,
  });

  await Promise.all([
    waitFor('N05', n05, async () => {
      const result = await jsonGet(n05Url + '/api/soul-mesh', true);
      return result.response.ok && result.body?.nucleus === 'N05'
        && result.body?.contractVersion === '1.1.0';
    }),
    waitFor('N06', n06, async () => {
      const result = await jsonGet(n06Url + '/api/soul-mesh');
      return result.response.ok && result.body?.nucleus === 'N06'
        && result.body?.contractVersion === '1.1.0';
    }),
  ]);

  const n05Driver = [
    "import * as adapterModule from './lib/soul-mesh/adapter.ts';",
    "const sendToNucleus = adapterModule.sendToNucleus ?? adapterModule.default?.sendToNucleus;",
    "if (typeof sendToNucleus !== 'function') throw new Error('N05_SEND_TO_NUCLEUS_EXPORT_MISSING');",
    "const r = await sendToNucleus('N06', 'mesh.ping', { probe: 'N05_N06_REAL_PROCESS_PAIR' }, 5000);",
    "if (!r || r.ok !== true || r.nucleus !== 'N06') throw new Error('N05_TO_N06_CONTRACT_OR_HMAC_FAILED: ' + JSON.stringify(r));",
    "console.log('N05_TO_N06_REAL_PROCESS_E2E_PASS ' + JSON.stringify({source:'N05',target:'N06',capability:'mesh.ping',transport:'HTTP',requestAuthentication:'HMAC-SHA256',responseAuthentication:'HMAC-SHA256',payload:r}));",
  ].join('\n');
  const n05Evidence = await runClient('N05 peer client → N06 actual Next.js runtime', n05Root, n05Driver);
  if (!n05Evidence.includes('N05_TO_N06_REAL_PROCESS_E2E_PASS')) {
    throw new Error('N05 client did not produce the N05→N06 pass marker.\n' + n05Evidence);
  }

  const n06Driver = [
    "import { randomUUID } from 'node:crypto';",
    "import { sendFromN06 } from './lib/soul-mesh/N06PeerAdapter.ts';",
    "const correlation = 'n05-n06-real-process-' + randomUUID();",
    "const r = await sendFromN06('N05', 'mesh.ping', { probe: 'N05_N06_REAL_PROCESS_PAIR' }, 5000, correlation, correlation, 0);",
    "if (!r || r.ok !== true || r.nucleus !== 'N05') throw new Error('N06_TO_N05_CONTRACT_OR_HMAC_FAILED: ' + JSON.stringify(r));",
    "console.log('N06_TO_N05_REAL_PROCESS_E2E_PASS ' + JSON.stringify({source:'N06',target:'N05',capability:'mesh.ping',transport:'HTTP',requestAuthentication:'HMAC-SHA256',responseAuthentication:'HMAC-SHA256',payload:r}));",
  ].join('\n');
  const n06Evidence = await runClient('N06 peer client → N05 actual Next.js runtime', n06Root, n06Driver);
  if (!n06Evidence.includes('N06_TO_N05_REAL_PROCESS_E2E_PASS')) {
    throw new Error('N06 client did not produce the N06→N05 pass marker.\n' + n06Evidence);
  }

  console.log(JSON.stringify({
    system: 'SOUL',
    stage: 'N05_N06_REAL_PROCESS_PAIR_E2E',
    status: 'PASS',
    evidence: {
      independentN05Server: 'actual Next.js production HTTP process',
      independentN06Server: 'actual Next.js production HTTP process',
      n05ClientToN06Server: n05Evidence.trim(),
      n06ClientToN05Server: n06Evidence.trim(),
      transport: 'HTTP',
      requestAuthentication: 'HMAC-SHA256',
      responseAuthentication: 'HMAC-SHA256',
      bearerAuthentication: 'ephemeral CI token on N05-bound traffic',
      secrets: 'ephemeral process environment; never persisted',
    },
    checkedAt: new Date().toISOString(),
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    system: 'SOUL',
    stage: 'N05_N06_REAL_PROCESS_PAIR_E2E',
    status: 'FAILED',
    error: error instanceof Error ? error.message : String(error),
    serverLogs: Object.fromEntries(logs),
  }, null, 2));
  process.exitCode = 1;
} finally {
  await Promise.all(children.reverse().map(stop));
}
