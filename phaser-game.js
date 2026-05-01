/* ═══════════════════════════════════════════════════════
   phaser-game.js — MYTH 2D World (Phaser 3)
   Top-down campus exploration with WASD movement,
   zone detection, NPC proximity + E-key interaction
═══════════════════════════════════════════════════════ */

'use strict';

// Zone rectangle colors (hex ints for Phaser)
const ZONE_FILL_COLORS = {
  outdoor:  0xC8D8A8,
  building: 0xE4D8C8,
  sports:   0xC4D4B0,
  special:  0xE8D8B8,
  hidden:   0xD8C8B0,
};
const ZONE_LINE_COLORS = {
  outdoor:  0x7A9A60,
  building: 0xB8A890,
  sports:   0x7A9A60,
  special:  0xB8902C,
  hidden:   0x906858,
};
const LOCKED_FILL   = 0xB8A898;
const LOCKED_LINE   = 0x8A7868;
const RESTRICTED_FILL = 0xC8BAA8;  // freshman-restricted zones (dimmed)
const WORLD_BG      = 0x3A2E1E;
const PATH_COLOR    = 0xC4B090;

// Layout constants
const ZONE_W   = 380;
const ZONE_H   = 200;
const ZONE_GAP = 20;
const MAP_PAD  = 52;

// Derived world size
const WORLD_W  = MAP_PAD * 2 + 3 * ZONE_W + 2 * ZONE_GAP;
const WORLD_H  = MAP_PAD * 2 + 6 * ZONE_H + 5 * ZONE_GAP;

// Zones accessible to freshmen during orientation (expanded after choice)
const ORIENTATION_ZONES = new Set(['gym', 'locker_rooms', 'basketball_courts']);

// Zone pixel bounds: id → {x, y, w, h}
const ZONE_BOUNDS = {};

function _buildZoneBounds() {
  ZONES.forEach(z => {
    if (!z.mapGrid) return;
    const c = z.mapGrid.col - 1;
    const r = z.mapGrid.row - 1;
    ZONE_BOUNDS[z.id] = {
      x: MAP_PAD + c * (ZONE_W + ZONE_GAP),
      y: MAP_PAD + r * (ZONE_H + ZONE_GAP),
      w: ZONE_W,
      h: ZONE_H,
    };
  });
}

// NPC sprite color by group
function _npcColor(group) {
  if (group === 'mob')     return 0xFC7B54;
  if (group === 'balance') return 0xF7B731;
  if (group === 'grind')   return 0x6BCB77;
  return 0xB0A090;
}

// Player sprite color by friend group
function _playerColor(group) {
  if (group === 'mob')     return 0xFC7B54;
  if (group === 'balance') return 0xF7B731;
  if (group === 'grind')   return 0x6BCB77;
  return 0xEAD9C0;
}

// Stat color helper (mirrors game.js statColor)
function _statColor(key, val) {
  if (key === 'toxicity' || key === 'stress') {
    if (val >= 7) return '#FC7B54';
    if (val >= 4) return '#F7B731';
    return '#6BCB77';
  }
  if (val >= 7) return '#F7B731';
  if (val >= 4) return '#6BCB77';
  return '#FC7B54';
}

const STAT_LABELS_SHORT = {
  gpa: 'GPA', friendships: 'FRIENDSHIPS', relationships: 'RELATIONSHIPS',
  toxicity: 'TOXICITY', looks: 'LOOKS', physique: 'PHYSIQUE',
  athleticism: 'ATHLETICISM', extracurriculars: 'EXTRACURRICULARS',
  culturality: 'CULTURALITY', integrity: 'INTEGRITY', stress: 'STRESS',
  wealth: 'WEALTH', selfAwareness: 'SELF-AWARENESS', sleep: 'SLEEP',
};

let _phaserGame = null;

/* ── Entry point called from game.js ─────────────────── */
function initPhaserGame(playerData) {
  _buildZoneBounds();

  const container = document.getElementById('phaser-container');
  const W = container.clientWidth  || window.innerWidth;
  const H = container.clientHeight || (window.innerHeight - 52);

  if (_phaserGame) { _phaserGame.destroy(true); _phaserGame = null; }

  _phaserGame = new Phaser.Game({
    type:            Phaser.AUTO,
    parent:          'phaser-container',
    width:           W,
    height:          H,
    backgroundColor: '#3A2E1E',
    physics: {
      default: 'arcade',
      arcade:  { gravity: { y: 0 }, debug: false },
    },
    scale: {
      mode:       Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [buildGameScene(playerData)],
  });
}

/* ── Scene factory ────────────────────────────────────── */
function buildGameScene(playerData) {

  class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
      this.px           = 0;
      this.py           = 0;
      this.currentZone  = 'gym';
      this.nearbyNpc    = null;
      this.npcPositions = {};
      this.playerGfx    = null;
      this.playerLabel  = null;
      this.hintText     = null;
      this._paused      = false;
    }

    create() {
      const state    = Engine.getState();
      const periodId = state.period?.id || 'before_school';

      /* ── 1. World background ──────────────────────── */
      this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, WORLD_BG);

      /* ── 2. Path / ground strips between zones ────── */
      const pathGfx = this.add.graphics();
      pathGfx.fillStyle(PATH_COLOR, 0.35);
      for (let r = 0; r < 5; r++) {
        const py = MAP_PAD + (r + 1) * ZONE_H + r * ZONE_GAP;
        pathGfx.fillRect(MAP_PAD, py, WORLD_W - MAP_PAD * 2, ZONE_GAP);
      }
      for (let c = 0; c < 2; c++) {
        const px = MAP_PAD + (c + 1) * ZONE_W + c * ZONE_GAP;
        pathGfx.fillRect(px, MAP_PAD, ZONE_GAP, WORLD_H - MAP_PAD * 2);
      }

      /* ── 3. Zone tiles ────────────────────────────── */
      const zoneGfx = this.add.graphics();

      ZONES.forEach(zone => {
        if (!zone.mapGrid) return;
        const b = ZONE_BOUNDS[zone.id];
        const gradeLockedOut = zone.unlocksAt > state.grade;
        const freshmanRestricted = !gradeLockedOut && !ORIENTATION_ZONES.has(zone.id);

        const fill = gradeLockedOut ? LOCKED_FILL
          : freshmanRestricted ? RESTRICTED_FILL
          : (ZONE_FILL_COLORS[zone.type] || 0xE4D8C8);
        const line = gradeLockedOut ? LOCKED_LINE
          : freshmanRestricted ? 0xA89888
          : (ZONE_LINE_COLORS[zone.type] || 0xB8A890);

        const alpha = gradeLockedOut ? 0.55 : freshmanRestricted ? 0.65 : 1.0;
        zoneGfx.fillStyle(fill, alpha);
        zoneGfx.fillRect(b.x, b.y, b.w, b.h);
        zoneGfx.lineStyle(2, line, 1);
        zoneGfx.strokeRect(b.x, b.y, b.w, b.h);

        // Crosshatch for locked / restricted zones
        if (gradeLockedOut || freshmanRestricted) {
          zoneGfx.lineStyle(1, line, 0.22);
          for (let i = -b.h; i < b.w + b.h; i += 22) {
            const x1 = b.x + Math.max(0, i);
            const y1 = b.y + Math.max(0, -i);
            const x2 = b.x + Math.min(b.w, i + b.h);
            const y2 = b.y + Math.min(b.h, b.h - i);
            if (x1 < b.x + b.w && y2 > b.y)
              zoneGfx.lineBetween(x1, y1, x2, y2);
          }
        }

        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const dimmed = gradeLockedOut || freshmanRestricted;

        this.add.text(cx, cy - 12, (zone.shortName || zone.name).toUpperCase(), {
          fontSize:   dimmed ? '10px' : '12px',
          fontFamily: 'Space Mono, monospace',
          color:      dimmed ? '#8A7A6A' : '#2D1F12',
          fontStyle:  'bold',
          stroke:     dimmed ? 'transparent' : 'rgba(255,255,255,0.4)',
          strokeThickness: 2,
        }).setOrigin(0.5, 0.5).setAlpha(dimmed ? 0.65 : 1);

        if (gradeLockedOut) {
          this.add.text(cx, cy + 14, `GR.${zone.unlocksAt}`, {
            fontSize: '10px', fontFamily: 'Space Mono, monospace', color: '#8A7A6A',
          }).setOrigin(0.5, 0.5).setAlpha(0.65);
        } else if (freshmanRestricted) {
          this.add.text(cx, cy + 14, '🔒 ORIENTATION', {
            fontSize: '9px', fontFamily: 'Space Mono, monospace', color: '#8A7A6A',
          }).setOrigin(0.5, 0.5).setAlpha(0.65);
        } else {
          this.add.text(cx, cy + 14, zone.icon || '', {
            fontSize: '18px',
          }).setOrigin(0.5, 0.5);
        }
      });

      /* ── 4. NPC sprites ───────────────────────────── */
      const npcGfx = this.add.graphics();

      const byZone = {};
      NPCS.forEach(npc => {
        const loc = npc.schedule[periodId] ?? npc.defaultZone;
        const b   = ZONE_BOUNDS[loc];
        if (!b) return;
        const zone = ZONES.find(z => z.id === loc);
        if (zone && zone.unlocksAt > state.grade) return;
        const statOk = Object.entries(npc.statRequirements || {})
          .every(([k, v]) => (state.stats[k] || 0) >= v);
        if (!statOk) return;
        if (!byZone[loc]) byZone[loc] = [];
        byZone[loc].push(npc);
      });

      Object.entries(byZone).forEach(([zoneId, npcs]) => {
        const b = ZONE_BOUNDS[zoneId];
        const isGym = zoneId === 'gym';

        npcs.forEach((npc, i) => {
          const total  = npcs.length;
          let nx, ny;

          if (isGym && npc.orientationRole === 'speaker') {
            // Speaker at podium center-bottom of gym
            nx = b.x + b.w / 2;
            ny = b.y + b.h * 0.78;
          } else if (isGym && npc.orientationRole === 'audience') {
            // Audience arranged in bleacher rows across the top half
            const audienceNpcs = npcs.filter(n => n.orientationRole === 'audience');
            const ai = audienceNpcs.indexOf(npc);
            const aTotal = audienceNpcs.length;
            const cols = Math.ceil(aTotal / 2);
            const row  = Math.floor(ai / cols);
            const col  = ai % cols;
            nx = b.x + 50 + col * ((b.w - 100) / Math.max(cols - 1, 1));
            ny = b.y + 30 + row * 50;
          } else {
            const margin = 55;
            nx = total > 1
              ? b.x + margin + (i / (total - 1)) * (b.w - margin * 2)
              : b.x + b.w / 2;
            ny = b.y + b.h * 0.62;
          }

          this.npcPositions[npc.id] = { x: nx, y: ny };

          const col = isGym && npc.orientationRole === 'speaker'
            ? 0xB8902C  // gold for speaker
            : _npcColor(npc.group);

          npcGfx.fillStyle(0x000000, 0.18);
          npcGfx.fillEllipse(nx, ny + 18, 18, 6);
          npcGfx.fillStyle(col, 1);
          npcGfx.fillRect(nx - 7, ny - 2, 14, 16);
          npcGfx.fillCircle(nx, ny - 10, 9);
          npcGfx.lineStyle(1.5, 0x2D1F12, 0.5);
          npcGfx.strokeCircle(nx, ny - 10, 9);

          this.add.text(nx, ny - 24, npc.name, {
            fontSize:   '8px',
            fontFamily: 'Space Mono, monospace',
            color:      '#2D1F12',
            backgroundColor: 'rgba(234,217,192,0.82)',
            padding:    { x: 3, y: 1 },
          }).setOrigin(0.5, 1);
        });
      });

      /* ── 5. Orientation podium label (gym) ───────── */
      const gymB = ZONE_BOUNDS['gym'];
      if (gymB) {
        // Podium stand
        const podGfx = this.add.graphics();
        podGfx.fillStyle(0xC9913A, 0.7);
        podGfx.fillRect(gymB.x + gymB.w / 2 - 18, gymB.y + gymB.h * 0.83, 36, 20);
        podGfx.lineStyle(1.5, 0xA07020, 1);
        podGfx.strokeRect(gymB.x + gymB.w / 2 - 18, gymB.y + gymB.h * 0.83, 36, 20);

        this.add.text(gymB.x + gymB.w / 2, gymB.y + gymB.h * 0.83 - 4, 'ORIENTATION', {
          fontSize: '7px', fontFamily: 'Space Mono, monospace',
          color: '#C9913A', backgroundColor: 'rgba(45,31,18,0.75)',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5, 1);
      }

      /* ── 6. Player sprite — starts in gym ────────── */
      const startB = ZONE_BOUNDS['gym'];
      this.px = startB ? startB.x + startB.w / 2 : WORLD_W / 2;
      this.py = startB ? startB.y + startB.h * 0.55 : WORLD_H / 2;

      const pCol = _playerColor(playerData.friendGroup);

      this.playerGfx = this.add.graphics();
      this._renderPlayer(pCol);
      this.playerGfx.x = this.px;
      this.playerGfx.y = this.py;
      this.playerGfx.setDepth(10);

      this.playerLabel = this.add.text(this.px, this.py - 30, (playerData.name || 'YOU').toUpperCase(), {
        fontSize: '10px', fontFamily: 'Space Mono, monospace',
        color: '#FFFFFF', backgroundColor: 'rgba(45,31,18,0.82)',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(11);

      /* ── 7. Interaction hint ──────────────────────── */
      this.hintText = this.add.text(this.px, this.py - 46, '', {
        fontSize: '11px', fontFamily: 'Space Mono, monospace',
        color: '#F7B731', backgroundColor: 'rgba(45,31,18,0.88)',
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5, 1).setDepth(12).setVisible(false);

      /* ── 8. Camera ────────────────────────────────── */
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.startFollow(this.playerGfx, true, 0.09, 0.09);
      this.cameras.main.setZoom(1);

      /* ── 9. Input ─────────────────────────────────── */
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd    = this.input.keyboard.addKeys({
        up:    Phaser.Input.Keyboard.KeyCodes.W,
        down:  Phaser.Input.Keyboard.KeyCodes.S,
        left:  Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
      this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.eKey.on('down', () => this._interact());

      this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.pKey.on('down', () => this._togglePause());

      /* ── 10. Minimap compass labels ───────────────── */
      const compassStyle = {
        fontSize: '8px', fontFamily: 'Space Mono, monospace',
        color: 'rgba(200,185,170,0.55)',
      };
      this.add.text(MAP_PAD - 4, MAP_PAD - 24, 'WEST', compassStyle).setOrigin(0, 0);
      this.add.text(MAP_PAD + 2 * (ZONE_W + ZONE_GAP) + ZONE_W / 2,
                    MAP_PAD - 24, 'EAST', compassStyle).setOrigin(0.5, 0);
      this.add.text(MAP_PAD, WORLD_H - MAP_PAD + 8, 'FIELDS', compassStyle).setOrigin(0, 0);

      /* Initial zone sync */
      this._detectZone(true);

      /* Wire pause resume button */
      const resumeBtn = document.getElementById('po-resume-btn');
      if (resumeBtn) resumeBtn.addEventListener('click', () => this._closePause());

      /* Wire HUD pause button */
      const hudPauseBtn = document.getElementById('hud-pause-btn');
      if (hudPauseBtn) hudPauseBtn.addEventListener('click', () => this._togglePause());
    }

    /* ── Draw player ────────────────────────────────── */
    _renderPlayer(color) {
      const g = this.playerGfx;
      g.clear();
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(0, 22, 22, 8);
      g.fillStyle(color, 1);
      g.fillRect(-10, 0, 20, 22);
      g.fillCircle(0, -11, 11);
      g.lineStyle(2, 0xFFFFFF, 0.55);
      g.strokeCircle(0, -11, 11);
      g.strokeRect(-10, 0, 20, 22);
      g.fillStyle(0xFFFFFF, 0.7);
      g.fillCircle(0, -13, 3);
    }

    update(time, delta) {
      if (this._paused) return;
      // Block movement while orientation is active
      if (window.MYTH_ORIENTATION_ACTIVE) return;

      const SPEED = 240;
      const dt    = delta / 1000;

      let dx = 0, dy = 0;
      if (this.cursors.left.isDown  || this.wasd.left.isDown)  dx = -1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) dx =  1;
      if (this.cursors.up.isDown    || this.wasd.up.isDown)    dy = -1;
      if (this.cursors.down.isDown  || this.wasd.down.isDown)  dy =  1;

      if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

      this.px = Phaser.Math.Clamp(this.px + dx * SPEED * dt, 4, WORLD_W - 4);
      this.py = Phaser.Math.Clamp(this.py + dy * SPEED * dt, 4, WORLD_H - 4);

      this.playerGfx.x = this.px;
      this.playerGfx.y = this.py;

      this.playerLabel.x = this.px;
      this.playerLabel.y = this.py - 28;

      if (dx !== 0 || dy !== 0) this._detectZone(false);
      this._detectNPC();
    }

    /* ── Zone detection with freshman restriction ───── */
    _detectZone(force) {
      const restricted = window.MYTH_FRESHMAN_RESTRICTION; // Set or null

      for (const [id, b] of Object.entries(ZONE_BOUNDS)) {
        if (this.px >= b.x && this.px <= b.x + b.w &&
            this.py >= b.y && this.py <= b.y + b.h) {
          if (id !== this.currentZone || force) {
            // Freshman restriction: block zones outside allowed set
            if (restricted && !restricted.has(id)) return;
            if (Engine.canGoTo(id)) {
              this.currentZone = id;
              Engine.goTo(id);
              const el = document.getElementById('hud-zone');
              if (el) {
                const z = ZONES.find(z => z.id === id);
                el.textContent = z ? z.name : id;
              }
            }
          }
          return;
        }
      }
    }

    /* ── NPC proximity ──────────────────────────────── */
    _detectNPC() {
      const DIST = 65;
      let best = null, bestD = Infinity;

      for (const [id, pos] of Object.entries(this.npcPositions)) {
        const d = Math.hypot(pos.x - this.px, pos.y - this.py);
        if (d < DIST && d < bestD) { best = id; bestD = d; }
      }

      if (best) {
        const npc = NPCS.find(n => n.id === best);
        this.nearbyNpc = npc;
        this.hintText.setText(`[E] TALK TO ${npc.name.toUpperCase()}`);
        this.hintText.setVisible(true);
        this.hintText.x = this.px;
        this.hintText.y = this.py - 46;
      } else {
        this.nearbyNpc = null;
        this.hintText.setVisible(false);
      }
    }

    /* ── E key interact ─────────────────────────────── */
    _interact() {
      if (window.MYTH_ORIENTATION_ACTIVE || this._paused) return;
      if (this.nearbyNpc) {
        Engine.talkTo(this.nearbyNpc.id);
        return;
      }
      const objs = Engine.getObjectsInZone(this.currentZone);
      if (objs.length > 0) Engine.triggerInteraction(objs[0].id);
    }

    /* ── Pause toggle ───────────────────────────────── */
    _togglePause() {
      if (this._paused) {
        this._closePause();
      } else {
        this._openPause();
      }
    }

    _openPause() {
      this._paused = true;
      this._populatePauseStats();
      const overlay = document.getElementById('pause-overlay');
      overlay.classList.add('open');
      if (typeof gsap !== 'undefined') {
        gsap.from(overlay.querySelector('.po-inner'), {
          opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.out',
        });
      }
    }

    _closePause() {
      this._paused = false;
      const overlay = document.getElementById('pause-overlay');
      overlay.classList.remove('open');
    }

    _populatePauseStats() {
      const state = Engine.getState();
      if (!state) return;

      const info = document.getElementById('po-player-info');
      if (info) {
        info.innerHTML = `
          <span>${(state.player?.name || '').toUpperCase()}</span>
          <span>GRADE ${state.grade} · WEEK ${state.week} · ${state.day}</span>
          <span>${state.period?.label || ''}</span>
        `;
      }

      const statsEl = document.getElementById('po-stats');
      if (!statsEl) return;
      statsEl.innerHTML = Object.entries(state.stats).map(([k, v]) => {
        const pct   = (v / 10 * 100).toFixed(0);
        const color = _statColor(k, v);
        return `
          <div class="po-stat-row">
            <span class="po-stat-name">${STAT_LABELS_SHORT[k] || k}</span>
            <div class="po-stat-bar">
              <div class="po-stat-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <span class="po-stat-val">${v.toFixed(1)}</span>
          </div>
        `;
      }).join('');
    }
  }

  return GameScene;
}
