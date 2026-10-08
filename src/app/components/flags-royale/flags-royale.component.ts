import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { BR, COUNT, DROP_R, DROP_SPEED, PAD, R, SHIELD_COLOR, SHIELD_EVERY, SHIELD_TIME } from '../../data/constants';
import { FLAG_POOLS, FLAGS } from '../../data/flags.data';
import { Ball } from '../../models/ball';
import { Debris } from '../../models/debris';
import { ElimEntry } from '../../models/elimEntry';
import { Flag } from '../../models/flag';
import { FlagPool } from '../../models/flagPool';
import { ShieldDrop } from '../../models/shieldDrop';
import { Spark } from '../../models/spark';

@Component({
  selector: 'app-flags-royale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flags-royale.component.html',
  styleUrls: ['./flags-royale.component.css'],
})
export class FlagsRoyaleComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cv') cvRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wc') wcRef!: ElementRef<HTMLCanvasElement>;

  flagCount = COUNT;
  flagPoolId = 'all';
  aliveCount = COUNT;
  total = COUNT;
  showWin = false;
  winName = '';
  startLabel = 'Start';
  speedLabel = 'Normal';
  bladeSpeedLabel = '0.9x';
  eliminated: ElimEntry[] = [];
  allFlags = FLAG_POOLS.at(0)?.id;
  // Settings start collapsed on phones so the controls sit right under the arena.
  settingsOpen = window.matchMedia('(min-width: 860px)').matches;

  get flagPool(): FlagPool {
    return FLAG_POOLS.find((p) => p.id === this.flagPoolId) || FLAG_POOLS[0];
  }

  pools = FLAG_POOLS;

  private g!: CanvasRenderingContext2D;
  private wg!: CanvasRenderingContext2D;
  private balls: Ball[] = [];
  private debris: Debris[] = [];
  private sparks: Spark[] = [];
  private drops: ShieldDrop[] = [];
  private dropTimer = SHIELD_EVERY;
  private clock = 0;
  private state: 'ready' | 'running' | 'paused' | 'over' = 'ready';
  private bladeA = -Math.PI / 2;
  private shake = 0;
  private flash = 0;
  private scale = 1;
  private dpr = 1;
  private labelPx = 11;
  private col: Record<string, string> = {};
  private flagImgMap = new Map<string, HTMLImageElement>();
  private rafId = 0;
  private last = 0;
  private resizeObserver?: ResizeObserver;

  opts = { speed: 220, bladeSpeed: 0.9, bladeArc: 45 };

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    const cv = this.cvRef.nativeElement;
    this.g = cv.getContext('2d')!;
    this.wg = this.wcRef.nativeElement.getContext('2d')!;
    this.readColors();
    this.resize();
    this.preloadFlags();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(cv);
    this.setup();
    this.last = performance.now();
    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame((t) => this.frame(t));
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
  }

  // ---------- Painting ----------
  private drawBadge(g: CanvasRenderingContext2D, f: Flag, x: number, y: number, r: number): void {
    g.save();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.clip();
    const img = this.flagImgMap.get(f.code);
    if (img && img.complete && img.naturalWidth > 0) {
      g.drawImage(img, x - 1.5 * r, y - r, 3 * r, 2 * r);
    }
    g.restore();
  }

  icon(f: Flag): string {
    return `https://flagcdn.com/w40/${f.code.toLowerCase()}.png`;
  }

  iconSrcset(f: Flag): string {
    return `https://flagcdn.com/w80/${f.code.toLowerCase()}.png 2x`;
  }

  private preloadFlags(): void {
    for (const f of FLAGS) {
      if (!this.flagImgMap.has(f.code)) {
        const img = new Image();
        img.src = `https://flagcdn.com/w80/${f.code}.png`;
        img.srcset = `https://flagcdn.com/w40/${f.code}.png 1x, https://flagcdn.com/w80/${f.code}.png 2x`;
        this.flagImgMap.set(f.code, img);
      }
    }
  }

  // ---------- Setup ----------
  private shuffle<T>(a: T[]): T[] {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private readColors(): void {
    const s = getComputedStyle(this.cvRef.nativeElement);
    for (const k of ['arena', 'arena-2', 'ring', 'steel', 'hazard', 'cut']) {
      this.col[k] = s.getPropertyValue('--' + k).trim();
    }
  }

  private resize(): void {
    const cv = this.cvRef.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = cv.clientWidth;
    cv.width = Math.round(size * this.dpr);
    cv.height = Math.round(size * this.dpr);
    this.scale = cv.width / (2 * R + 2 * PAD);
    // Keep flag names at least ~9 CSS px tall when the arena is drawn small.
    const cssScale = size / (2 * R + 2 * PAD);
    this.labelPx = cssScale > 0 ? Math.min(20, Math.max(11, 9 / cssScale)) : 11;
  }

  private setup(): void {
    const picks = this.shuffle(this.flagPool.flags).slice(0, this.flagCount);
    this.balls = [];
    for (const f of picks) {
      let x = 0,
        y = 0,
        tries = 0;
      do {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * (R - BR - 14);
        x = Math.cos(a) * d;
        y = Math.sin(a) * d;
        tries++;
      } while (tries < 400 && this.balls.some((b) => Math.hypot(b.x - x, b.y - y) < BR * 2 + 4));
      const va = Math.random() * Math.PI * 2;
      this.balls.push({
        f,
        x,
        y,
        vx: Math.cos(va),
        vy: Math.sin(va),
        alive: true,
        shield: 0,
      });
    }
    this.debris = [];
    this.sparks = [];
    this.drops = [];
    this.dropTimer = SHIELD_EVERY;
    this.bladeA = -Math.PI / 2;
    this.state = 'ready';
    this.eliminated = [];
    this.showWin = false;
    this.aliveCount = this.flagCount;
    this.total = this.flagCount;
    this.startLabel = 'Start';
    this.cdr.detectChanges();
  }

  private aliveCountNum(): number {
    return this.balls.reduce((n, b) => n + (b.alive ? 1 : 0), 0);
  }

  private angDiff(a: number, b: number): number {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  }

  private step(dt: number, lethal: boolean): void {
    if (lethal) {
      this.bladeA += this.opts.bladeSpeed * dt;
      this.stepDrops(dt);
    }
    const half = (this.opts.bladeArc * Math.PI) / 360;

    for (const b of this.balls) {
      if (!b.alive) continue;
      if (lethal && b.shield > 0) b.shield = Math.max(0, b.shield - dt);
      const w = (Math.random() - 0.5) * 2.4 * dt;
      const c = Math.cos(w),
        s = Math.sin(w);
      const nvx = b.vx * c - b.vy * s;
      const nvy = b.vx * s + b.vy * c;
      b.vx = nvx;
      b.vy = nvy;
      b.x += b.vx * this.opts.speed * dt;
      b.y += b.vy * this.opts.speed * dt;
      const d = Math.hypot(b.x, b.y);
      if (d + BR >= R) {
        const a = Math.atan2(b.y, b.x);
        const onBlade = lethal && this.angDiff(a, this.bladeA) < half + (BR / R) * 0.6;
        if (onBlade && b.shield <= 0) {
          this.kill(b, a);
          continue;
        }
        const nx = b.x / d,
          ny = b.y / d;
        b.x = nx * (R - BR);
        b.y = ny * (R - BR);
        const vn = b.vx * nx + b.vy * ny;
        if (vn > 0) {
          b.vx -= 2 * vn * nx;
          b.vy -= 2 * vn * ny;
          // Shielded flag glances off the blade.
          if (onBlade) this.burst(nx * R, ny * R, a + Math.PI, 12, SHIELD_COLOR);
        }
      }
    }

    // flag-to-flag bounces
    for (let i = 0; i < this.balls.length; i++) {
      const p = this.balls[i];
      if (!p.alive) continue;
      for (let j = i + 1; j < this.balls.length; j++) {
        const q = this.balls[j];
        if (!q.alive) continue;
        const dx = q.x - p.x,
          dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        const m = BR * 2;
        if (d2 < m * m && d2 > 1e-6) {
          const d = Math.sqrt(d2),
            nx = dx / d,
            ny = dy / d;
          const o = (m - d) / 2;
          p.x -= nx * o;
          p.y -= ny * o;
          q.x += nx * o;
          q.y += ny * o;
          const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
          if (rel < 0) {
            p.vx += rel * nx;
            p.vy += rel * ny;
            q.vx -= rel * nx;
            q.vy -= rel * ny;
          }
        }
      }
    }

    for (const b of this.balls) {
      const s = Math.hypot(b.vx, b.vy) || 1;
      b.vx /= s;
      b.vy /= s;
    }
  }

  // ---------- Shield drops ----------
  private stepDrops(dt: number): void {
    this.dropTimer -= dt;
    if (this.dropTimer <= 0) {
      this.dropTimer += SHIELD_EVERY;
      this.spawnDrop();
    }

    for (const d of this.drops) {
      d.y += d.vy * dt;
      d.wobble += dt;
    }

    this.drops = this.drops.filter((d) => {
      const hit = this.balls.find((b) => b.alive && Math.hypot(b.x - d.x, b.y - d.y) < BR + DROP_R);
      if (hit) {
        hit.shield = SHIELD_TIME;
        this.burst(d.x, d.y, -Math.PI / 2, 20, SHIELD_COLOR, Math.PI * 2);
        return false;
      }
      // Missed everything and reached the bottom rim: fizzle out.
      if (d.y > 0 && Math.hypot(d.x, d.y) + DROP_R > R) {
        this.burst(d.x, d.y, -Math.PI / 2, 8, SHIELD_COLOR, 1.6);
        return false;
      }
      return true;
    });
  }

  private spawnDrop(): void {
    // Random spot along the top, kept away from the edges where the arena is too shallow.
    const lim = R - 60;
    const x = (Math.random() * 2 - 1) * lim;
    this.drops.push({ x, y: -R - PAD - DROP_R, vy: DROP_SPEED, wobble: 0 });
  }

  private burst(x: number, y: number, dir: number, n: number, color: string, spread = 1.8): void {
    for (let i = 0; i < n; i++) {
      const sa = dir + (Math.random() - 0.5) * spread;
      const sp = 80 + Math.random() * 240;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(sa) * sp,
        vy: Math.sin(sa) * sp,
        life: 0.3 + Math.random() * 0.35,
        hot: false,
        color,
      });
    }
  }

  private kill(b: Ball, a: number): void {
    b.alive = false;
    const left = this.aliveCountNum();
    const nx = Math.cos(a),
      ny = Math.sin(a);
    const tx = -ny,
      ty = nx;
    const rot = Math.atan2(ny, nx);

    for (const side of [1, -1]) {
      this.debris.push({
        f: b.f,
        x: b.x,
        y: b.y,
        vx: b.vx * this.opts.speed * 0.3 + tx * side * 170 - nx * 90,
        vy: b.vy * this.opts.speed * 0.3 + ty * side * 170 - ny * 90,
        rot,
        rot0: rot,
        vr: side * (4 + Math.random() * 4),
        side,
        life: 1,
      });
    }

    for (let i = 0; i < 22; i++) {
      const sa = a + Math.PI + (Math.random() - 0.5) * 1.8;
      const sp = 120 + Math.random() * 320;
      this.sparks.push({
        x: nx * R,
        y: ny * R,
        vx: Math.cos(sa) * sp,
        vy: Math.sin(sa) * sp,
        life: 0.35 + Math.random() * 0.4,
        hot: Math.random() < 0.5,
      });
    }

    this.shake = 7;
    this.flash = 1;
    this.eliminated = [{ rank: left + 1, flag: b.f }, ...this.eliminated];
    this.aliveCount = left;
    this.cdr.detectChanges();

    if (left === 1) this.finish();
  }

  private finish(): void {
    this.state = 'over';
    this.drops = [];
    this.startLabel = 'Play again';
    const w = this.balls.find((b) => b.alive)!;
    this.eliminated = [{ rank: 1, flag: w.f }, ...this.eliminated];
    this.aliveCount = 1;
    this.startLabel = 'Play again';
    this.cdr.detectChanges();

    const wg = this.wg;
    wg.clearRect(0, 0, 240, 240);
    this.drawBadge(wg, w.f, 120, 120, 116);
    wg.lineWidth = 6;
    wg.strokeStyle = this.col['hazard'];
    wg.beginPath();
    wg.arc(120, 120, 116, 0, Math.PI * 2);
    wg.stroke();

    this.winName = w.f.n;
    setTimeout(() => {
      this.ngZone.run(() => {
        this.showWin = true;
        this.cdr.detectChanges();
      });
    }, 700);
  }

  private updateFx(dt: number): void {
    for (const p of this.debris) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.rot += p.vr * dt;
      p.life -= dt * 0.9;
    }
    this.debris = this.debris.filter((p) => p.life > 0);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.94;
      s.vy *= 0.94;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    this.shake *= Math.pow(0.02, dt);
    this.flash = Math.max(0, this.flash - dt * 3);
  }

  private frame(t: number): void {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.clock += dt;
    if (this.state === 'running' || this.state === 'over') {
      for (let i = 0; i < 4; i++) this.step(dt / 4, this.state === 'running');
    }
    this.updateFx(dt);
    this.render();
    this.rafId = requestAnimationFrame((ft) => this.frame(ft));
  }

  private render(): void {
    const g = this.g;
    const cv = this.cvRef.nativeElement;
    const W = cv.width,
      H = cv.height;
    const sc = this.scale;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    g.setTransform(sc, 0, 0, sc, W / 2 + sx * sc, H / 2 + sy * sc);

    const grad = g.createRadialGradient(0, 0, 20, 0, 0, R);
    grad.addColorStop(0, this.col['arena-2']);
    grad.addColorStop(1, this.col['arena']);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = 'rgba(255,255,255,.05)';
    g.lineWidth = 1;
    for (const rr of [R * 0.33, R * 0.66]) {
      g.beginPath();
      g.arc(0, 0, rr, 0, Math.PI * 2);
      g.stroke();
    }

    g.fillStyle = 'rgba(255,255,255,.07)';
    g.font = '800 150px "Bricolage Grotesque", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(this.aliveCount), 0, 8);

    g.lineWidth = 8;
    g.strokeStyle = this.col['ring'];
    g.beginPath();
    g.arc(0, 0, R + 4, 0, Math.PI * 2);
    g.stroke();

    if (this.flash > 0) {
      g.lineWidth = 8;
      g.strokeStyle = `rgba(255,90,78,${this.flash * 0.6})`;
      g.beginPath();
      g.arc(0, 0, R + 4, 0, Math.PI * 2);
      g.stroke();
    }

    const half = (this.opts.bladeArc * Math.PI) / 360;
    g.save();
    g.rotate(this.bladeA);

    if (this.state === 'running') {
      for (let i = 0; i < 8; i++) {
        g.strokeStyle = `rgba(245,197,24,${0.16 * (1 - i / 8)})`;
        g.lineWidth = 10;
        g.beginPath();
        g.arc(0, 0, R + 4, -half - (i + 1) * 0.06, -half - i * 0.06);
        g.stroke();
      }
    }

    g.shadowColor = this.col['hazard'];
    g.shadowBlur = 14;
    g.lineWidth = 12;
    g.strokeStyle = this.col['hazard'];
    g.beginPath();
    g.arc(0, 0, R + 4, -half, half);
    g.stroke();
    g.shadowBlur = 0;

    const teeth = Math.max(4, Math.round(this.opts.bladeArc / 5));
    const st = (2 * half) / teeth;
    g.fillStyle = this.col['steel'];
    g.strokeStyle = this.col['cut'];
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = -half + i * st;
      const a1 = a0 + st;
      const tip = a0 + st * 0.8;
      g.moveTo(Math.cos(a0) * (R + 1), Math.sin(a0) * (R + 1));
      g.lineTo(Math.cos(tip) * (R - 17), Math.sin(tip) * (R - 17));
      g.lineTo(Math.cos(a1) * (R + 1), Math.sin(a1) * (R + 1));
    }
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();

    const lp = this.labelPx;
    g.font = `600 ${lp}px "Bricolage Grotesque", system-ui, sans-serif`;
    for (const b of this.balls) {
      if (!b.alive) continue;
      g.save();
      g.shadowColor = 'rgba(0,0,0,.45)';
      g.shadowBlur = 8;
      g.shadowOffsetY = 3;
      g.fillStyle = '#000';
      g.beginPath();
      g.arc(b.x, b.y, BR, 0, Math.PI * 2);
      g.fill();
      g.restore();
      this.drawBadge(g, b.f, b.x, b.y, BR);
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(255,255,255,.85)';
      g.beginPath();
      g.arc(b.x, b.y, BR, 0, Math.PI * 2);
      g.stroke();
      if (b.shield > 0) this.drawShield(g, b);
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillText(b.f.n, b.x + 1, b.y + BR + lp);
      g.fillStyle = '#eef1f6';
      g.fillText(b.f.n, b.x, b.y + BR + lp - 1);
    }

    for (const p of this.debris) {
      g.save();
      g.globalAlpha = Math.max(0, p.life);
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.beginPath();
      if (p.side > 0) g.rect(-BR - 2, 0, 2 * BR + 4, BR + 2);
      else g.rect(-BR - 2, -BR - 2, 2 * BR + 4, BR + 2);
      g.clip();
      g.rotate(-p.rot0);
      this.drawBadge(g, p.f, 0, 0, BR);
      g.restore();
    }

    for (const d of this.drops) this.drawDrop(g, d);

    for (const sp of this.sparks) {
      g.fillStyle = sp.color ?? (sp.hot ? this.col['hazard'] : '#ffffff');
      g.globalAlpha = Math.min(1, sp.life * 2.5);
      g.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3);
    }
    g.globalAlpha = 1;
  }

  private shieldPath(g: CanvasRenderingContext2D, r: number): void {
    g.beginPath();
    g.moveTo(0, -r);
    g.lineTo(r * 0.85, -r * 0.6);
    g.lineTo(r * 0.75, r * 0.2);
    g.quadraticCurveTo(r * 0.5, r * 0.75, 0, r);
    g.quadraticCurveTo(-r * 0.5, r * 0.75, -r * 0.75, r * 0.2);
    g.lineTo(-r * 0.85, -r * 0.6);
    g.closePath();
  }

  private drawDrop(g: CanvasRenderingContext2D, d: ShieldDrop): void {
    g.save();
    const trail = g.createLinearGradient(d.x, d.y - 70, d.x, d.y);
    trail.addColorStop(0, 'rgba(79,209,255,0)');
    trail.addColorStop(1, 'rgba(79,209,255,.55)');
    g.strokeStyle = trail;
    g.lineWidth = DROP_R * 0.9;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(d.x, d.y - 70);
    g.lineTo(d.x, d.y);
    g.stroke();

    g.translate(d.x, d.y);
    g.rotate(Math.sin(d.wobble * 6) * 0.25);
    g.shadowColor = SHIELD_COLOR;
    g.shadowBlur = 16;
    this.shieldPath(g, DROP_R);
    g.fillStyle = SHIELD_COLOR;
    g.fill();
    g.shadowBlur = 0;
    g.lineWidth = 2;
    g.strokeStyle = '#ffffff';
    g.stroke();
    this.shieldPath(g, DROP_R * 0.45);
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.fill();
    g.restore();
  }

  private drawShield(g: CanvasRenderingContext2D, b: Ball): void {
    // Blink during the last 1.5s so it's clear the shield is about to drop.
    const ending = b.shield < 1.5;
    if (ending && Math.sin(this.clock * 24) < 0) return;
    const pulse = 0.5 + 0.5 * Math.sin(this.clock * 8);
    g.save();
    g.fillStyle = `rgba(79,209,255,${0.12 + pulse * 0.1})`;
    g.beginPath();
    g.arc(b.x, b.y, BR + 6, 0, Math.PI * 2);
    g.fill();
    g.shadowColor = SHIELD_COLOR;
    g.shadowBlur = 12;
    g.strokeStyle = SHIELD_COLOR;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(b.x, b.y, BR + 6, 0, Math.PI * 2);
    g.stroke();
    // Remaining time as a sweep around the flag.
    g.shadowBlur = 0;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(b.x, b.y, BR + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * b.shield) / SHIELD_TIME);
    g.stroke();
    g.restore();
  }

  toggleStart(): void {
    if (this.state === 'over') {
      this.setup();
      this.state = 'running';
      this.startLabel = 'Pause';
    } else if (this.state === 'running') {
      this.state = 'paused';
      this.startLabel = 'Resume';
    } else {
      this.state = 'running';
      this.startLabel = 'Pause';
    }
  }

  newRound(): void {
    this.setup();
  }

  playAgain(): void {
    this.setup();
    this.state = 'running';
    this.startLabel = 'Pause';
  }

  onFlagPoolChange(e: Event): void {
    this.flagPoolId = (e.target as HTMLSelectElement).value;
    const flagsCount = FLAG_POOLS.filter((f) => f.id === this.flagPoolId)[0].flags.length;

    if (this.flagPoolId !== FLAG_POOLS[0].id) {
      this.flagCount = flagsCount;
    }
    this.total = flagsCount;
    this.newRound();
    this.cdr.detectChanges();
  }

  onFlagCount(e: Event): void {
    const v = +(e.target as HTMLInputElement).value;
    this.flagCount = Math.max(2, Math.min(v, this.flagPool.flags.length));
    this.total = this.flagCount;
    this.cdr.detectChanges();
  }

  onSpeed(e: Event): void {
    const v = +(e.target as HTMLInputElement).value;
    this.opts.speed = v;
    if (v < 160) this.speedLabel = 'Slow';
    else if (v < 290) this.speedLabel = 'Normal';
    else this.speedLabel = 'Fast';
  }

  onBladeSpeed(e: Event): void {
    const v = +(e.target as HTMLInputElement).value;
    this.opts.bladeSpeed = v / 100;
    this.bladeSpeedLabel = (v / 100).toFixed(1) + '×';
  }

  onBladeArc(e: Event): void {
    const v = +(e.target as HTMLInputElement).value;
    this.opts.bladeArc = v;
  }
}
