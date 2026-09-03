/**
 * @deprecated Compatibility adapter for historical Nucleus05 imports.
 * N06ToolRegistry is the single canonical tool authority.
 */
export {
  createN06Tools as createNucleus06Tools,
  createN06Tools as createNucleus05Tools,
  N06ToolRegistry,
  NUCLEUS_06_TOOL_IDS,
} from './N06ToolRegistry';

export type { N06ToolContext as Nucleus06ToolContext, N06ToolContext as Nucleus05ToolContext } from './N06ToolRegistry';
export type { Nucleus06ToolId as Nucleus05ToolId } from './N06ToolRegistry';
export { NUCLEUS_06_TOOL_IDS as NUCLEUS_05_TOOL_IDS } from './N06ToolRegistry';
