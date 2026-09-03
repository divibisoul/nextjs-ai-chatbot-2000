import { N06Processor, n06Processor } from './N06Processor';

/** Canonical architectural name for N06. N06Processor is retained only as a compatibility implementation name. */
export class N06CapabilityEngine extends N06Processor {}

/** Canonical singleton remains backed by the single N06 execution authority. */
export const n06CapabilityEngine = n06Processor as N06CapabilityEngine;
