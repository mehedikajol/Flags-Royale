import { DropKind } from '../models/drop';

export const COUNT = 20;
export const R = 350;
export const BR = 20;
export const PAD = 20;

// Power-up drops: every DROP_EVERY seconds of play one falls from the top, lined up with a random flag.
export const DROP_EVERY = 10;
export const DROP_R = 14;
export const DROP_SPEED = 260;
// Relative odds of each drop kind.
export const DROP_WEIGHTS: Record<DropKind, number> = { shield: 2, freeze: 1, bomb: 1 };

// Shield: the flag it hits can't be cut by the blade for SHIELD_TIME seconds.
export const SHIELD_TIME = 5;
export const SHIELD_COLOR = '#4fd1ff';

// Freeze: when any flag catches it, the blade stops and can't cut for FREEZE_TIME seconds.
export const FREEZE_TIME = 2;
export const FREEZE_COLOR = '#a8e6ff';

// Bomb: ignores flags and explodes after a random fuse (or on reaching the bottom rim),
// throwing every flag within BOMB_RADIUS outward toward the rim.
export const BOMB_RADIUS = 170;
export const BOMB_FORCE = 700;
export const BOMB_COLOR = '#ff8a3d';
export const BOMB_FUSE_MIN = 0.8;
export const BOMB_FUSE_MAX = 2.6;
