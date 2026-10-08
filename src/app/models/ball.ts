import { Flag } from './flag';

export interface Ball {
  f: Flag;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  shield: number;
  // Extra velocity from bomb blasts, decays quickly.
  kx: number;
  ky: number;
}
