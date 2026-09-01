import type { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

export const DiffType: {
  readonly Unchanged: 0;
  readonly Deleted: -1;
  readonly Inserted: 1;
};

export function diffEditor(
  schema: Schema,
  oldDoc: Record<string, unknown>,
  newDoc: Record<string, unknown>,
): ProsemirrorNode;

export function patchDocumentNode(
  schema: Schema,
  oldNode: ProsemirrorNode,
  newNode: ProsemirrorNode,
): ProsemirrorNode;

export function patchTextNodes(
  schema: Schema,
  oldNodes: ProsemirrorNode[],
  newNodes: ProsemirrorNode[],
): ProsemirrorNode[];

export function computeChildEqualityFactor(
  node1: ProsemirrorNode | ProsemirrorNode[],
  node2: ProsemirrorNode | ProsemirrorNode[],
): number;

export function assertNodeTypeEqual(
  node1: ProsemirrorNode,
  node2: ProsemirrorNode,
): void;

export function ensureArray<T>(value: T | T[]): T[];
export function isNodeEqual(
  node1: ProsemirrorNode | ProsemirrorNode[],
  node2: ProsemirrorNode | ProsemirrorNode[],
): boolean;
export function normalizeNodeContent(
  node: ProsemirrorNode,
): Array<ProsemirrorNode | ProsemirrorNode[]>;
export function getNodeProperty(
  node: ProsemirrorNode,
  property: string,
): unknown;
export function getNodeAttribute(
  node: ProsemirrorNode,
  attribute: string,
): unknown;
export function getNodeAttributes(
  node: ProsemirrorNode,
): Record<string, unknown>;
export function getNodeMarks(node: ProsemirrorNode): ProsemirrorNode[];
export function getNodeChildren(node: ProsemirrorNode): ProsemirrorNode[];
export function getNodeText(node: ProsemirrorNode): string | undefined;
export function isTextNode(node: ProsemirrorNode): boolean;
export function matchNodeType(
  node1: ProsemirrorNode | ProsemirrorNode[],
  node2: ProsemirrorNode | ProsemirrorNode[],
): boolean;
export function createNewNode(
  oldNode: ProsemirrorNode,
  children: ProsemirrorNode[],
): ProsemirrorNode;
export function createDiffNode(
  schema: Schema,
  node: ProsemirrorNode,
  type: -1 | 1,
): ProsemirrorNode;
export function createDiffMark(
  schema: Schema,
  type: -1 | 1,
): unknown;
export function createTextNode(
  schema: Schema,
  content: string,
  marks?: unknown[],
): ProsemirrorNode;
