export type N06ArtifactType = 'cognitive-synthesis' | 'audit-report' | 'artifact';

export type N06ArtifactInput = {
  content: unknown;
  type?: N06ArtifactType;
  metadata?: Record<string, unknown>;
};

export type N06ArtifactResult = {
  cid: string;
  gatewayUrl: string;
};

const WEB3_STORAGE_API_URL = process.env.WEB3_STORAGE_API_URL ?? 'https://api.web3.storage';
const IPFS_GATEWAY_URL = process.env.WEB3_STORAGE_GATEWAY_URL ?? 'https://w3s.link/ipfs';
const STORAGE_TABLE = process.env.SUPABASE_STORAGE_TABLE ?? 'soul_storage_records';

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function upload(content: string, filename: string): Promise<string> {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) throw new Error('WEB3_STORAGE_TOKEN is not configured');
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'application/json; charset=utf-8' }), filename);
  const response = await fetch(`${WEB3_STORAGE_API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(`WEB3_STORAGE_UPLOAD_FAILED:${response.status}`);
  const payload = (await response.json()) as { cid?: string };
  if (!payload.cid) throw new Error('WEB3_STORAGE_CID_MISSING');
  return payload.cid;
}

async function registerCid(cid: string, metadata: Record<string, unknown>): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_STORAGE_CONFIGURATION_MISSING');
  const gatewayUrl = `${IPFS_GATEWAY_URL.replace(/\/$/, '')}/${cid}`;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${STORAGE_TABLE}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      nucleus_id: 'N06',
      cid,
      mime_type: 'application/json',
      gateway_url: gatewayUrl,
      metadata: { ...metadata, storage: 'web3.storage' },
    }),
  });
  if (!response.ok) throw new Error(`SUPABASE_STORAGE_RECORD_FAILED:${response.status}`);
}

export async function persistN06Artifact(input: N06ArtifactInput): Promise<N06ArtifactResult> {
  const type = input.type ?? 'artifact';
  const content = stableJson(input.content);
  const filename = `soul-n06-${type}-${Date.now()}.json`;
  const cid = await upload(content, filename);
  await registerCid(cid, { artifactType: type, ...(input.metadata ?? {}) });
  return { cid, gatewayUrl: `${IPFS_GATEWAY_URL.replace(/\/$/, '')}/${cid}` };
}
