export type DropKind = 'shield' | 'freeze' | 'bomb' | 'ghost' | 'speed';

export interface Drop {
  kind: DropKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  // Bombs only: seconds left until it goes off.
  fuse: number;
  // Missed drops become "loose": they bounce slowly around the arena until caught or `life` runs out.
  loose: boolean;
  life: number;
}
