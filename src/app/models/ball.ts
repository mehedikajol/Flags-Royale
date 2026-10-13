import { Flag } from './flag';

export interface Ball {
  f: Flag;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  shield: number;
  // Seconds left as a ghost: passes through other flags and ignores bomb blasts.
  ghost: number;
  // Seconds left on a speed boost.
  boost: number;
  // Extra velocity from bomb blasts, decays quickly.
  kx: number;
  ky: number;
}
