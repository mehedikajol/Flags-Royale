import { Flag } from './flag';

export interface Debris {
  f: Flag;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rot0: number;
  vr: number;
  side: number;
  life: number;
}
