import type { PublicProcess, PublicationState } from './types';
import type { PublicationEntry } from './publications';
import type { groupRectorProcesses } from './process-relations';

export interface RectorComplementary {
  process: PublicProcess;
  publication?: PublicationEntry;
  editorialState: PublicationState;
}
export interface RectorGroup {
  rector: PublicProcess;
  publication?: PublicationEntry;
  editorialState: PublicationState;
  complementaries: RectorComplementary[];
  transversals: ReturnType<typeof groupRectorProcesses>['transversals'];
}
