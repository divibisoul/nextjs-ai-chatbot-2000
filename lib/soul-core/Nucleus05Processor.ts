/**
 * Compatibility facade for the historical Nucleus05 filename.
 * N06Processor is the single canonical N06 runtime; this file intentionally
 * contains no second processor implementation.
 */
export {
  N06Processor as Nucleus05Processor,
  n06Processor as nucleus06Processor,
  n06Processor as nucleus05Processor,
} from './N06Processor';
export type {
  N06Context as Nucleus06Context,
  N06Context as Nucleus05Context,
  N06Request as Nucleus06Request,
  N06Request as Nucleus05Request,
  N06Pilot as Nucleus06Pilot,
  N06Pilot as Nucleus05Pilot,
  N06Handler as Nucleus06Handler,
  N06Handler as Nucleus05Handler,
} from './N06Processor';
