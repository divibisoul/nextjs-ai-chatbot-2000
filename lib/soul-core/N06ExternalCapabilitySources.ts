/**
 * External capability source catalog for N06.
 *
 * This is a discovery/provenance catalog, not an execution authority.
 * A candidate becomes executable only after a native N06 handler/adapter
 * is registered in N06Processor.
 */

export type ExternalCapabilityClass =
  | 'agents'
  | 'planning'
  | 'tools'
  | 'memory'
  | 'knowledge'
  | 'online-learning'
  | 'neural-ml'
  | 'sandbox'
  | 'engineering'
  | 'evaluation'
  | 'safety'
  | 'research'
  | 'algorithms'
  | 'integration'
  | 'multimodal';

export type ExternalIntegrationStrategy =
  | 'WHOLE'
  | 'SELECTIVE'
  | 'ADAPTER'
  | 'REFERENCE';

export interface ExternalCapabilitySource {
  readonly id: string;
  readonly sourceRepository: string;
  readonly sourcePath?: string;
  readonly capabilityClass: ExternalCapabilityClass;
  readonly capability: string;
  readonly targetNuclei: readonly string[];
  readonly strategy: ExternalIntegrationStrategy;
  readonly licenseScope: string;
  readonly status: 'candidate';
}

export const N06_EXTERNAL_CAPABILITY_SOURCES: readonly ExternalCapabilitySource[] = [
  {
    id: 'EXT-DEERFLOW-TOOL-SEARCH',
    sourceRepository: 'bytedance/deer-flow',
    sourcePath: 'backend/packages/harness/deerflow/tools/builtins/tool_search.py',
    capabilityClass: 'tools',
    capability: 'deferred tool discovery, schema promotion, catalog hashing',
    targetNuclei: ['N06', 'N02', 'N07'],
    strategy: 'ADAPTER',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-DEERFLOW-MEMORY-FTS',
    sourceRepository: 'bytedance/deer-flow',
    sourcePath: 'backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/retrieval.py',
    capabilityClass: 'memory',
    capability: 'FTS5/BM25 retrieval with time-decay, confidence and scope isolation',
    targetNuclei: ['N06', 'N03', 'N05', 'SARA'],
    strategy: 'ADAPTER',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-DEERFLOW-SANDBOX',
    sourceRepository: 'bytedance/deer-flow',
    sourcePath: 'backend/packages/harness/deerflow/sandbox/sandbox.py',
    capabilityClass: 'sandbox',
    capability: 'sandbox abstraction and controlled code execution',
    targetNuclei: ['N06', 'N05', 'N07'],
    strategy: 'ADAPTER',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-DEERFLOW-MCP',
    sourceRepository: 'bytedance/deer-flow',
    sourcePath: 'backend/packages/harness/deerflow/mcp/tools.py',
    capabilityClass: 'integration',
    capability: 'MCP tool integration/routing',
    targetNuclei: ['N06', 'N02', 'N07'],
    strategy: 'ADAPTER',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-RIVER-DRIFT',
    sourceRepository: 'online-ml/river',
    sourcePath: 'river/drift/binary/hddm_a.py',
    capabilityClass: 'online-learning',
    capability: 'online concept-drift detection',
    targetNuclei: ['N06', 'N07', 'SARA'],
    strategy: 'SELECTIVE',
    licenseScope: 'VERIFY LICENSE AT ACQUISITION',
    status: 'candidate',
  },
  {
    id: 'EXT-RIVER-PIPELINE',
    sourceRepository: 'online-ml/river',
    sourcePath: 'river/compose/pipeline.py',
    capabilityClass: 'online-learning',
    capability: 'composable incremental-learning pipeline',
    targetNuclei: ['N06', 'N07'],
    strategy: 'SELECTIVE',
    licenseScope: 'VERIFY LICENSE AT ACQUISITION',
    status: 'candidate',
  },
  {
    id: 'EXT-AUTOGPT-TOOLS',
    sourceRepository: 'Significant-Gravitas/AutoGPT',
    sourcePath: 'autogpt_platform/backend/backend/copilot/tools/base.py',
    capabilityClass: 'tools',
    capability: 'agent tool abstractions and integrations',
    targetNuclei: ['N06', 'N05', 'N02'],
    strategy: 'ADAPTER',
    licenseScope: 'PLATFORM PATH IS POLYFORM SHIELD',
    status: 'candidate',
  },
  {
    id: 'EXT-AUTOGPT-GRAPHITI',
    sourceRepository: 'Significant-Gravitas/AutoGPT',
    sourcePath: 'autogpt_platform/backend/backend/copilot/graphiti',
    capabilityClass: 'knowledge',
    capability: 'graph-based memory/knowledge search',
    targetNuclei: ['N03', 'N05', 'SARA'],
    strategy: 'SELECTIVE',
    licenseScope: 'PLATFORM PATH IS POLYFORM SHIELD',
    status: 'candidate',
  },
  {
    id: 'EXT-AUTOGPT-SANDBOX',
    sourceRepository: 'Significant-Gravitas/AutoGPT',
    sourcePath: 'autogpt_platform/backend/backend/copilot/tools/sandbox.py',
    capabilityClass: 'sandbox',
    capability: 'sandbox-backed agent tool execution',
    targetNuclei: ['N05', 'N06', 'N07'],
    strategy: 'SELECTIVE',
    licenseScope: 'PLATFORM PATH IS POLYFORM SHIELD',
    status: 'candidate',
  },
  {
    id: 'EXT-AUTOGPT-PLANNING',
    sourceRepository: 'Significant-Gravitas/AutoGPT',
    sourcePath: 'autogpt_platform/backend/backend/copilot/prompting.py',
    capabilityClass: 'planning',
    capability: 'agent planning/prompt strategies',
    targetNuclei: ['N02', 'N07'],
    strategy: 'SELECTIVE',
    licenseScope: 'PLATFORM PATH IS POLYFORM SHIELD',
    status: 'candidate',
  },
  {
    id: 'EXT-SUPERAGI-TOOLKITS',
    sourceRepository: 'TransformerOptimus/SuperAGI',
    sourcePath: 'superagi',
    capabilityClass: 'tools',
    capability: 'agent toolkits and external integrations',
    targetNuclei: ['N05', 'N06', 'N02'],
    strategy: 'SELECTIVE',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-SUPERAGI-WORKFLOWS',
    sourceRepository: 'TransformerOptimus/SuperAGI',
    sourcePath: 'superagi',
    capabilityClass: 'planning',
    capability: 'workflow/ReAct execution primitives',
    targetNuclei: ['N07', 'N02'],
    strategy: 'SELECTIVE',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-SUPERAGI-MEMORY',
    sourceRepository: 'TransformerOptimus/SuperAGI',
    sourcePath: 'superagi',
    capabilityClass: 'memory',
    capability: 'agent memory/vector-store integration',
    targetNuclei: ['N03', 'N05'],
    strategy: 'SELECTIVE',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-BABYAGI-PLANNER',
    sourceRepository: 'yoheinakajima/babyagi',
    sourcePath: 'README.md',
    capabilityClass: 'planning',
    capability: 'task planning, function registration and execution loop',
    targetNuclei: ['N07', 'N02', 'N06'],
    strategy: 'SELECTIVE',
    licenseScope: 'VERIFY LICENSE AT ACQUISITION',
    status: 'candidate',
  },
  {
    id: 'EXT-SUPERPOWERS-SKILLS',
    sourceRepository: 'obra/superpowers',
    sourcePath: 'skills',
    capabilityClass: 'engineering',
    capability: 'composable engineering skills, planning, TDD and subagent workflow',
    targetNuclei: ['N06', 'N05', 'N02'],
    strategy: 'SELECTIVE',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-ECC-SKILLS',
    sourceRepository: 'mit-network/everything-claude-code',
    sourcePath: 'skills',
    capabilityClass: 'engineering',
    capability: 'skills, rules, hooks, agents and evaluation harness',
    targetNuclei: ['N06', 'N05', 'N02', 'SARA'],
    strategy: 'SELECTIVE',
    licenseScope: 'MIT',
    status: 'candidate',
  },
  {
    id: 'EXT-GRAPH4NLP',
    sourceRepository: 'graph4ai/graph4nlp',
    sourcePath: 'graph4nlp/pytorch',
    capabilityClass: 'knowledge',
    capability: 'graph construction, graph embeddings, Graph2Seq/Graph2Tree and semantic parsing',
    targetNuclei: ['N03', 'N04', 'SARA'],
    strategy: 'SELECTIVE',
    licenseScope: 'Apache-2.0',
    status: 'candidate',
  },
  {
    id: 'EXT-RASA-DIALOGUE',
    sourceRepository: 'RasaHQ/rasa',
    sourcePath: 'rasa',
    capabilityClass: 'agents',
    capability: 'dialogue/NLU, policies, actions and conversational orchestration',
    targetNuclei: ['N02', 'N04', 'N07'],
    strategy: 'SELECTIVE',
    licenseScope: 'Apache-2.0',
    status: 'candidate',
  },
  {
    id: 'EXT-TENSORFLOW',
    sourceRepository: 'tensorflow/tensorflow',
    sourcePath: 'tensorflow',
    capabilityClass: 'neural-ml',
    capability: 'tensor operations, training and ML runtime primitives',
    targetNuclei: ['N06', 'N07', 'SARA'],
    strategy: 'SELECTIVE',
    licenseScope: 'Apache-2.0',
    status: 'candidate',
  },
  {
    id: 'EXT-JS-ALGORITHMS',
    sourceRepository: 'trekhleb/javascript-algorithms',
    sourcePath: 'src',
    capabilityClass: 'algorithms',
    capability: 'data structures and algorithm implementations',
    targetNuclei: ['N06', 'SARA'],
    strategy: 'REFERENCE',
    licenseScope: 'VERIFY FILE/LICENSE SCOPE AT ACQUISITION',
    status: 'candidate',
  },
  {
    id: 'EXT-BYOX',
    sourceRepository: 'codecrafters-io/build-your-own-x',
    sourcePath: 'README.md',
    capabilityClass: 'algorithms',
    capability: 'reference implementations for understanding/building systems',
    targetNuclei: ['N06', 'SARA'],
    strategy: 'REFERENCE',
    licenseScope: 'VERIFY PER SUBPROJECT',
    status: 'candidate',
  },
  {
    id: 'EXT-CIU',
    sourceRepository: 'jwasham/coding-interview-university',
    sourcePath: 'README.md',
    capabilityClass: 'engineering',
    capability: 'algorithm/systems curriculum for skill acquisition',
    targetNuclei: ['N06', 'SARA'],
    strategy: 'REFERENCE',
    licenseScope: 'CC-BY-SA-4.0 (curriculum content)',
    status: 'candidate',
  },
  {
    id: 'EXT-AGI-RESOURCES',
    sourceRepository: 'nellaivijay/awesome-agi-aci-asi',
    sourcePath: 'README.md',
    capabilityClass: 'research',
    capability: 'AGI/ASI research, infrastructure, safety and governance index',
    targetNuclei: ['SARA', 'N07', 'N06'],
    strategy: 'REFERENCE',
    licenseScope: 'Apache-2.0',
    status: 'candidate',
  },
  {
    id: 'EXT-AGI-PAPERS',
    sourceRepository: 'gyunggyung/AGI-Papers',
    sourcePath: 'README.md',
    capabilityClass: 'research',
    capability: 'curated agents, architecture, training, evaluation, RAG and on-device research',
    targetNuclei: ['SARA', 'N03', 'N04', 'N07'],
    strategy: 'REFERENCE',
    licenseScope: 'VERIFY PER SOURCE/PAPER',
    status: 'candidate',
  },
] as const;

export function getN06ExternalCapabilityCandidates(
  query?: string,
): readonly ExternalCapabilitySource[] {
  if (!query?.trim()) return N06_EXTERNAL_CAPABILITY_SOURCES;
  const needle = query.trim().toLowerCase();
  return N06_EXTERNAL_CAPABILITY_SOURCES.filter((source) =>
    [
      source.id,
      source.sourceRepository,
      source.sourcePath ?? '',
      source.capabilityClass,
      source.capability,
      ...source.targetNuclei,
    ]
      .join(' ')
      .toLowerCase()
      .includes(needle),
  );
}
