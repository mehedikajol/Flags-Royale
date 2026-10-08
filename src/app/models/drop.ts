export type DropKind = 'shield' | 'freeze' | 'bomb';

export interface Drop {
  kind: DropKind;
  x: number;
  y: number;
  vy: number;
  wobble: number;
  // Bombs only: seconds left until it goes off.
  fuse: number;
}
