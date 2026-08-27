export const NUCLEUS_ID = 'N06' as const;
export const N01_REFERENCE_TRANSPORTS = ['IN_PROCESS','WEBVIEW_BRIDGE','LOOPBACK_HTTP','HTTP','REALTIME'] as const;
export type N01Transport = typeof N01_REFERENCE_TRANSPORTS[number];
export const N06_PEERS = ['N01','N02','N03','N04','N05'] as const;
export const N06_IMPLEMENTED_TRANSPORTS: readonly N01Transport[] = ['IN_PROCESS','HTTP'];
export const N06_ADAPTER_TARGETS: readonly N01Transport[] = ['WEBVIEW_BRIDGE','LOOPBACK_HTTP','REALTIME'];
export function negotiateTransport(local: readonly N01Transport[], remote: readonly N01Transport[]): N01Transport | null { return N01_REFERENCE_TRANSPORTS.find((t)=>local.includes(t)&&remote.includes(t)) ?? null; }
export function channelFor(source:string,target:string,direction:'IN'|'OUT'): string { return `${source}.${direction}.${target}`; }
