import { Flag } from './flag';

export interface FlagPool {
  id: string;
  name: string;
  flags: Flag[];
}
