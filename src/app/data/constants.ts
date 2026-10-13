import { DropKind } from '../models/drop';

export const COUNT = 20;
export const R = 350;
export const BR = 20;
export const PAD = 20;

// Power-up drops: every DROP_EVERY_MIN–DROP_EVERY_MAX seconds of play (random each time) one falls
// from the top, lined up with a random flag.
export const DROP_EVERY_MIN = 8;
export const DROP_EVERY_MAX = 10;
export const DROP_R = 14;
export const DROP_SPEED = 260;
// Relative odds of each drop kind.
export const DROP_WEIGHTS: Record<DropKind, number> = { shield: 2, freeze: 1, bomb: 1, ghost: 1, speed: 1 };

// Shield: the flag it hits can't be cut by the blade for SHIELD_TIME seconds.
export const SHIELD_TIME = 5;
export const SHIELD_COLOR = '#4fd1ff';

// Freeze: when any flag catches it, the blade stops and can't cut for FREEZE_TIME seconds.
export const FREEZE_TIME = 2;
export const FREEZE_COLOR = '#a8e6ff';

// Bomb: ignores flags and explodes after a random fuse (or on reaching the bottom rim),
// throwing every flag within BOMB_RADIUS outward toward the rim.
export const BOMB_RADIUS = 130;
export const BOMB_FORCE = 700;
export const BOMB_COLOR = '#ff8a3d';
export const BOMB_FUSE_MIN = 0.8;
export const BOMB_FUSE_MAX = 2.6;

// Ghost: the flag it hits passes through other flags and ignores bomb blasts for GHOST_TIME seconds.
// It can still be cut by the blade.
export const GHOST_TIME = 5;
export const GHOST_COLOR = '#c9a7ff';

// Speed boost: the flag it hits moves SPEED_MULT times faster for SPEED_TIME seconds.
export const SPEED_TIME = 3;
export const SPEED_MULT = 1.8;
export const SPEED_COLOR = '#7dff8a';

// Leftovers: a non-bomb drop that misses bounces slowly around the arena until a flag catches it.
// At most LOOSE_MAX at once (the oldest fades out to make room); each expires after LOOSE_TIME seconds.
export const LOOSE_MAX = 3;
export const LOOSE_TIME = 15;
// Fraction of the flag speed that leftovers move at.
export const LOOSE_SPEED = 0.4;
export const LOOSE_SCALE = 0.8;
// How long a leftover takes to fade away when it expires or is pushed out.
export const LOOSE_FADE = 0.4;
