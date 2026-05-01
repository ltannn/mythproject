/* ═══════════════════════════════════════════════════════
   MYTH — game.js
   Scene sequencer + character creation logic
═══════════════════════════════════════════════════════ */

'use strict';

// ── GSAP shorthand ────────────────────────────────────
const G = gsap;

// ── State ─────────────────────────────────────────────
const player = {
  name: '',
  friendGroup: null,
  personality: null,
  height: null,
  rumor: null,
  background: null,
  secret: null,
  stats: {
    gpa:              2.00,   // 0.00 – 4.00
    friendships:      3.0,
    relationships:    2.0,
    sports:           2.0,
    intelligence:     5.0,
    extracurriculars: 2.0,
    happiness:        5.0,
  }
};

const STAT_LABELS = {
  gpa:              'GPA',
  friendships:      'FRIENDSHIPS',
  relationships:    'RELATIONSHIPS',
  sports:           'SPORTS',
  intelligence:     'INTELLIGENCE',
  extracurriculars: 'EXTRACURRICULARS',
  happiness:        'HAPPINESS',
};

// Stat bar colors — percentage-based so GPA (0–4) and others (0–10) use same thresholds
function statColor(key, val) {
  const pct = key === 'gpa' ? val / 4 : val / 10;
  if (pct >= 0.7) return '#F7B731';
  if (pct >= 0.4) return '#6BCB77';
  return '#FC7B54';
}

// Clamp helper that respects GPA's 0–4 scale
function clampStat(key, val) {
  return key === 'gpa' ? clamp(val, 0, 4) : clamp(val, 0, 10);
}

// ── Randomization pools ───────────────────────────────
const HEIGHTS = ["5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\"","6'4\"","6'5\""];

const RUMORS = [
  { text: 'Got expelled from their last school', tox: +2 },
  { text: "Rumor is they're loaded but hiding it", tox: +1 },
  { text: 'People say they were a prodigy at something', tox: 0 },
  { text: "Word is they've already hooked up with someone here", tox: +2 },
  { text: "Apparently their family is... controversial", tox: +1 },
  { text: "People say they're not actually from here", tox: 0 },
  { text: "They say this one's got a dark side", tox: +2 },
  { text: "Supposedly the child of someone important", tox: +1 },
  { text: "Overheard: 'Watch out for that one.'", tox: +1 },
  { text: "They say they turned down a scholarship somewhere else", tox: 0 },
  { text: "Someone said they used to be a completely different person", tox: 0 },
  { text: "Apparently there's a video of them doing something embarrassing", tox: +2 },
  { text: "Word is they've been to three different schools in two years", tox: +1 },
  { text: "Supposedly they ghosted their entire old friend group over the summer", tox: +1 },
  { text: "Heard they can actually fight — like, for real", tox: +1 },
  { text: "People say they went through something serious last year", tox: 0 },
  { text: "Word is they have a record", tox: +2 },
  { text: "Someone swears they've seen them cry in a bathroom stall", tox: 0 },
  { text: "They say this one's running from something", tox: +1 },
  { text: "Heard they used to be homeschooled — this is their first real school", tox: 0 },
  { text: "Supposedly dated someone twice their age over the summer", tox: +2 },
  { text: "Heard they only got in because of a deal their parents made", tox: +1 },
  { text: "Word is their parents are going through a really bad divorce", tox: 0 },
  { text: "People say they're already talking to someone's girlfriend", tox: +2 },
  { text: "Apparently they got caught cheating at their last school", tox: +2 },
  { text: "Someone said they're only here for a semester", tox: 0 },
  { text: "Overheard two teachers whispering about them on day one", tox: +1 },
  { text: "Word is they turned down an offer from a D1 program", tox: 0 },
  { text: "Supposedly they know something about someone powerful here", tox: +1 },
  { text: "People say they used to be best friends with someone who hates them now", tox: +1 },
];

const BACKGROUNDS = [
  {
    id: 'new_kid',
    label: 'NEW KID',
    desc: 'Nobody knows your story yet.',
    bonus: { intelligence: +1, friendships: -1 },
  },
  {
    id: 'legacy',
    label: 'LEGACY STUDENT',
    desc: "Your family's name opens doors here.",
    bonus: { friendships: +2, gpa: -0.2, happiness: +1 },
  },
  {
    id: 'scholarship',
    label: 'SCHOLARSHIP KID',
    desc: 'You earned your place. Everyone knows it.',
    bonus: { gpa: +0.5, intelligence: +1, extracurriculars: +1 },
  },
  {
    id: 'transfer',
    label: 'TRANSFER STUDENT',
    desc: 'You chose to leave somewhere else. That choice follows you.',
    bonus: { intelligence: +1, relationships: -1, happiness: -1 },
  },
  {
    id: 'local_legend',
    label: 'LOCAL KID',
    desc: "You've been in this neighborhood forever. Half these people knew you in 4th grade.",
    bonus: { friendships: +2, happiness: +2 },
  },
  {
    id: 'military',
    label: 'MILITARY KID',
    desc: "You've moved five times. This is just another school. You've gotten good at starting over.",
    bonus: { intelligence: +1, friendships: -1, happiness: -1 },
  },
  {
    id: 'online_famous',
    label: 'QUIETLY INTERNET FAMOUS',
    desc: "You have a following. Most people here don't know it yet.",
    bonus: { friendships: +1, extracurriculars: +2, happiness: +1 },
  },
  {
    id: 'returnee',
    label: 'RETURNEE',
    desc: 'You went to middle school here, left for two years, and came back. Nobody knows why.',
    bonus: { intelligence: +1, friendships: -1 },
  },
  {
    id: 'prodigy',
    label: 'SKIPPED A GRADE',
    desc: "You're younger than everyone. Some respect it. Others use it against you.",
    bonus: { gpa: +0.8, intelligence: +2, friendships: -2 },
  },
  {
    id: 'old_money',
    label: 'OLD MONEY',
    desc: "Your family has history at this school. Not all of it flattering.",
    bonus: { friendships: +1, happiness: +2, gpa: -0.2 },
  },
];

const SECRETS = [
  { id: 'anxiety',      label: 'You have anxiety',                  desc: 'You manage it. Mostly.',                                     icon: '🫀' },
  { id: 'learning',     label: 'Learning disability (hidden)',       desc: "You've been compensating for years.",                         icon: '🧠' },
  { id: 'wealthy',      label: 'Secretly very wealthy',             desc: "You don't look it. On purpose.",                             icon: '💰' },
  { id: 'talent',       label: 'Hidden artistic talent',            desc: "You haven't shown anyone yet.",                              icon: '🎨' },
  { id: 'family',       label: 'Difficult home life',               desc: "You leave it at the door. Every single day.",                icon: '🏠' },
  { id: 'ex_athlete',   label: 'Quit a sport you were elite at',    desc: 'The muscle memory stays.',                                   icon: '⚡' },
  { id: 'crush',        label: 'Already in love with someone here', desc: "First day. Already complicated.",                            icon: '💛' },
  { id: 'following',    label: 'Anonymous online following',        desc: "Thousands know your work. Not your face.",                   icon: '📱' },
  { id: 'chronic',      label: 'Chronic illness — managed, hidden', desc: "Invisible. Exhausting. Nobody knows.",                       icon: '💊' },
  { id: 'therapy',      label: "You've been in therapy for 2 years", desc: "Best decision you ever made. You'll never tell anyone.",   icon: '🛋' },
  { id: 'ghosted',      label: 'You ghosted your entire old friend group', desc: "They still don't know why. Neither do you, fully.",   icon: '👻' },
  { id: 'writer',       label: 'You write — real stuff, dark stuff', desc: "Not for class. It goes somewhere nobody will ever read.",   icon: '✍️' },
  { id: 'bad_breakup',  label: 'A relationship ended badly',        desc: "It shaped you more than you want to admit.",                 icon: '💔' },
  { id: 'secret_keep',  label: "You know someone's secret",         desc: "Something big. You haven't decided what to do with it.",    icon: '🔑' },
  { id: 'language',     label: 'Fluent in a language nobody here speaks', desc: "You use it to think. To stay private.",               icon: '🗣' },
  { id: 'dropout_risk', label: 'You almost didn\'t come back this year', desc: "Something almost changed everything. It still might.", icon: '🚪' },
];

// ── Utility ───────────────────────────────────────────
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function flash(cb) {
  const el = document.getElementById('flash-overlay');
  G.timeline()
    .to(el, { opacity: 1, duration: 0.08 })
    .to(el, { opacity: 0, duration: 0.25, onComplete: cb });
}

function showScene(id, onDone) {
  const el = document.getElementById(id);
  if (!el) { if (onDone) onDone(); return; }
  el.classList.add('active');
  el.style.opacity = '0';
  G.to(el, { opacity: 1, duration: 0.4, ease: 'power2.out', onComplete: onDone });
}

function hideScene(id, onDone) {
  const el = document.getElementById(id);
  G.to(el, {
    opacity: 0, duration: 0.3, ease: 'power2.in',
    onComplete: () => {
      el.classList.remove('active');
      if (onDone) onDone();
    }
  });
}

// Noise canvas disabled — not used in warm parchment theme

// ════════════════════════════════════════════════════════
//  SCENE 0 — BOOT
// ════════════════════════════════════════════════════════
(function bootScene() {
  showScene('scene-boot');
  setTimeout(() => hideScene('scene-boot', startIntro), 1200);
})();

// ════════════════════════════════════════════════════════
//  SCENE 1 — INTRO
// ════════════════════════════════════════════════════════
function startIntro() {
  showScene('scene-intro', () => {
    // Make all intro text immediately visible
    ['intro-l1','intro-l2','intro-l3'].forEach(id => {
      const el = document.getElementById(id);
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.clipPath = 'none';
    });
    const continueEl = document.getElementById('intro-continue');
    continueEl.style.opacity = '1';

    function proceed() {
      window.removeEventListener('keydown', proceed);
      continueEl.removeEventListener('click', proceed);
      hideScene('scene-intro', startNameScene);
    }
    window.addEventListener('keydown', proceed);
    continueEl.addEventListener('click', proceed);
  });
}

// ════════════════════════════════════════════════════════
//  SCENE 2 — NAME
// ════════════════════════════════════════════════════════
function startNameScene() {
  showScene('scene-name', () => {
    const input = document.getElementById('name-input');
    const btn   = document.getElementById('name-confirm');
    const numEl = document.querySelector('.id-number');

    input.addEventListener('input', () => {
      const v = input.value.trim();
      btn.disabled = v.length < 2;
      numEl.textContent = v.length >= 2
        ? `WB–2026–${Math.abs(v.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % 9000 + 1000)}`
        : 'WB–2026–????';
    });

    btn.addEventListener('click', () => {
      player.name = input.value.trim();
      hideScene('scene-name', startGroupScene);
    });

    input.focus();
  });
}

// ════════════════════════════════════════════════════════
//  SCENE 3 — FRIEND GROUP
// ════════════════════════════════════════════════════════
function startGroupScene() {
  showScene('scene-group', () => {
    G.to('.group-card', { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' });
    document.querySelectorAll('.group-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.group-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        player.friendGroup = card.dataset.group;
        applyGroupStats(card.dataset.group);
        hideScene('scene-group', startPersonalityScene);
      });
    });
  });
}

function applyGroupStats(g) {
  const s = player.stats;
  if (g === 'mob') {
    s.friendships    = clamp(s.friendships    + 3,   0, 10);
    s.sports         = clamp(s.sports         + 1,   0, 10);
    s.gpa            = clamp(s.gpa            - 0.5, 0, 4);
    s.intelligence   = clamp(s.intelligence   - 2,   0, 10);
    s.happiness      = clamp(s.happiness      - 1,   0, 10);
  } else if (g === 'balance') {
    s.friendships      = clamp(s.friendships      + 2,   0, 10);
    s.happiness        = clamp(s.happiness        + 2,   0, 10);
    s.extracurriculars = clamp(s.extracurriculars + 1,   0, 10);
    s.gpa              = clamp(s.gpa              + 0.3, 0, 4);
  } else if (g === 'grind') {
    s.gpa            = clamp(s.gpa            + 0.8, 0, 4);
    s.intelligence   = clamp(s.intelligence   + 3,   0, 10);
    s.relationships  = clamp(s.relationships  - 2,   0, 10);
    s.happiness      = clamp(s.happiness      - 1,   0, 10);
  }
}

// ════════════════════════════════════════════════════════
//  SCENE 4 — PERSONALITY
// ════════════════════════════════════════════════════════
function startPersonalityScene() {
  showScene('scene-personality', () => {
    G.to('.pers-card', { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' });
    document.querySelectorAll('.pers-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pers-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        player.personality = card.dataset.pers;
        applyPersonalityStats(player.personality);
        hideScene('scene-personality', startRandomizeScene);
      });
    });
  });
}

function applyPersonalityStats(p) {
  const s = player.stats;
  if (p === 'grinder') {
    s.gpa              = clampStat('gpa',          s.gpa          + 0.6);
    s.intelligence     = clampStat('intelligence',  s.intelligence  + 2);
    s.happiness        = clampStat('happiness',     s.happiness     - 1);
  } else if (p === 'social') {
    s.friendships      = clampStat('friendships',   s.friendships   + 3);
    s.relationships    = clampStat('relationships', s.relationships + 2);
    s.happiness        = clampStat('happiness',     s.happiness     + 1);
  } else if (p === 'athlete') {
    s.sports           = clampStat('sports',           s.sports           + 3);
    s.extracurriculars = clampStat('extracurriculars', s.extracurriculars + 1);
    s.intelligence     = clampStat('intelligence',     s.intelligence     - 1);
  } else if (p === 'charmer') {
    s.relationships    = clampStat('relationships',    s.relationships + 3);
    s.friendships      = clampStat('friendships',      s.friendships   + 1);
    s.happiness        = clampStat('happiness',        s.happiness     + 1);
  } else if (p === 'observer') {
    s.intelligence     = clampStat('intelligence',  s.intelligence  + 2);
    s.happiness        = clampStat('happiness',     s.happiness     - 1);
    s.friendships      = clampStat('friendships',   s.friendships   - 1);
  } else if (p === 'rebel') {
    s.happiness        = clampStat('happiness',        s.happiness        + 1);
    s.gpa              = clampStat('gpa',              s.gpa              - 0.3);
    s.extracurriculars = clampStat('extracurriculars', s.extracurriculars + 1);
  } else if (p === 'empath') {
    s.relationships    = clampStat('relationships', s.relationships + 2);
    s.happiness        = clampStat('happiness',     s.happiness     + 1);
    s.intelligence     = clampStat('intelligence',  s.intelligence  + 1);
  } else if (p === 'wildcard') {
    const keys = Object.keys(s);
    const picks = keys.sort(() => Math.random() - 0.5).slice(0, 3);
    s[picks[0]] = clampStat(picks[0], s[picks[0]] + 2);
    s[picks[1]] = clampStat(picks[1], s[picks[1]] + 2);
    s[picks[2]] = clampStat(picks[2], s[picks[2]] - 1);
  }
}

// ════════════════════════════════════════════════════════
//  SCENE 5 — RANDOMIZE
// ════════════════════════════════════════════════════════
const RANDOM_SEQUENCE = [
  { key: 'height',     label: 'HEIGHT',     pool: HEIGHTS,     icon: '📏', accent: '#F7B731', glow: 'rgba(247,183,49,0.18)' },
  { key: 'rumor',      label: 'RUMOR',      pool: RUMORS,      icon: '💬', accent: '#FC7B54', glow: 'rgba(252,123,84,0.2)',  special: true },
  { key: 'background', label: 'BACKGROUND', pool: BACKGROUNDS, icon: '📋', accent: '#6BCB77', glow: 'rgba(107,203,119,0.2)', special: true },
  { key: 'secret',     label: 'SECRET',     pool: SECRETS,     icon: '🔒', accent: '#E8849A', glow: 'rgba(232,132,154,0.2)', special: true, hidden: true },
];

function startRandomizeScene() {
  // Roll all values
  player.height = rand(HEIGHTS);

  const rumorData = rand(RUMORS);
  player.rumor = rumorData.text;
  // Heavier rumors quietly dent happiness
  if (rumorData.tox > 0) {
    player.stats.happiness = clamp(player.stats.happiness - rumorData.tox * 0.3, 0, 10);
  }

  const bgData = rand(BACKGROUNDS);
  player.background = bgData;
  Object.entries(bgData.bonus).forEach(([k, v]) => {
    if (player.stats[k] !== undefined)
      player.stats[k] = clampStat(k, player.stats[k] + v);
  });

  player.secret = rand(SECRETS);

  showScene('scene-randomize', () => {
    const stage = document.getElementById('random-stage');

    // Show all cards at once in a grid
    const items = [
      { label: 'HEIGHT',     value: player.height,            sub: null,                       accent: '#C9913A', secret: false },
      { label: 'RUMOR',      value: '"' + player.rumor + '"', sub: 'Affects early reputation', accent: '#C4613A', secret: false },
      { label: 'BACKGROUND', value: player.background.label,  sub: player.background.desc,     accent: '#6E9E60', secret: false },
      { label: 'SECRET',     value: player.secret.label,      sub: player.secret.desc,         accent: '#C47A82', secret: true  },
    ];

    const grid = document.createElement('div');
    grid.className = 'revealed-grid';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mini-reveal-card';
      card.style.borderColor = item.accent + '66';
      card.innerHTML = `
        <div class="mrc-type">${item.label}</div>
        <div class="mrc-value" style="color:${item.accent}">${item.secret ? '🔒 ' + item.value : item.value}</div>
        ${item.sub ? `<div class="mrc-sub">${item.sub}</div>` : ''}
        ${item.secret ? '<div class="mrc-secret-note">Only you can see this</div>' : ''}
      `;
      grid.appendChild(card);
    });

    stage.innerHTML = '';
    stage.appendChild(grid);

    G.to('.mini-reveal-card', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.2, // This creates the "one-by-one" reveal effect
      ease: 'power2.out'
    });

    // Mark all dots done
    document.querySelectorAll('.rp-dot').forEach(d => d.classList.add('done'));

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn-primary';
    continueBtn.textContent = 'CONTINUE →';
    continueBtn.style.marginTop = '24px';
    continueBtn.addEventListener('click', () => hideScene('scene-randomize', startCharCardScene));
    stage.appendChild(continueBtn);
  });
}

// ════════════════════════════════════════════════════════
//  SCENE 6 — CHARACTER CARD
// ════════════════════════════════════════════════════════
function startCharCardScene() {
  const groupLabels = { mob: 'SOGYAG', balance: 'XOBX', grind: "SACUL" };
  const groupColors = { mob: '#FC7B54', balance: '#F7B731', grind: '#6BCB77' };
  const persLabels  = {
    grinder: 'THE GRINDER', social: 'SOCIAL BUTTERFLY',
    athlete: 'THE ATHLETE', charmer: 'THE CHARMER',
    observer: 'THE OBSERVER', rebel: 'THE REBEL',
    empath: 'THE EMPATH', wildcard: 'THE WILDCARD',
  };

  document.getElementById('cc-name-display').textContent = player.name.toUpperCase();

  const gBadge = document.getElementById('cc-group-display');
  gBadge.textContent = groupLabels[player.friendGroup] || '—';
  gBadge.style.borderColor = (groupColors[player.friendGroup] || '#F7B731') + '88';
  gBadge.style.color = groupColors[player.friendGroup] || '#F7B731';
  gBadge.style.background = (groupColors[player.friendGroup] || '#F7B731') + '18';

  document.getElementById('cc-pers-display').textContent = persLabels[player.personality] || '—';

  document.getElementById('cc-attributes').innerHTML = `
    <div class="cc-attr">
      <div class="cc-attr-label">HEIGHT</div>
      <div class="cc-attr-val">${player.height}</div>
    </div>
  `;

  document.getElementById('cc-cards-mini').innerHTML = [
    { label: 'RUMOR',      val: player.rumor,                                         color: '#FC7B54', hidden: false },
    { label: 'BACKGROUND', val: player.background.label + ' — ' + player.background.desc, color: '#6BCB77', hidden: false },
    { label: 'SECRET',     val: player.secret.label,                                  color: '#E8849A', hidden: true  },
  ].map(sp => `
    <div class="mini-special-card" style="--msc-color:${sp.color}">
      <div class="msc-type">${sp.label}</div>
      ${sp.hidden
        ? `<div class="msc-value msc-hidden">${sp.val}</div><div class="msc-hidden-label">🔒 ONLY YOU KNOW</div>`
        : `<div class="msc-value">${sp.val}</div>`}
    </div>
  `).join('');

  document.getElementById('cc-stats-bars').innerHTML = Object.entries(player.stats).map(([key, val]) => {
    const isGpa = key === 'gpa';
    const pct   = isGpa ? val / 4 * 100 : val / 10 * 100;
    const disp  = isGpa ? val.toFixed(2) : val.toFixed(1);
    return `
      <div class="stat-row">
        <div class="stat-row-top">
          <span class="stat-name">${STAT_LABELS[key]}</span>
          <span class="stat-val">${disp}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="background:${statColor(key,val)};width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  showScene('scene-charcard', () => {
    G.to('#cc-wrap', { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' });
    G.to('.stat-row', { opacity: 1, x: 0, stagger: 0.04, duration: 0.35, delay: 0.25, ease: 'power2.out' });
    document.getElementById('begin-btn').addEventListener('click', startTransition);
  });
}

// ════════════════════════════════════════════════════════
//  SCENE 7 — TRANSITION
// ════════════════════════════════════════════════════════
function startTransition() {
  hideScene('scene-charcard', () => {
    showScene('scene-transition', () => {
      const textEl = document.getElementById('trans-text');
      textEl.textContent = 'FRESHMAN YEAR BEGINS.';
      textEl.style.opacity = '1';
      setTimeout(launchGame, 1200);
    });
  });
}

// ════════════════════════════════════════════════════════
//  GAME WORLD — launch, render, UI
// ════════════════════════════════════════════════════════

function launchGame() {
  Engine.init(player);

  // Freshman restrictions — orientation handled by zone-entry in world3d.js
  window.MYTH_ORIENTATION_ACTIVE    = false;
  window.MYTH_FRESHMAN_RESTRICTION  = true;
  window.MYTH_CLUB_FAIR_TRIGGERED   = false;
  window.MYTH_CLUB_CHOICE           = null;
  window.MYTH_CLUB_MISS_DELTAS      = {};
  window.MYTH_BIO_TRIGGERED         = false;
  window.MYTH_BIO_DONE              = false;
  window.MYTH_PE_TRIGGERED          = false;
  window.MYTH_PE_DONE               = false;
  window.MYTH_POWER_OUTAGE          = false;
  window.MYTH_POWER_RESTORE         = false;
  window.MYTH_BOMB_THREAT_ACTIVE    = false;
  window.MYTH_BOMB_CLEAR            = false;

  // Snapshot starting stats for year-end recap
  window.MYTH_START_STATS = Object.assign({}, player.stats);
  // Amplify all stat changes 1.5× for more impactful choices
  window.MYTH_STAT_MULT = 1.5;

  const transEl = document.getElementById('scene-transition');
  transEl.classList.remove('active');
  transEl.style.opacity = '0';

  showScene('scene-game', () => {
    Engine.on('stat_change',    ({ key, delta }) => { refreshStatsSidebar(); _queueStatToast(key, delta); });
    Engine.on('period_change',  ()               => { updateHUD(); safeEventCheck(); });
    Engine.on('grade_up',       ({ to })         => showGradeUnlock(to));
    Engine.on('npc_talk',       ({ npc, node })  => openDialogue(npc, node));
    Engine.on('dialogue_close', ()               => closeDialogueBox());

    Engine.goTo('gym');
    updateHUD();
    wireGameButtons();

    // Show controls screen, then launch 3D world on dismiss
    const ctrlEl = document.getElementById('controls-overlay');
    ctrlEl.style.display = 'flex';
    function dismissControls() {
      ctrlEl.removeEventListener('click', dismissControls);
      document.removeEventListener('keydown', dismissControls);
      ctrlEl.style.opacity = '0';
      ctrlEl.style.transition = 'opacity 0.4s';
      setTimeout(() => {
        ctrlEl.style.display = 'none';
        ctrlEl.style.opacity = '';
        ctrlEl.style.transition = '';
        requestAnimationFrame(() => { initWorld3D(player); });
      }, 400);
    }
    ctrlEl.addEventListener('click', dismissControls);
    document.addEventListener('keydown', dismissControls);
  });
}

function safeEventCheck() {
  try { EventManager.checkTriggers(Engine.getState()); } catch (e) {}
}

// ════════════════════════════════════════════════════════
//  ORIENTATION OVERLAY
// ════════════════════════════════════════════════════════

const OR_SPEECH = [
  { speaker: 'COACH THOMAS',         text: 'Welcome to Monta Vista. You\'re a freshman.' },
];
let _orSpeechIdx = 0;
let _orChoiceResolved = false; // guard: resolveOrientationChoice fires exactly once

function showOrientationOverlay() {
  _orSpeechIdx = 0;
  _orChoiceResolved = false;
  const overlay = document.getElementById('orientation-overlay');
  overlay.classList.add('open');
  const inner = overlay.querySelector('.or-inner');
  G.from(inner, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
  _renderSpeechLine(inner);
}

function _renderSpeechLine(inner) {
  const line = OR_SPEECH[_orSpeechIdx];
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; FRESHMAN ORIENTATION</div>
    <div class="or-speech-speaker">${line.speaker}</div>
    <p class="or-speech-text">"${line.text}"</p>
    <div class="or-speech-nav">
      <span class="or-speech-progress">${_orSpeechIdx + 1} / ${OR_SPEECH.length}</span>
      <button class="btn-primary" id="or-next-btn">
        ${_orSpeechIdx < OR_SPEECH.length - 1 ? 'NEXT →' : 'FIND YOUR SEAT →'}
      </button>
    </div>
    <div class="or-key-hint" style="margin-top:6px;font-size:0.72rem;opacity:0.5">[ ENTER ] to continue</div>
  `;
  G.from(inner.querySelector('.or-speech-text'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out' });

  let _fired = false;
  function _advance() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _orEnterKH);
    _orSpeechIdx++;
    if (_orSpeechIdx >= OR_SPEECH.length) { _showSeatChoice(inner); }
    else { _renderSpeechLine(inner); }
  }
  function _orEnterKH(e) { if (e.key === 'Enter') _advance(); }
  document.addEventListener('keydown', _orEnterKH);
  document.getElementById('or-next-btn').addEventListener('click', _advance, { once: true });
}

function _showSeatChoice(inner) {
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; FRESHMAN ORIENTATION</div>
    <h1 class="or-title">WHERE DO YOU SIT?</h1>
    <div class="or-scene">
      <p class="or-prompt">Where do you go? <span class="or-key-hint">[ press 1 – 4 ]</span></p>
    </div>
    <div class="or-choices" id="or-choices-live">
      <button class="or-choice-btn" data-choice="alone_back">
        <span class="ocb-num">1</span>
        <span class="ocb-label">ALONE IN THE BACK</span>
      </button>
      <button class="or-choice-btn" data-choice="familiar_face">
        <span class="ocb-num">2</span>
        <span class="ocb-label">NEXT TO SOMEONE FAMILIAR</span>
      </button>
      <button class="or-choice-btn" data-choice="front_row">
        <span class="ocb-num">3</span>
        <span class="ocb-label">FRONT ROW</span>
      </button>
      <button class="or-choice-btn" data-choice="popular_kids">
        <span class="ocb-num">4</span>
        <span class="ocb-label">NEXT TO THE POPULAR KIDS</span>
      </button>
    </div>
  `;
  G.from('.or-choice-btn', { opacity: 0, y: 10, stagger: 0.07, duration: 0.35, ease: 'power2.out' });

  // Keyboard 1-4
  const keyHandler = (e) => {
    const map = { '1': 'alone_back', '2': 'familiar_face', '3': 'front_row', '4': 'popular_kids',
                  'Digit1': 'alone_back', 'Digit2': 'familiar_face', 'Digit3': 'front_row', 'Digit4': 'popular_kids',
                  'Numpad1': 'alone_back', 'Numpad2': 'familiar_face', 'Numpad3': 'front_row', 'Numpad4': 'popular_kids' };
    const choice = map[e.key] || map[e.code];
    if (choice) {
      document.removeEventListener('keydown', keyHandler);
      resolveOrientationChoice(choice);
    }
  };
  document.addEventListener('keydown', keyHandler);

  document.querySelectorAll('.or-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.removeEventListener('keydown', keyHandler); // always clean up keyboard handler
      resolveOrientationChoice(btn.dataset.choice);
    }, { once: true });
  });
}

function resolveOrientationChoice(choice) {
  if (_orChoiceResolved) return;
  _orChoiceResolved = true;
  const OUTCOMES = {
    alone_back: {
      deltas: { intelligence: +1, happiness: -1, friendships: -1 },
      text: 'Top row. The gym fills up below you.',
    },
    familiar_face: {
      deltas: { friendships: +2, relationships: +1, happiness: +1 },
      text: 'You recognize them from middle school.',
    },
    front_row: {
      deltas: { gpa: +0.3, extracurriculars: +1, happiness: -1, friendships: -1 },
      text: 'The front row is mostly empty. You take the center seat.',
    },
    popular_kids: {
      deltas: { friendships: +2, relationships: +1, happiness: +1, intelligence: -1 },
      text: 'You walk straight toward the group like you\'ve been there before.',
    },
  };

  const outcome = OUTCOMES[choice];
  if (!outcome) return;

  Object.entries(outcome.deltas).forEach(([stat, delta]) => {
    Engine.modifyStat(stat, delta);
  });

  // Swap inner content to result screen — no stat line shown
  const inner = document.querySelector('.or-inner');
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; FRESHMAN ORIENTATION</div>
    <p class="or-result-text">${outcome.text}</p>
    <p class="or-result-sub">${outcome.sub}</p>
    <button class="btn-primary" id="or-continue-btn" style="margin-top:28px;align-self:flex-start">BEGIN FRESHMAN YEAR →</button>
    <div class="or-key-hint" style="margin-top:6px;font-size:0.72rem;opacity:0.5">[ ENTER ] to continue</div>
  `;

  G.from(inner, { opacity: 0, duration: 0.35 });

  let _fired = false;
  function _doClose() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _resultEnterKH);
    closeOrientationOverlay();
  }
  function _resultEnterKH(e) { if (e.key === 'Enter') _doClose(); }
  document.addEventListener('keydown', _resultEnterKH);
  document.getElementById('or-continue-btn').addEventListener('click', _doClose, { once: true });
}

function closeOrientationOverlay() {
  const overlay = document.getElementById('orientation-overlay');
  G.to(overlay, {
    opacity: 0, duration: 0.4, ease: 'power2.in',
    onComplete: () => {
      overlay.classList.remove('open');
      overlay.style.opacity = '';
      window.MYTH_ORIENTATION_ACTIVE = false;
      // Restriction stays on — only the immediate campus is accessible until after PE
      Engine.setFlag('orientation_complete');
      refreshStatsSidebar();
      if (window.MYTH_WORLD3D_CANVAS) window.MYTH_WORLD3D_CANVAS.requestPointerLock();
      setTimeout(safeEventCheck, 400);
      setTimeout(() => {
        if (window.MYTH_SHOW_NOTIF) window.MYTH_SHOW_NOTIF('Overheard: "There\'s a club fair somewhere near the gym..."');
      }, 3500);
    },
  });
}

// ── Campus map renderer (legacy — replaced by Phaser) ─
function renderMap() {
  const mapEl = document.getElementById('campus-map');
  if (!mapEl) return;
  const accessible = Engine.getAccessibleZones();
  const accessibleIds = new Set(accessible.map(z => z.id));
  const state = Engine.getState();

  // Title strip
  mapEl.innerHTML = `
    <div class="map-title-strip" style="grid-column:1/-1">
      MONTA VISTA HIGH SCHOOL
      <span class="map-compass">CUPERTINO, CA ☀️</span>
    </div>
  `;

  // Render each zone with a grid position
  ZONES.filter(z => z.mapGrid).forEach(zone => {
    const isLocked  = !accessibleIds.has(zone.id);
    const isActive  = state.currentZone?.id === zone.id;
    const npcsHere  = Engine.getNPCsInZone(zone.id);

    const tile = document.createElement('div');
    tile.className = `zone-tile${isLocked ? ' locked' : ''}${isActive ? ' active' : ''}`;
    tile.dataset.zoneId = zone.id;
    tile.dataset.type   = zone.type;
    tile.style.gridColumn = zone.mapGrid.col;
    tile.style.gridRow    = zone.mapGrid.row;

    const npcDots = npcsHere.slice(0, 4).map(() =>
      `<div class="zt-npc-dot"></div>`).join('');

    tile.innerHTML = `
      <div class="zt-top">
        <span class="zt-icon">${isLocked ? '🔒' : zone.icon}</span>
        ${isLocked ? `<span class="zt-lock">GR.${zone.unlocksAt}</span>` : ''}
      </div>
      <div class="zt-name">${zone.shortName || zone.name}</div>
      ${!isLocked && npcsHere.length ? `<div class="zt-npc-dots">${npcDots}</div>` : ''}
    `;

    if (!isLocked) {
      tile.addEventListener('click', () => {
        Engine.goTo(zone.id);
        renderMap();  // re-render to update active tile
      });
    }

    mapEl.appendChild(tile);
  });
}

// ── Zone detail panel (legacy stub — Phaser handles zone display) ─
function updateZonePanel(zone) {
  if (!zone) return;
  const hudZone = document.getElementById('hud-zone');
  if (hudZone) hudZone.textContent = zone.name;
  if (!document.getElementById('zp-name')) return;

  // People
  const peopleList = document.getElementById('zp-people-list');
  const npcs = Engine.getNPCsInZone(zone.id);
  if (npcs.length) {
    peopleList.innerHTML = npcs.map(npc => `
      <div class="zp-npc-row" data-npc-id="${npc.id}">
        <div class="zp-npc-portrait">${npc.portrait}</div>
        <div class="zp-npc-info">
          <div class="zp-npc-name">${npc.name}</div>
          <div class="zp-npc-role">${npc.role.toUpperCase()}</div>
        </div>
      </div>
    `).join('');
    peopleList.querySelectorAll('.zp-npc-row').forEach(row => {
      row.addEventListener('click', () => Engine.talkTo(row.dataset.npcId));
    });
  } else {
    peopleList.innerHTML = '<div class="zp-empty">Nobody here right now.</div>';
  }

  // Objects / interactions
  const thingsList = document.getElementById('zp-things-list');
  const objects = Engine.getObjectsInZone(zone.id);
  if (objects.length) {
    thingsList.innerHTML = objects.map(obj => `
      <div class="zp-obj-row" data-obj-id="${obj.id}">
        <span class="zp-obj-icon">${obj.icon || '●'}</span>
        <span class="zp-obj-label">${obj.label}</span>
      </div>
    `).join('');
    thingsList.querySelectorAll('.zp-obj-row').forEach(row => {
      row.addEventListener('click', () => Engine.triggerInteraction(row.dataset.objId));
    });
  } else {
    thingsList.innerHTML = '<div class="zp-empty">Nothing to interact with yet.</div>';
  }

  // Animate panel update
  G.from(['.zp-npc-row', '.zp-obj-row'], {
    opacity: 0, x: 8, stagger: 0.05, duration: 0.3, ease: 'power2.out',
  });
}

// ── HUD update ────────────────────────────────────────
function updateHUD() {
  const s = Engine.getState();
  if (!s) return;
  document.getElementById('hud-grade').textContent  = `GRADE ${s.grade}`;
  document.getElementById('hud-period').textContent = s.period.label;
  document.getElementById('hud-day').textContent    = `· ${s.day} · Week ${s.week}`;
}

// ── Stats sidebar ─────────────────────────────────────
function refreshStatsSidebar() {
  const s = Engine.getState();
  if (!s) return;
  const list = document.getElementById('ss-stats-list');
  list.innerHTML = Object.entries(s.stats).map(([key, val]) => {
    const isGpa = key === 'gpa';
    const pct   = isGpa ? val / 4 * 100 : val / 10 * 100;
    const disp  = isGpa ? val.toFixed(2) : val.toFixed(1);
    return `
      <div class="ss-stat-row">
        <div class="ss-stat-top">
          <span class="ss-stat-name">${STAT_LABELS[key] || key.toUpperCase()}</span>
          <span class="ss-stat-val">${disp}</span>
        </div>
        <div class="ss-bar-track">
          <div class="ss-bar-fill" style="width:${pct}%;background:${statColor(key,val)}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Dialogue box ──────────────────────────────────────
function openDialogue(npc, node) {
  const box = document.getElementById('dialogue-box');
  document.getElementById('db-portrait').textContent     = npc.portrait;
  document.getElementById('db-speaker-name').textContent = npc.name;
  document.getElementById('db-speaker-role').textContent = npc.role.toUpperCase();

  if (node) {
    document.getElementById('db-text').textContent = node.line;
    const choicesEl = document.getElementById('db-choices');
    choicesEl.innerHTML = (node.choices || []).map((c, i) => `
      <button class="db-choice" data-idx="${i}">${c.label}</button>
    `).join('');
    choicesEl.querySelectorAll('.db-choice').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        Engine.resolveChoice(node.choices[i]);
        closeDialogueBox();
      });
    });
  } else {
    document.getElementById('db-text').textContent =
      `${npc.name} is here but doesn't have anything to say right now.`;
    document.getElementById('db-choices').innerHTML = '';
  }

  box.classList.add('open');
}

function closeDialogueBox() {
  document.getElementById('dialogue-box').classList.remove('open');
  Engine.closeDialogue();
}

// ── Grade unlock toast ────────────────────────────────
function showGradeUnlock(grade) {
  const toast = document.getElementById('grade-unlock-toast');
  document.getElementById('gut-title').textContent = `GRADE ${grade}`;
  G.timeline()
    .to(toast, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' })
    .to(toast, { opacity: 0, y: -10, duration: 0.4, delay: 2.5 });
}

// ── Button wiring ─────────────────────────────────────
function wireGameButtons() {
  document.getElementById('hud-stats-btn').addEventListener('click', () => {
    refreshStatsSidebar();
    document.getElementById('stats-sidebar').classList.toggle('open');
  });
  document.getElementById('stats-close').addEventListener('click', () => {
    document.getElementById('stats-sidebar').classList.remove('open');
  });
  document.getElementById('db-close').addEventListener('click', closeDialogueBox);
  document.getElementById('hud-next-period-btn').addEventListener('click', () => {
    Engine.advancePeriod();
    updateHUD();
    safeEventCheck();
  });

  // Pause toggle — HUD button + [P] key
  const pauseBtn    = document.getElementById('hud-pause-btn');
  const resumeBtn   = document.getElementById('po-resume-btn');
  if (pauseBtn)  pauseBtn.addEventListener('click',  () => _togglePause());
  if (resumeBtn) resumeBtn.addEventListener('click', () => _togglePause());
  document.addEventListener('keydown', e => {
    if ((e.key === 'p' || e.key === 'P') && (!window.MYTH_ORIENTATION_ACTIVE || _paused)) _togglePause();
  });
}

// ── Pause overlay ─────────────────────────────────────
let _paused = false;
function _togglePause() {
  _paused = !_paused;
  const overlay = document.getElementById('pause-overlay');
  if (!overlay) return;

  if (_paused) {
    window.MYTH_ORIENTATION_ACTIVE = true;
    if (document.pointerLockElement) document.exitPointerLock();

    // Populate player info
    const infoEl = document.getElementById('po-player-info');
    if (infoEl) {
      const grpLabels = { mob: 'SOGYAG', balance: 'XOBX', grind: 'SACUL' };
      const prsLabels = {
        grinder:'THE GRINDER', social:'SOCIAL BUTTERFLY',
        athlete:'THE ATHLETE', charmer:'THE CHARMER',
        observer:'THE OBSERVER', rebel:'THE REBEL',
        empath:'THE EMPATH', wildcard:'THE WILDCARD',
      };
      infoEl.innerHTML = `
        <div class="po-name">${player.name || '—'}</div>
        <div class="po-tags">
          <span class="po-tag">${grpLabels[player.friendGroup] || '—'}</span>
          <span class="po-tag">${prsLabels[player.personality] || '—'}</span>
          ${player.height ? `<span class="po-tag">${player.height}</span>` : ''}
        </div>
        ${player.secret ? `<div class="po-secret">🔒 ${player.secret.label}</div>` : ''}
      `;
    }

    // Populate stats
    const statsEl = document.getElementById('po-stats');
    const s = (typeof Engine !== 'undefined' && Engine.getState) ? (Engine.getState()?.stats ?? player.stats) : player.stats;
    if (statsEl && s) {
      statsEl.innerHTML = Object.entries(s).map(([key, val]) => {
        const isGpa = key === 'gpa';
        const pct   = isGpa ? val / 4 * 100 : val / 10 * 100;
        const disp  = isGpa ? val.toFixed(2) : val.toFixed(1);
        const col   = pct >= 70 ? '#F7B731' : pct >= 40 ? '#6BCB77' : '#FC7B54';
        return `
          <div class="po-stat-row">
            <span class="po-stat-name">${STAT_LABELS[key] || key.toUpperCase()}</span>
            <div class="po-stat-bar"><div style="height:100%;border-radius:2px;background:${col};width:${Math.min(pct,100)}%"></div></div>
            <span class="po-stat-num" style="color:${col}">${disp}</span>
          </div>`;
      }).join('');
    }

    overlay.classList.add('open');
    const _poInner = overlay.querySelector('.po-inner');
    G.killTweensOf(_poInner);
    G.fromTo(_poInner, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  } else {
    G.to('#pause-overlay .po-inner', {
      opacity: 0, y: -10, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        overlay.classList.remove('open');
        document.querySelector('#pause-overlay .po-inner').style = '';
        window.MYTH_ORIENTATION_ACTIVE = false;
        if (window.MYTH_WORLD3D_CANVAS) window.MYTH_WORLD3D_CANVAS.requestPointerLock();
      },
    });
  }
}

// ── Stat change notification toast ───────────────────
let _statToastTimer = null;
let _statToastPending = {};

function _flushStatToast() {
  if (!Object.keys(_statToastPending).length) return;
  const parts = Object.entries(_statToastPending).map(([key, delta]) => {
    const sign = delta > 0 ? '+' : '';
    const color = delta > 0 ? '#6bcb77' : '#fc7b54';
    return `<span style="color:${color}">${sign}${delta.toFixed(1)} ${STAT_LABELS[key] || key}</span>`;
  });
  const toast = document.getElementById('stat-toast');
  if (!toast) { _statToastPending = {}; return; }
  toast.innerHTML = parts.join('  ·  ');
  toast.classList.add('visible');
  clearTimeout(_statToastTimer);
  _statToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    _statToastPending = {};
  }, 2800);
}

function _queueStatToast(key, delta) {
  if (!_statToastPending[key]) _statToastPending[key] = 0;
  _statToastPending[key] += delta;
}

// ════════════════════════════════════════════════════════
//  CLUB FAIR OVERLAY
// ════════════════════════════════════════════════════════

const CLUB_DATA = {
  robotics: {
    name:       'ROBOTICS CLUB',
    icon:       '🤖',
    desc:       'Build robots, write code that moves metal, compete nationally.',
    flavor:     'Meetings every Tuesday and Thursday in Room F3.',
    joinDeltas: { gpa: -0.2, friendships: 1.5, relationships: -1.3, extracurriculars: 2.0 },
    missDeltas: { gpa: -0.1, friendships: -0.5, extracurriculars: -0.5 },
  },
  football: {
    name:       'FOOTBALL TEAM',
    icon:       '🏈',
    desc:       'Practice every day after school. Friday night lights. The whole school watches.',
    flavor:     'Tryouts this week. Practice on the field.',
    joinDeltas: { gpa: -0.5, friendships: 1.8, sports: 2.0, intelligence: -1.6, extracurriculars: 1.2 },
    missDeltas: { sports: -0.8, friendships: -0.6, happiness: -0.4 },
  },
  none: {
    name:       'NO COMMITMENT',
    icon:       '📚',
    desc:       'Focus on your studies. Keep your schedule open. Your time is yours.',
    flavor:     'No meetings. No obligations.',
    joinDeltas: { gpa: 0.5, friendships: -1.0, intelligence: 1.4, extracurriculars: -0.8 },
    missDeltas: {},
  },
};

function showClubFairOverlay(boothType) {
  const data = CLUB_DATA[boothType];
  if (!data) return;
  const overlay = document.getElementById('club-fair-overlay');
  if (!overlay) return;
  const inner = overlay.querySelector('.cf-inner');
  const _rumorLine = player.rumor
    ? `<div class="cf-rumor-tag">💬 <em>"${player.rumor}"</em></div>`
    : '';
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; CLUB FAIR</div>
    ${_rumorLine}
    <div class="cf-icon">${data.icon}</div>
    <div class="cf-title">${data.name}</div>
    <p class="cf-desc">${data.desc}</p>
    <p class="cf-flavor">${data.flavor}</p>
    ${boothType !== 'none' ? '<p class="cf-warning">This is a commitment. Missing meetings has consequences.</p>' : ''}
    <div class="cf-buttons">
      <button class="btn-primary" id="cf-join-btn">JOIN →</button>
      <button class="cf-pass-btn" id="cf-pass-btn">PASS</button>
    </div>
    <div class="or-key-hint" style="margin-top:6px;font-size:0.72rem;opacity:0.5">[ ENTER ] to join</div>
  `;
  overlay.classList.add('open');
  G.from(inner, { opacity: 0, y: 20, duration: 0.45, ease: 'power2.out' });

  let _fired = false;
  function _doJoin() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _cfEnterKH);
    resolveClubChoice(boothType, true);
  }
  function _doPass() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _cfEnterKH);
    resolveClubChoice(boothType, false);
  }
  function _cfEnterKH(e) { if (e.key === 'Enter') _doJoin(); }
  document.addEventListener('keydown', _cfEnterKH);
  document.getElementById('cf-join-btn').addEventListener('click', _doJoin, { once: true });
  document.getElementById('cf-pass-btn').addEventListener('click', _doPass, { once: true });
}

function resolveClubChoice(boothType, joined) {
  const overlay = document.getElementById('club-fair-overlay');
  const data    = CLUB_DATA[boothType];
  if (!data || !overlay) return;

  if (joined) {
    window.MYTH_CLUB_CHOICE      = boothType;
    window.MYTH_CLUB_MISS_DELTAS = data.missDeltas;
    Object.entries(data.joinDeltas).forEach(([k, v]) => Engine.modifyStat(k, v));
  } else {
    // Reset trigger so the player can walk up to a different booth
    window.MYTH_CLUB_FAIR_TRIGGERED = false;
  }

  const inner = overlay.querySelector('.cf-inner');
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; CLUB FAIR</div>
    <div class="cf-icon">${joined ? '✓' : '—'}</div>
    <div class="cf-title">${joined ? 'COMMITTED.' : 'YOUR CALL.'}</div>
    <p class="cf-desc">${joined
      ? 'You\'re in. Show up when it counts.'
      : 'You walk past the booth. The recruiter doesn\'t say anything.'}</p>
    <button class="btn-primary" id="cf-done-btn" style="margin-top:28px">CONTINUE →</button>
    <div class="or-key-hint" style="margin-top:6px;font-size:0.72rem;opacity:0.5">[ ENTER ] to continue</div>
  `;

  let _fired = false;
  function _doDone() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _cfDoneKH);
    G.to(overlay, {
      opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        overlay.classList.remove('open');
        overlay.style.opacity = '';
        window.MYTH_ORIENTATION_ACTIVE = false;
        refreshStatsSidebar();
        if (window.MYTH_WORLD3D_CANVAS) window.MYTH_WORLD3D_CANVAS.requestPointerLock();
        setTimeout(() => {
          if (window.MYTH_SHOW_NOTIF) window.MYTH_SHOW_NOTIF('Head to Biology Room 102 — next to the Club Fair.');
          if (joined && window.MYTH_CLUB_CHOICE && window.MYTH_CLUB_CHOICE !== 'none') {
            showECNavBanner(window.MYTH_CLUB_CHOICE);
          }
        }, 700);
      },
    });
  }
  function _cfDoneKH(e) { if (e.key === 'Enter') _doDone(); }
  document.addEventListener('keydown', _cfDoneKH);
  document.getElementById('cf-done-btn').addEventListener('click', _doDone, { once: true });
}

function showECNavBanner(ecChoice) {
  const existing = document.getElementById('ec-nav-banner');
  if (existing) existing.remove();

  const isRobotics = ecChoice === 'robotics';
  const name = isRobotics ? 'Robotics Club' : 'Football Team';
  const location = isRobotics ? 'the Gym (west side of campus)' : 'the Football Field (north of campus)';
  const icon = isRobotics ? '⚙' : '▶';

  const banner = document.createElement('div');
  banner.id = 'ec-nav-banner';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:1.5rem;opacity:0.9">${icon}</span>
      <div>
        <div style="font-size:0.72rem;letter-spacing:0.1em;opacity:0.7;text-transform:uppercase">YOUR EC</div>
        <div style="font-size:0.92rem;font-weight:700;color:#f0dc88">${name}</div>
        <div style="font-size:0.75rem;opacity:0.75;margin-top:2px">Head to ${location}</div>
      </div>
    </div>
  `;
  banner.style.cssText = `
    position:fixed; bottom:80px; right:20px;
    background:rgba(8,15,40,0.93);
    border:1.5px solid rgba(232,208,112,0.5);
    border-radius:10px; padding:12px 16px;
    color:#e0d4b0; font-family:inherit; z-index:9000;
    box-shadow:0 4px 20px rgba(0,0,0,0.6);
    pointer-events:none;
    animation: ecBannerFadeIn 0.5s ease;
  `;
  document.body.appendChild(banner);
  window.MYTH_EC_NAV_BANNER = banner;
}

function showClubMissedOverlay() {
  const overlay   = document.getElementById('club-fair-overlay');
  if (!overlay) return;
  const clubName  = window.MYTH_CLUB_CHOICE === 'robotics' ? 'Robotics Club' : 'Football Practice';
  const missDeltas = window.MYTH_CLUB_MISS_DELTAS || {};
  // Apply penalties silently
  Object.entries(missDeltas).forEach(([k, v]) => Engine.modifyStat(k, v));

  const inner = overlay.querySelector('.cf-inner');
  inner.innerHTML = `
    <div class="or-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; COMMITMENT</div>
    <div class="cf-title">YOU MISSED ${clubName.toUpperCase()}.</div>
    <p class="cf-desc">You didn't show up. People noticed.</p>
    <button class="btn-primary" id="cf-done-btn" style="margin-top:28px">OK</button>
    <div class="or-key-hint" style="margin-top:6px;font-size:0.72rem;opacity:0.5">[ ENTER ] to continue</div>
  `;
  overlay.classList.add('open');
  G.from(inner, { opacity: 0, duration: 0.35 });

  let _fired = false;
  function _doDone() {
    if (_fired) return; _fired = true;
    document.removeEventListener('keydown', _missKH);
    G.to(overlay, {
      opacity: 0, duration: 0.4, ease: 'power2.in',
      onComplete: () => {
        overlay.classList.remove('open');
        overlay.style.opacity = '';
        window.MYTH_ORIENTATION_ACTIVE = false;
        if (window.MYTH_WORLD3D_CANVAS) window.MYTH_WORLD3D_CANVAS.requestPointerLock();
      },
    });
  }
  function _missKH(e) { if (e.key === 'Enter') _doDone(); }
  document.addEventListener('keydown', _missKH);
  document.getElementById('cf-done-btn').addEventListener('click', _doDone, { once: true });
}

// ═══════════════════════════════════════════════════════
//  BIO CLASS + PE EVENTS
// ═══════════════════════════════════════════════════════

const PIG_STATIONS = [
  {
    id: 'A', system: 'Cardiovascular System',
    setup: 'The pig is pinned supine. The chest cavity is open, exposing a dark reddish-purple, fist-sized organ nestled between two deflated, pale lungs.',
    region: 'HEART', emoji: '❤',
    question: 'What is the primary function of the heart?',
    choices: ['Filter toxins from the bloodstream', 'Pump blood through the circulatory system', 'Regulate body temperature'],
    correct: 1,
    right: 'Correct. The heart is a muscular pump that drives blood through both the pulmonary and systemic circuits.',
    wrong: 'Not quite. Filtration is the kidney\'s job — the heart is purely a pump.',
  },
  {
    id: 'B', system: 'Digestive System',
    setup: 'The abdominal cavity is pinned open. A large, multi-lobed brownish-red organ dominates the upper right quadrant of the body cavity.',
    region: 'LIVER', emoji: '🟤',
    question: 'What are the two main functions of the liver?',
    choices: ['Pumping blood and filtering oxygen', 'Producing bile and detoxifying blood', 'Gas exchange and nutrient absorption'],
    correct: 1,
    right: 'Correct. The liver produces bile for fat digestion and acts as the body\'s primary blood filter.',
    wrong: 'That\'s not it. The large brownish organ is the liver — it produces bile and detoxifies blood.',
  },
  {
    id: 'C', system: 'Respiratory System',
    setup: 'The thoracic cavity is pinned wide. Two pale, spongy organs flank the heart. Below them, a dome-shaped sheet of muscle separates the chest from the abdomen.',
    region: 'DIAPHRAGM', emoji: '🫧',
    question: 'What does the diaphragm do when you inhale?',
    choices: ['It relaxes and rises, compressing the lungs', 'It contracts and flattens, expanding chest volume to draw air in', 'It filters incoming air for pathogens'],
    correct: 1,
    right: 'Correct. Diaphragm contraction pulls the muscle downward, increasing chest volume and creating negative pressure.',
    wrong: 'Close — it\'s a muscle, and muscles contract. The diaphragm flattens downward to pull air into the lungs.',
  },
  {
    id: 'D', system: 'Urinary System',
    setup: 'Pinned against the dorsal body wall are two bean-shaped organs. A whitish tube runs from each toward the midline, merging at a small balloon-like organ below.',
    region: 'KIDNEYS', emoji: '🫘',
    question: 'How do the kidneys maintain homeostasis?',
    choices: ['By secreting hormones that control heart rate', 'By filtering blood and regulating fluid/electrolyte balance', 'By absorbing nutrients from the digestive tract'],
    correct: 1,
    right: 'Correct. The kidneys filter roughly 180 L of blood daily, regulating water, electrolytes, and pH.',
    wrong: 'Not quite. Kidneys filter blood and regulate fluid balance — homeostasis through excretion, not hormones.',
  },
  {
    id: 'E', system: 'Nervous System',
    setup: 'The dorsal cranium is carefully opened. A small, wrinkled organ sits in the braincase. It connects via the spinal cord running down the dorsal side of the spine.',
    region: 'BRAINSTEM', emoji: '🧠',
    question: 'Which region controls involuntary functions like breathing and heart rate?',
    choices: ['The cerebrum — conscious thought and movement', 'The cerebellum — balance and coordination', 'The brainstem / medulla oblongata — autonomic functions'],
    correct: 2,
    right: 'Correct. The medulla oblongata automates breathing, heart rate, and blood pressure without conscious input.',
    wrong: 'Those handle voluntary actions. The brainstem / medulla oblongata controls the involuntary systems.',
  },
];

function _bioClose(gpaDelta, gradeLabel, colorHex) {
  const overlay = document.getElementById('bio-overlay');
  if (!overlay) return;
  const inner = overlay.querySelector('.bio-inner');
  inner.innerHTML = `
    <div class="bio-result-screen" style="--grade-col:${colorHex}">
      <div class="or-badge">PERIOD 1 · BIOLOGY — RESULT</div>
      <div class="bio-result-grade">${gradeLabel}</div>
      <div class="bio-result-sub">${gpaDelta > 0 ? 'GPA improving.' : gpaDelta < 0 ? 'GPA took a hit.' : 'GPA unchanged.'}</div>
      <button class="btn-primary" id="bio-done-btn" style="margin-top:32px">CONTINUE →</button>
      <div class="or-key-hint" style="margin-top:8px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
    </div>
  `;
  if (gpaDelta !== 0 && typeof Engine !== 'undefined') Engine.modifyStat('gpa', gpaDelta);
  G.from(inner.querySelector('.bio-result-screen'), { opacity: 0, y: 20, duration: 0.5 });

  let _f = false;
  function _done() {
    if (_f) return; _f = true;
    document.removeEventListener('keydown', _kh);
    window.MYTH_POWER_OUTAGE  = false;
    window.MYTH_POWER_RESTORE = true;
    G.to(overlay, {
      opacity: 0, duration: 0.5, ease: 'power2.in',
      onComplete: () => {
        overlay.classList.remove('open');
        overlay.style.opacity = '';
        window.MYTH_BIO_DONE           = true;
        window.MYTH_ORIENTATION_ACTIVE = false;
        refreshStatsSidebar();
        if (window.MYTH_SHOW_NOTIF) window.MYTH_SHOW_NOTIF('Head to the gym — PE starts now.');
        if (window.MYTH_WORLD3D_CANVAS) window.MYTH_WORLD3D_CANVAS.requestPointerLock();
      },
    });
  }
  function _kh(e) { if (e.key === 'Enter') _done(); }
  document.addEventListener('keydown', _kh);
  document.getElementById('bio-done-btn').addEventListener('click', _done, { once: true });
}

// ── Scenario A: Power Outage ──────────────────────────────────────────────
function showBioOutage() {
  window.MYTH_BIO_SCENARIO = 'outage';
  window.MYTH_POWER_OUTAGE = true;
  const overlay = document.getElementById('bio-overlay');
  const inner   = overlay.querySelector('.bio-inner');

  const beats = [
    { delay: 0,    html: `<span class="outage-flash"></span><p>Mrs. Alvarez begins distributing the assessment rubrics.</p>` },
    { delay: 2400, html: `<p>Then — the lights. All of them die at once.</p>` },
    { delay: 4600, html: `<p class="outage-kicker">Because of the power outage, you got lucky and received an automatic A.</p>` },
  ];

  function renderBeat(idx) {
    const b = beats[idx];
    const row = document.createElement('div');
    row.className = 'outage-beat';
    row.innerHTML = b.html;
    inner.querySelector('.outage-story').appendChild(row);
    G.from(row, { opacity: 0, y: 12, duration: 0.6 });
    if (idx + 1 < beats.length) setTimeout(() => renderBeat(idx + 1), beats[idx + 1].delay - b.delay);
    else setTimeout(() => _bioClose(0.40, 'A', '#6BCB77'), 1800);
  }

  inner.innerHTML = `
    <div class="outage-scene">
      <div class="outage-sky">
        <div class="lightning l1"></div>
        <div class="lightning l2"></div>
        <div class="wind-particles">${Array.from({length:18},()=>'<span></span>').join('')}</div>
        <div class="rain-layer"></div>
      </div>
      <div class="outage-room-label">BIOLOGY · ROOM 102</div>
      <div class="outage-story"></div>
      <div class="outage-meter">
        <div class="outage-flicker"></div>
      </div>
    </div>
  `;
  G.from(inner, { opacity: 0, duration: 0.5 });
  setTimeout(() => renderBeat(0), 500);
}

// ── Scenario B: Pig Practical ─────────────────────────────────────────────
function showBioPractical() {
  window.MYTH_BIO_SCENARIO = 'practical';
  const overlay = document.getElementById('bio-overlay');
  const inner   = overlay.querySelector('.bio-inner');
  let score = 0, stationIdx = 0, _answered = false;

  function renderStation() {
    const s = PIG_STATIONS[stationIdx];
    _answered = false;
    inner.innerHTML = `
      <div class="practical-scene">
        <div class="practical-header">
          <span class="practical-badge">PERIOD 1 · BIOLOGY — PIG PRACTICAL</span>
          <span class="practical-progress">Station ${stationIdx + 1} / ${PIG_STATIONS.length}</span>
        </div>
        <div class="practical-tray">
          <div class="tray-label">${s.emoji} STATION ${s.id} — ${s.system.toUpperCase()}</div>
          <div class="tray-description">${s.setup}</div>
          <div class="tray-highlight">▶ Focus region: <strong>${s.region}</strong></div>
        </div>
        <div class="practical-question">${s.question}</div>
        <div class="practical-choices">
          ${s.choices.map((c,i)=>`<button class="prac-btn" data-idx="${i}">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}
        </div>
        <div class="practical-feedback" id="prac-fb"></div>
      </div>
    `;
    G.from(inner.querySelector('.practical-scene'), { opacity: 0, y: 16, duration: 0.4 });

    inner.querySelectorAll('.prac-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (_answered) return;
        _answered = true;
        const chosen = parseInt(this.dataset.idx);
        const correct = chosen === s.correct;
        if (correct) score++;
        inner.querySelectorAll('.prac-btn').forEach((b,i) => {
          b.disabled = true;
          if (i === s.correct) b.classList.add('prac-correct');
          else if (i === chosen && !correct) b.classList.add('prac-wrong');
        });
        const fb = document.getElementById('prac-fb');
        fb.textContent = correct ? `✓ ${s.right}` : `✗ ${s.wrong}`;
        fb.className = 'practical-feedback ' + (correct ? 'fb-right' : 'fb-wrong');
        G.from(fb, { opacity: 0, duration: 0.3 });
        setTimeout(() => {
          stationIdx++;
          if (stationIdx < PIG_STATIONS.length) renderStation();
          else showPracticalResult();
        }, 2200);
      });
    });
  }

  function showPracticalResult() {
    const pct = score / PIG_STATIONS.length;
    let grade, gpaDelta, col;
    if (pct >= 1.0)        { grade='A+'; gpaDelta= 0.50; col='#F7B731'; }
    else if (pct >= 0.8)   { grade='A';  gpaDelta= 0.35; col='#6BCB77'; }
    else if (pct >= 0.6)   { grade='B+'; gpaDelta= 0.15; col='#6BCB77'; }
    else if (pct >= 0.4)   { grade='B';  gpaDelta= 0;    col='#aaa';    }
    else if (pct >= 0.2)   { grade='C';  gpaDelta=-0.15; col='#FC7B54'; }
    else                   { grade='F';  gpaDelta=-0.40; col='#e05050'; }

    inner.innerHTML = `
      <div class="practical-results">
        <div class="or-badge">BIOLOGY · PIG PRACTICAL — SCORED</div>
        <div class="prac-score-line">
          <span class="prac-score-num" style="color:${col}">${score} / ${PIG_STATIONS.length}</span>
          <span class="prac-score-grade" style="color:${col}">${grade}</span>
        </div>
        <div class="prac-score-breakdown">
          ${PIG_STATIONS.map((s,i)=>`<div class="prac-station-row">Station ${s.id} — ${s.system}</div>`).join('')}
        </div>
        <button class="btn-primary" id="prac-done-btn" style="margin-top:28px">CONTINUE →</button>
        <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
      </div>
    `;
    G.from(inner.querySelector('.practical-results'), { opacity: 0, y: 20, duration: 0.5 });
    let _f = false;
    function _done() {
      if (_f) return; _f = true;
      document.removeEventListener('keydown', _pkh);
      _bioClose(gpaDelta, grade, col);
    }
    function _pkh(e) { if (e.key === 'Enter') _done(); }
    document.addEventListener('keydown', _pkh);
    document.getElementById('prac-done-btn').addEventListener('click', _done, { once: true });
  }

  // Intro card before first station
  inner.innerHTML = `
    <div class="practical-intro">
      <div class="or-badge">PERIOD 1 · BIOLOGY</div>
      <div class="practical-intro-title">PIG PRACTICAL</div>
      <p class="practical-intro-desc">Five dissection trays. Five pigs. You have one question per station.<br>Walk up, assess what you see, and answer.</p>
      <button class="btn-primary" id="prac-start-btn" style="margin-top:28px">BEGIN →</button>
      <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to begin</div>
    </div>
  `;
  G.from(inner, { opacity: 0, duration: 0.5 });
  let _startFired = false;
  function _startDone() {
    if (_startFired) return; _startFired = true;
    document.removeEventListener('keydown', _startKH);
    renderStation();
  }
  function _startKH(e) { if (e.key === 'Enter') _startDone(); }
  document.addEventListener('keydown', _startKH);
  document.getElementById('prac-start-btn').addEventListener('click', _startDone, { once: true });
}

// ── Scenario C: Chemical Incident ─────────────────────────────────────────
function showBioChemical() {
  window.MYTH_BIO_SCENARIO = 'chemical';
  const overlay = document.getElementById('bio-overlay');
  const inner   = overlay.querySelector('.bio-inner');

  const beats = [
    { delay: 0,    text: 'You got lucky! They used the wrong chemicals to clean the pigs and now every student in Bio gets an automatic A,' },
  ];

  inner.innerHTML = `
    <div class="chem-scene">
      <div class="chem-room">
        <div class="chem-desks">
          ${Array.from({length:6},(_,i)=>`<div class="chem-desk" style="--di:${i}"></div>`).join('')}
        </div>
        <div class="smoke-container">
          <div class="smoke-cloud s1"></div>
          <div class="smoke-cloud s2"></div>
          <div class="smoke-cloud s3"></div>
        </div>
        <div class="faint-figure" id="faint-figure"></div>
        <div class="ambulance-element" id="ambulance-el"></div>
      </div>
      <div class="chem-story" id="chem-story"></div>
    </div>
  `;
  G.from(inner, { opacity: 0, duration: 0.5 });

  let smokeActive = false, ambulanceActive = false;
  function renderBeat(idx) {
    const b = beats[idx];
    const div = document.createElement('div');
    div.className = 'chem-beat';
    div.textContent = b.text;
    document.getElementById('chem-story').appendChild(div);
    G.from(div, { opacity: 0, y: 8, duration: 0.5 });

    if (b.special === 'smell' && !smokeActive) {
      smokeActive = true;
      inner.querySelectorAll('.smoke-cloud').forEach(s => s.classList.add('active'));
    }
    if (b.special === 'faint') {
      const ff = document.getElementById('faint-figure');
      if (ff) { ff.classList.add('active'); setTimeout(() => ff.classList.add('fallen'), 1200); }
    }
    if (b.special === 'alarm') {
      inner.querySelector('.chem-room').classList.add('alarm-state');
    }
    if (b.special === 'ambulance') {
      const ae = document.getElementById('ambulance-el');
      if (ae) ae.classList.add('active');
    }

    if (idx + 1 < beats.length) setTimeout(() => renderBeat(idx + 1), beats[idx + 1].delay - b.delay);
    else setTimeout(() => _bioClose(0.30, 'A', '#6BCB77'), 2200);
  }
  setTimeout(() => renderBeat(0), 400);
}

// Show bio class intro then branch randomly
function showBioClassEvent() {
  window.MYTH_ORIENTATION_ACTIVE = true;
  const overlay = document.getElementById('bio-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const inner = overlay.querySelector('.bio-inner');
  const _bgBioLines = {
    new_kid:       "Good luck!",
    legacy:        "Good luck!",
    scholarship:   "Good luck!",
    transfer:      "Good luck!",
    local_legend:  "Good luck!",
    military:      "Good luck!",
    online_famous: "Good luck!",
    returnee:      "Good luck!",
    prodigy:       "Good luck!",
    old_money:     "Good luck!",
  };
  const _bgNote = (_bgBioLines[player.background && player.background.id] ||
    "You make your way to the biology building.");
  inner.innerHTML = `
    <div class="bio-transition">
      <div class="or-badge">MONTA VISTA HIGH SCHOOL</div>
      <div class="bio-trans-period">PERIOD 1</div>
      <div class="bio-trans-subject">BIOLOGY</div>
      <div class="bio-trans-room">South Wing · Room 102</div>
      <div class="bio-trans-line"></div>
      <p class="bio-trans-note">${_bgNote} Five dissection trays sit on the lab tables.</p>
    </div>
  `;
  G.from(inner, { opacity: 0, duration: 0.7 });

  // Pick from the two scenarios not played last — ensures equal rotation
  const _allBio = ['outage', 'practical', 'chemical'];
  const _bioPool = _allBio.filter(s => s !== window._MYTH_LAST_BIO_SCENARIO);
  const chosen = _bioPool[Math.floor(Math.random() * _bioPool.length)];
  window._MYTH_LAST_BIO_SCENARIO = chosen;
  setTimeout(() => {
    if (chosen === 'outage')         showBioOutage();
    else if (chosen === 'practical') showBioPractical();
    else                             showBioChemical();
  }, 3000);
}

// ═══════════════════════════════════════════════════════
//  PE CLASS — BOMB THREAT
// ═══════════════════════════════════════════════════════

function showPEBombThreat() {
  window.MYTH_ORIENTATION_ACTIVE  = true;
  window.MYTH_BOMB_THREAT_ACTIVE  = true;
  const overlay = document.getElementById('pe-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const inner = overlay.querySelector('.pe-inner');

  runBombThreat();

  function runBombThreat() {
    // Go full-screen for the bomb threat — maximum immersion
    overlay.classList.add('threat-fullscreen');

    inner.innerHTML = `
      <div class="threat-scene" id="threat-scene">
        <div class="threat-static" id="threat-static"></div>
        <div class="threat-alert-bar" id="threat-bar">
          <span class="threat-bar-text">🚨 EMERGENCY BROADCAST — MONTA VISTA HIGH SCHOOL 🚨</span>
        </div>
        <div class="threat-broadcast-stamp" id="threat-stamp">LIVE</div>
        <div class="threat-pa" id="threat-pa"></div>
        <div class="threat-gym-dark">
          <div class="threat-corner-students" id="corner-students"></div>
          <div class="threat-player-you" id="player-you"></div>
          <div class="threat-lights" id="threat-lights"></div>
        </div>
        <div class="threat-story" id="threat-story"></div>
      </div>
    `;
    G.from(inner, { opacity: 0, duration: 0.3 });

    const pa    = document.getElementById('threat-pa');
    const story = document.getElementById('threat-story');

    const _secretThought = (function() {
      const _t = {
        /*
        anxiety:      "The silence is the worst part. Your brain won't stop running scenarios. You breathe through it, one count at a time. You've done this before.",
        learning:     "Your mind races in its own direction, like always. You catalog exits, patterns, details. A different kind of processing. It keeps you calm.",
        wealthy:      "You think about how none of this — the school, the floor, the bleachers — would feel real if you told anyone what your house looks like.",
        talent:       "For some reason, all you can think about is a sketch you never finished. You trace it mentally on the back of your hand.",
        family:       "You've sat in tense, silent rooms before. You know how to go somewhere else in your head. You go there now.",
        ex_athlete:   "You feel your weight distributed correctly — heels, knees, back flat. The training doesn't leave. It just becomes background noise.",
        crush:        "You scan the corner twice before you find them. They're okay. You look away before they notice you looking.",
        following:    "Nobody here knows you. Nobody here knows the other you either. Right now, that feels like the only good thing.",
        chronic:      "You check your body the way you always do, automatically — levels, breathing, tension. You're okay. You stay okay.",
        therapy:      "Your therapist would say: name five things you can see. Cold floor. Wrestling mat. Emergency sign. Dusty bleacher. Someone's untied shoe. You're okay.",
        ghosted:      "You think about the last group chat. They're probably not thinking about you right now. You're not sure if that's better or worse.",
        writer:       "Somewhere in the back of your head, you're already writing this. The cold floor. The held breath. The way time dilates when nothing moves.",
        bad_breakup:  "The thing about real fear is it makes everything else feel like noise. For a minute, the other stuff doesn't matter. You hate that it's almost a relief.",
        secret_keep:  "You think about what you know. About what it would mean if something actually happened here and certain people never got to answer for it.",
        language:     "You start counting in the other language. Quietly. In your head. It has always felt like a private room nobody else can enter.",
        dropout_risk: "You almost didn't come back this year. Sitting here now, you can't decide if that makes this feel more precious or more fragile.",
        */
      };
      return _t[player.secret && player.secret.id] || "The seconds move slowly.";
    })();

    // Phase 1 sequence — plays up to the choice point
    const phase1 = [
      { delay: 0,    pa: '[— PA STATIC —]',   text: null, effect: 'crackle' },
      { delay: 900,  pa: '"ATTENTION ALL MONTA VISTA HIGH STUDENTS AND STAFF."', text: null, effect: 'alarm' },
      { delay: 2800, pa: '"A THREAT HAS BEEN RECEIVED AT THIS FACILITY."', text: null, effect: null },
      { delay: 4600, pa: '"THIS IS A LOCKDOWN. THIS IS NOT A DRILL."', text: null, effect: 'strobe' },
      { delay: 6200, pa: '"ALL STUDENTS AND STAFF REPORT TO SECURE LOCATIONS IMMEDIATELY. DO NOT LEAVE YOUR SECURE LOCATION UNTIL FURTHER NOTICE."', text: null, effect: null },
      /*{ delay: 9000, pa: null, text: 'The gym lights cut. Emergency strips on the ceiling click to red.', effect: 'dim' },
      { delay: 11200, pa: null, text: '"CORNER — NORTHEAST — NOW! GO GO GO!" Coach Williams doesn\'t sound like a coach anymore.', effect: 'corner' },
      { delay: 13400, pa: null, text: 'You compress into the far corner under the emergency exit sign. Cold concrete wall. Thirty bodies. Everyone is breathing too fast.', effect: 'hide' },
      { delay: 15600, pa: null, text: 'Someone starts sobbing quietly behind you. A freshman you don\'t know. You don\'t turn around. Nobody does.', effect: null },
      { delay: 17200, pa: null, text: _secretThought, effect: null },
      { delay: 19000, pa: null, text: 'Coach Williams: "Nobody moves. I mean it. Nobody moves." His voice is completely flat. That\'s the scariest part.', effect: null },*/
    ];

    function addBeat(text, cls) {
      const d = document.createElement('div');
      d.className = cls || 'threat-beat';
      d.textContent = text;
      story.appendChild(d);
      story.scrollTop = story.scrollHeight;
      G.from(d, { opacity: 0, y: 10, duration: 0.5 });
    }

    function runPhase1(i) {
      const s = phase1[i];
      if (s.pa) {
        pa.textContent = s.pa;
        pa.className = 'threat-pa' + (s.effect === 'crackle' ? ' crackle' : ' lockdown-msg');
        G.from(pa, { opacity: 0, duration: 0.4 });
      }
      if (s.text) addBeat(s.text);
      const scene = document.getElementById('threat-scene');
      if (s.effect === 'alarm'  && scene) scene.classList.add('alarm-active');
      if (s.effect === 'dim'    && scene) scene.classList.add('lights-dimmed');
      if (s.effect === 'strobe' && scene) scene.classList.add('strobe-active');
      if (s.effect === 'corner') {
        const cs = document.getElementById('corner-students');
        if (cs) cs.classList.add('huddled');
        const py = document.getElementById('player-you');
        if (py) py.classList.add('hiding');
      }
      if (i + 1 < phase1.length) {
        setTimeout(() => runPhase1(i + 1), phase1[i + 1].delay - s.delay);
      } else {
        setTimeout(showChoice, 2000);
      }
    }

    function showChoice() {
      // Pause narrative — present the disobey choice
      const choiceDiv = document.createElement('div');
      choiceDiv.className = 'threat-choice';
      choiceDiv.innerHTML = `
        <p class="threat-choice-prompt">The emergency exit is 15 feet away.</p>
        <div class="threat-choice-btns">
          <button class="threat-btn-stay" id="threat-stay">STAY PUT</button>
          <button class="threat-btn-run"  id="threat-run">MAKE A RUN FOR IT</button>
        </div>
      `;
      story.appendChild(choiceDiv);
      story.scrollTop = story.scrollHeight;
      G.from(choiceDiv, { opacity: 0, y: 14, duration: 0.6 });

      document.getElementById('threat-stay').addEventListener('click', () => {
        choiceDiv.remove();
        runPhase2_stay();
      }, { once: true });
      document.getElementById('threat-run').addEventListener('click', () => {
        choiceDiv.remove();
        runPhase2_run();
      }, { once: true });
    }

    // Branch A — obey
    function runPhase2_stay() {
      const beats = [
        { delay: 0,    pa: '[41 MINUTES LATER]', text: null, time: true },
        { delay: 1400, pa: null, text: 'All-clear.' },
        { delay: 4200, pa: null, text: 'You walk out into the afternoon.' },
      ];
      function rb(i) {
        const s = beats[i];
        if (s.pa) { pa.textContent = s.pa; pa.className = 'threat-pa' + (s.time ? ' time-stamp' : ' lockdown-msg'); G.from(pa, { opacity: 0, duration: 0.4 }); }
        if (s.text) addBeat(s.text);
        const scene = document.getElementById('threat-scene');
        if (scene) { scene.classList.remove('alarm-active'); scene.classList.add('all-clear'); }
        if (i + 1 < beats.length) setTimeout(() => rb(i + 1), beats[i + 1].delay);
        else setTimeout(() => showPEResult(false), 2400);
      }
      rb(0);
    }

    // Branch B — disobey
    function runPhase2_run() {
      window.MYTH_PE_DISOBEYED = true;
      const scene = document.getElementById('threat-scene');
      if (scene) scene.classList.add('run-flash');
      const beats = [
        { delay: 0,    text: 'You move. Three seconds, door, outside.' },
        { delay: 2200, text: 'You\'re the only student in the courtyard. A police officer sees you immediately. He does not look relieved.' },
      ];
      function rb(i) {
        const s = beats[i];
        if (s.text) addBeat(s.text, 'threat-beat threat-beat-run');
        if (i + 1 < beats.length) setTimeout(() => rb(i + 1), beats[i + 1].delay);
        else setTimeout(() => showPrincipalsOffice(), 2400);
      }
      rb(0);
    }

    function showPrincipalsOffice() {
      overlay.classList.remove('threat-fullscreen');
      const inner2 = overlay.querySelector('.pe-inner');
      inner2.innerHTML = `
        <div class="pe-result-screen principal-scene">
          <div class="or-badge">MONDAY MORNING · PRINCIPAL'S OFFICE</div>
          <div class="pe-result-title" style="color:#e0c878;font-size:2rem">PRINCIPAL CLAUSNITZER</div>
          <p class="pe-result-text" style="font-size:1.25rem;max-width:600px;margin:0 auto 10px">
            The office smells like carpet and old coffee.
          </p>
          <p class="pe-result-text" style="font-size:1.2rem;font-style:italic;color:#ffd700;max-width:600px;margin:0 auto 18px">
            "You left during a lockdown. Against every protocol we have."
          </p>
          <p class="pe-result-text" style="font-size:1.1rem;color:#c8c0b0;max-width:560px;margin:0 auto 24px">
            Your parents aren't saying anything.
          </p>
          <div class="threat-choice" style="margin-top:10px">
            <div class="threat-choice-btns" style="justify-content:center;gap:18px">
              <button class="threat-btn-stay" id="po-apologize" style="min-width:220px;font-size:1rem">
                APOLOGIZE
              </button>
              <button class="threat-btn-run" id="po-defend" style="min-width:220px;font-size:1rem">
                DEFEND YOURSELF
              </button>
            </div>
          </div>
        </div>
      `;
      G.from(inner2.querySelector('.principal-scene'), { opacity: 0, y: 20, duration: 0.5 });

      document.getElementById('po-apologize').addEventListener('click', () => {
        inner2.innerHTML = `
          <div class="pe-result-screen principal-scene">
            <div class="or-badge">PRINCIPAL'S OFFICE — CONTINUED</div>
            <div class="pe-result-icon" style="font-size:2.4rem">📋</div>
            <div class="pe-result-title" style="color:#88cc88;font-size:1.8rem">YOU APOLOGIZED</div>
            <p class="pe-result-text" style="font-size:1.25rem;max-width:600px;margin:0 auto 14px">
              "I panicked," you say. "I know I shouldn't have. I'm sorry."
            </p>
            <p class="pe-result-text" style="font-size:1.15rem;color:#c8c0b0;max-width:580px;margin:0 auto 14px">
              "That's the right answer. Doesn't undo what you did — but it's the right answer."
            </p>
            <button class="btn-primary" id="pe-done-btn" style="margin-top:22px">CONTINUE →</button>
            <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
          </div>
        `;
        G.from(inner2.querySelector('.principal-scene'), { opacity: 0, y: 20, duration: 0.5 });
        if (typeof Engine !== 'undefined')
          Engine.modifyStats({ happiness: -1.5, stress: -1.0, integrity: +1.0, gpa: -0.1 });
        _wirePeDoneBtn();
      }, { once: true });

      document.getElementById('po-defend').addEventListener('click', () => {
        inner2.innerHTML = `
          <div class="pe-result-screen principal-scene">
            <div class="or-badge">PRINCIPAL'S OFFICE — CONTINUED</div>
            <div class="pe-result-title" style="color:#e07070;font-size:1.8rem">YOU STOOD YOUR GROUND</div>
            <p class="pe-result-text" style="font-size:1.25rem;max-width:600px;margin:0 auto 14px">
              "I thought there was a real shooter."
            </p>
            <p class="pe-result-text" style="font-size:1.15rem;color:#c8c0b0;max-width:580px;margin:0 auto 14px">
              "That is the wrong answer in this office."
            </p>
            <button class="btn-primary" id="pe-done-btn" style="margin-top:22px">CONTINUE →</button>
            <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
          </div>
        `;
        G.from(inner2.querySelector('.principal-scene'), { opacity: 0, y: 20, duration: 0.5 });
        if (typeof Engine !== 'undefined')
          Engine.modifyStats({ happiness: -2.5, stress: +1.5, integrity: -0.5, gpa: -0.2 });
        _wirePeDoneBtn();
      }, { once: true });

      function _wirePeDoneBtn() {
        let _fp = false;
        function _donePO() {
          if (_fp) return; _fp = true;
          document.removeEventListener('keydown', _pokh);
          // Close the PE overlay and go straight to the year-end recap
          window.MYTH_BOMB_THREAT_ACTIVE = false;
          window.MYTH_BOMB_CLEAR         = true;
          window.MYTH_PE_DONE            = true;
          G.to(overlay, {
            opacity: 0, duration: 0.5, ease: 'power2.in',
            onComplete: () => {
              overlay.classList.remove('open');
              overlay.classList.remove('threat-fullscreen');
              overlay.style.opacity = '';
              window.MYTH_ORIENTATION_ACTIVE = false;
              showFreshmanYearEnd();
            },
          });
        }
        function _pokh(e) { if (e.key === 'Enter') _donePO(); }
        document.addEventListener('keydown', _pokh);
        setTimeout(() => {
          const btn = document.getElementById('pe-done-btn');
          if (btn) btn.addEventListener('click', _donePO, { once: true });
        }, 100);
      }
    }

    runPhase1(0);
  }

  function showPEResult(disobeyed) {
    overlay.classList.remove('threat-fullscreen');
    const inner2 = overlay.querySelector('.pe-inner');
    if (disobeyed) {
      inner2.innerHTML = `
        <div class="pe-result-screen">
          <div class="or-badge">PERIOD 4 · PE — LOCKDOWN CONCLUDED</div>
          <div class="pe-result-title" style="color:#e05050">PRINCIPAL'S OFFICE.</div>
          <p class="pe-result-text">It was a false alarm. But you ran during a lockdown — monday morning: a meeting with the principal.</p>
          <button class="btn-primary" id="pe-done-btn" style="margin-top:28px">CONTINUE →</button>
          <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
        </div>
      `;
    } else {
      inner2.innerHTML = `
        <div class="pe-result-screen">
          <div class="or-badge">PERIOD 4 · PE — LOCKDOWN CONCLUDED</div>
          <div class="pe-result-title">FALSE ALARM.</div>
          <p class="pe-result-text">A prank. Probably.</p>
          <button class="btn-primary" id="pe-done-btn" style="margin-top:28px">CONTINUE →</button>
          <div class="or-key-hint" style="margin-top:6px;font-size:.7rem;opacity:.45">[ ENTER ] to continue</div>
        </div>
      `;
    }
    G.from(inner2.querySelector('.pe-result-screen'), { opacity: 0, y: 20, duration: 0.5 });

    if (typeof Engine !== 'undefined') {
      if (disobeyed) {
        Engine.modifyStats({ happiness: -3.0, intelligence: -0.3, friendships: -0.5, gpa: -0.1 });
      } else {
        Engine.modifyStats({ happiness: -2.0, intelligence: 0.5, friendships: 0.3 });
      }
    }

    let _f = false;
    function _done() {
      if (_f) return; _f = true;
      document.removeEventListener('keydown', _pekh);
      window.MYTH_BOMB_THREAT_ACTIVE = false;
      window.MYTH_BOMB_CLEAR         = true;
      G.to(overlay, {
        opacity: 0, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          overlay.classList.remove('open');
          overlay.style.opacity = '';
          window.MYTH_ORIENTATION_ACTIVE = false;
          showFreshmanYearEnd();
        },
      });
    }
    function _pekh(e) { if (e.key === 'Enter') _done(); }
    document.addEventListener('keydown', _pekh);
    document.getElementById('pe-done-btn').addEventListener('click', _done, { once: true });
  }
}

// ═══════════════════════════════════════════════════════
//  FRESHMAN YEAR COMPLETION CUTSCENE
// ═══════════════════════════════════════════════════════
function showFreshmanYearEnd() {
  const start  = window.MYTH_START_STATS || {};
  const now    = (typeof Engine !== 'undefined' && Engine.getState) ? (Engine.getState()?.stats ?? player.stats) : player.stats;
  const ec     = window.MYTH_CLUB_CHOICE === 'robotics' ? 'Robotics Club' :
                 window.MYTH_CLUB_CHOICE === 'football'  ? 'Football'       : 'No EC joined';

  const statOrder = ['gpa','friendships','relationships','sports','intelligence','extracurriculars','happiness'];
  const MAX       = { gpa: 4, friendships: 10, relationships: 10, sports: 10, intelligence: 10, extracurriculars: 10, happiness: 10 };

  function statRow(key) {
    const s0  = start[key] ?? now[key];
    const s1  = now[key];
    const d   = +(s1 - s0).toFixed(2);
    const pct = key === 'gpa' ? (s1 / 4) * 100 : (s1 / 10) * 100;
    const col = pct >= 70 ? '#F7B731' : pct >= 40 ? '#6BCB77' : '#FC7B54';
    const arrow = d > 0 ? `<span style="color:#6BCB77">▲ +${d}</span>` :
                  d < 0 ? `<span style="color:#FC7B54">▼ ${d}</span>`  :
                          `<span style="color:#888">— 0</span>`;
    const label = STAT_LABELS[key] || key.toUpperCase();
    const barW  = Math.round(pct);
    return `
      <div class="yr-stat-row">
        <span class="yr-stat-label">${label}</span>
        <div class="yr-stat-bar-wrap">
          <div class="yr-stat-bar" style="width:${barW}%;background:${col}"></div>
        </div>
        <span class="yr-stat-val">${s1.toFixed(key==='gpa'?2:1)}</span>
        <span class="yr-stat-delta">${arrow}</span>
      </div>
    `;
  }

  const gpa     = now.gpa || 0;
  const overallLabel = gpa >= 3.8 ? 'HONORS FRESHMAN' : gpa >= 3.0 ? 'SOLID YEAR' : gpa >= 2.0 ? 'GETTING BY' : 'ROUGH START';
  const overallDesc  = gpa >= 3.8 ? "You finished your first year stronger than most upperclassmen. They noticed."
                     : gpa >= 3.0 ? "You held it together. First year of high school — that's harder than it sounds."
                     : gpa >= 2.0 ? "It wasn't your best work. You know that. So does everyone else. Sophomore year is a reset."
                     : "This year got away from you. But you're still here.";

  const overlay = document.getElementById('year-end-overlay');
  if (!overlay) {
    // Fallback: inject overlay if not in HTML
    const el = document.createElement('div');
    el.id = 'year-end-overlay';
    el.className = 'year-end-overlay';
    document.getElementById('scene-game').appendChild(el);
  }
  const el = document.getElementById('year-end-overlay');
  el.innerHTML = `
    <div class="yr-inner">
      <div class="yr-top-badge">MONTA VISTA HIGH SCHOOL · CUPERTINO, CA</div>
      <div class="yr-year-label">FRESHMAN YEAR</div>
      <div class="yr-complete">COMPLETE</div>
      <div class="yr-divider"></div>
      <div class="yr-verdict-label">${overallLabel}</div>
      <p class="yr-verdict-desc">${overallDesc}</p>
      <div class="yr-ec-line">EC: <span class="yr-ec-val">${ec}</span></div>
      <div class="yr-stats">
        ${statOrder.map(statRow).join('')}
      </div>
      <div class="yr-divider" style="margin-top:28px"></div>
      <div class="yr-next-label">SOPHOMORE YEAR BEGINS</div>
      <p class="yr-next-desc">The campus is yours now. The restrictions are gone. Whatever reputation you built this year — you carry it into Year 2.</p>
      <button class="btn-primary yr-continue-btn" id="yr-continue-btn">CONTINUE TO SOPHOMORE YEAR →</button>
      <div class="or-key-hint" style="margin-top:8px;font-size:.7rem;opacity:.4">[ ENTER ] to continue</div>
    </div>
  `;
  el.style.display = 'flex';
  G.from(el, { opacity: 0, duration: 0.8 });
  G.from(el.querySelector('.yr-inner'), { y: 30, opacity: 0, duration: 1.0, ease: 'power2.out' });

  let _f2 = false;
  function _finish() {
    if (_f2) return; _f2 = true;
    document.removeEventListener('keydown', _yrKH);
    G.to(el, { opacity: 0, duration: 0.6, onComplete: () => {
      el.style.display = 'none';
      window.MYTH_PE_DONE              = true;
      window.MYTH_ORIENTATION_ACTIVE   = false;
      window.MYTH_FRESHMAN_RESTRICTION = false;
      refreshStatsSidebar();
      setTimeout(() => showSophomoreYear(), 400);
    }});
  }
  function _yrKH(e) { if (e.key === 'Enter') _finish(); }
  document.addEventListener('keydown', _yrKH);
  document.getElementById('yr-continue-btn').addEventListener('click', _finish, { once: true });
}

function groupLabels_g(g) {
  return { mob: 'SOGYAG', balance: 'XOBX', grind: "SACUL" }[g] || '—';
}
function persLabels_g(p) {
  return {
    grinder:  'THE GRINDER',
    social:   'SOCIAL BUTTERFLY',
    athlete:  'THE ATHLETE',
    charmer:  'THE CHARMER',
    observer: 'THE OBSERVER',
    rebel:    'THE REBEL',
    empath:   'THE EMPATH',
    wildcard: 'THE WILDCARD',
  }[p] || '—';
}

// ═══════════════════════════════════════════════════════
//  YEAR PROGRESSION — Sophomore · Junior · Senior
// ═══════════════════════════════════════════════════════

const STAT_SHORT = {
  gpa:'GPA', friendships:'FRND', relationships:'REL',
  sports:'SPT', intelligence:'INT', extracurriculars:'EC', happiness:'HAP'
};

function statChips(deltas) {
  return Object.entries(deltas).map(([k,v]) => {
    const cls = v > 0 ? 'chip-gain' : 'chip-lose';
    return `<span class="stat-chip ${cls}">${v>0?'+':''}${v} ${STAT_SHORT[k]||k}</span>`;
  }).join('');
}

function applyDeltas(deltas) {
  Object.entries(deltas).forEach(([k,v]) => {
    if (typeof Engine !== 'undefined' && Engine.modifyStat) Engine.modifyStat(k, v);
  });
}

function _getYrOverlay() {
  let el = document.getElementById('year-select-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'year-select-overlay';
    el.className = 'year-select-overlay';
    document.getElementById('scene-game').appendChild(el);
  }
  el.style.display = 'flex';
  el.style.opacity = '1';
  return el;
}

function _currentStats() {
  return (typeof Engine !== 'undefined' && Engine.getState)
    ? (Engine.getState()?.stats ?? player.stats) : player.stats;
}

function _statsGrid(now) {
  return Object.keys(STAT_LABELS).map(k => {
    const v = now[k] ?? 0;
    const pct = k==='gpa' ? (v/4)*100 : (v/10)*100;
    const col = pct>=70?'#F7B731':pct>=40?'#6BCB77':'#FC7B54';
    return `<div class="ys-stat-row">
      <span class="ys-stat-key">${STAT_LABELS[k]}</span>
      <div class="ys-bar-wrap"><div class="ys-bar-fill" style="width:${Math.min(pct,100)}%;background:${col}"></div></div>
      <span class="ys-stat-num">${v.toFixed(k==='gpa'?2:1)}</span>
    </div>`;
  }).join('');
}

// ── SOPHOMORE YEAR ──────────────────────────────────

const SOPH_PATHS = [
  { id:'ap_cs',   icon:'💻', title:'AP COMPUTER SCIENCE A',
    desc:'You grind code all semester. The final exam breaks you.',
    outcome:'You pass out during the final. Fracture your jaw on the floor.',
    deltas:{ intelligence:1.5, extracurriculars:2.0, happiness:-2.0, gpa:-1.0 } },
  { id:'studies', icon:'📖', title:'STUDIES CLASS',
    desc:'You prioritize balance. Someone catches your eye every day.',
    outcome:'You secure a significant other.',
    deltas:{ gpa:0.3, relationships:3.0, happiness:1.5, extracurriculars:-1.0 } },
  { id:'precalc', icon:'📐', title:'PRE-CALC HONORS',
    desc:'First test. You open the booklet and know nothing.',
    outcome:'You fail the exam. Tutoring follows.',
    deltas:{ intelligence:1.0, gpa:-0.5, happiness:-1.5, extracurriculars:0.5 } },
  { id:'physics', icon:'🥚', title:'PHYSICS — EGG DROP',
    desc:'Weeks of engineering. Culminates in a trip to Great America.',
    outcome:'Time-sink, but the field trip is a blast.',
    deltas:{ gpa:-0.2, friendships:2.0, happiness:2.0, intelligence:1.0 } }
];

const SOPH_EVENTS = [
  { icon:'🎮', title:'BRAWL STARS PHASE',
    desc:'You and the crew get hooked. Weekend sessions spiral.',
    deltas:{ friendships:1.0, gpa:-0.2, happiness:1.0 } },
  { icon:'📝', title:'THE PSAT',
    desc:"First standardized test. It's humbling.",
    deltas:{ intelligence:0.5, happiness:-1.0 } },
  { icon:'🏋', title:'FITNESS JOURNEY',
    desc:'You start hitting the gym. Something changes.',
    deltas:{ sports:1.5, happiness:1.0, extracurriculars:-0.5 } }
];

function showSophomoreYear() {
  const overlay = _getYrOverlay();
  const selected = new Set();

  function render() {
    overlay.innerHTML = `
      <div class="ys-inner">
        <div class="ys-badge">MONTA VISTA HIGH · SOPHOMORE YEAR</div>
        <div class="ys-title">CHOOSE YOUR PATHS</div>
        <div class="ys-subtitle">Pick <strong>2</strong> — they define the year.</div>
        <div class="ys-grid">
          ${SOPH_PATHS.map(p=>`
            <div class="ys-card${selected.has(p.id)?' selected':''}" data-id="${p.id}">
              <div class="ys-card-icon">${p.icon}</div>
              <div class="ys-card-title">${p.title}</div>
              <div class="ys-card-desc">${p.desc}</div>
              <div class="ys-chips">${statChips(p.deltas)}</div>
            </div>`).join('')}
        </div>
        <button class="btn-primary ys-confirm" id="ys-confirm" ${selected.size<2?'disabled':''}>
          LOCK IN ${selected.size}/2 →
        </button>
      </div>`;
    overlay.querySelectorAll('.ys-card').forEach(card=>{
      card.addEventListener('click',()=>{
        const id=card.dataset.id;
        if(selected.has(id)) selected.delete(id);
        else if(selected.size<2) selected.add(id);
        render();
      });
    });
    const btn=document.getElementById('ys-confirm');
    if(btn && selected.size===2) btn.addEventListener('click',()=>{
      SOPH_PATHS.filter(p=>selected.has(p.id)).forEach(p=>applyDeltas(p.deltas));
      showPathOutcomes();
    },{once:true});
  }

  function showPathOutcomes() {
    const chosen=SOPH_PATHS.filter(p=>selected.has(p.id));
    overlay.innerHTML=`
      <div class="ys-inner">
        <div class="ys-badge">SOPHOMORE YEAR · YOUR PATHS</div>
        <div class="ys-title" style="font-size:2rem">THE YEAR UNFOLDS</div>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:24px;width:100%;max-width:580px">
          ${chosen.map(p=>`
            <div class="ys-outcome-card">
              <span class="ys-card-icon" style="font-size:2rem">${p.icon}</span>
              <div>
                <div class="ys-card-title" style="font-size:0.9rem">${p.title}</div>
                <div class="ys-card-desc" style="color:rgba(220,210,190,.85)">${p.outcome}</div>
              </div>
            </div>`).join('')}
        </div>
        <button class="btn-primary ys-confirm" id="ys-next" style="margin-top:32px">CONTINUE →</button>
      </div>`;
    document.getElementById('ys-next').addEventListener('click',()=>{
      const ec = window.MYTH_CLUB_CHOICE;
      const overlay2 = _getYrOverlay();
      // If player has an EC, navigate to it first; then go to events
      if (ec && ec !== 'none' && (ec === 'robotics' || ec === 'football')) {
        overlay2.style.display = 'none';
        _goToClass(ec, 1, () => _sophEvent(0));
        if (window.MYTH_SHOW_NOTIF) window.MYTH_SHOW_NOTIF(
          ec === 'robotics' ? 'Head to Room 108 — Robotics Lab (near Bio Room, west campus). EC starts soon!'
                            : 'Head to the Football Field (north end of campus). Practice starts soon!');
      } else {
        _sophEvent(0);
      }
    },{once:true});
  }

  render();
}

function _sophEvent(idx) {
  if(idx>=SOPH_EVENTS.length){ showSophomoreYearEnd(); return; }
  const ev=SOPH_EVENTS[idx], overlay=_getYrOverlay();
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">SOPHOMORE YEAR · SCHOOL EVENT</div>
      <div class="ys-event-icon">${ev.icon}</div>
      <div class="ys-title" style="font-size:2.2rem">${ev.title}</div>
      <p class="ys-card-desc" style="max-width:460px;font-size:1rem;line-height:1.7;margin-top:8px">${ev.desc}</p>
      <div class="ys-chips" style="margin-top:16px;justify-content:center">${statChips(ev.deltas)}</div>
      <button class="btn-primary ys-confirm" id="ys-ev-next" style="margin-top:28px">CONTINUE →</button>
    </div>`;
  applyDeltas(ev.deltas);
  document.getElementById('ys-ev-next').addEventListener('click',()=>_sophEvent(idx+1),{once:true});
}

function showSophomoreYearEnd() {
  const overlay=_getYrOverlay(), now=_currentStats();
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">MONTA VISTA HIGH · CUPERTINO, CA</div>
      <div class="ys-year-label">SOPHOMORE YEAR</div>
      <div class="yr-complete">COMPLETE</div>
      <div class="yr-divider"></div>
      <div class="ys-stats-grid">${_statsGrid(now)}</div>
      <div class="yr-divider" style="margin-top:24px"></div>
      <div class="ys-next-label">JUNIOR YEAR BEGINS</div>
      <p class="ys-card-desc" style="margin-top:8px">Stakes are real now. This year follows you to college apps.</p>
      <button class="btn-primary ys-confirm" id="ys-jr-btn" style="margin-top:20px">CONTINUE TO JUNIOR YEAR →</button>
    </div>`;
  document.getElementById('ys-jr-btn').addEventListener('click',()=>{
    G.to(overlay,{opacity:0,duration:0.5,onComplete:()=>{
      overlay.style.display='none'; overlay.style.opacity='';
      if(typeof refreshStatsSidebar==='function') refreshStatsSidebar();
      showJuniorYear();
    }});
  },{once:true});
}

// ════════════════════════════════════════════════════════
//  JUNIOR YEAR
// ════════════════════════════════════════════════════════

const JR_PATHS = [
  { id:'calc_bc',     icon:'∫',  title:'CALC BC — THE CONLIN GRIND',
    desc:'Mr. Conlin is a legend and a nightmare. All-nighters. Two AP exams worth of material in one year.',
    deltas:{ gpa:-0.3, intelligence:2.5, extracurriculars:2.0, happiness:-1.5 } },
  { id:'dual_enroll', icon:'🎓', title:'DUAL ENROLLMENT @ DE ANZA',
    desc:'Real college courses. Real professor. Real FOMO because you have homework on Friday night.',
    deltas:{ gpa:0.4, intelligence:1.2, extracurriculars:1.0 } },
  { id:'apush',       icon:'🇺🇸', title:'APUSH — MR. THOMAS',
    desc:'Documents, DBQs, essays. Thomas says the AP exam is the real final. He means it.',
    deltas:{ gpa:0.2, friendships:-1.5, intelligence:1.5, happiness:-1.0 } }
];

const JR_LIFE = [
  { id:'socialite', icon:'🚗', title:'THE SOCIALITE',
    desc:"Driver's license. First real party. Prom. This is your year socially.",
    deltas:{ gpa:-0.4, friendships:3.0, relationships:3.0, happiness:2.5 } },
  { id:'athlete',   icon:'🏈', title:'TRIPLE-THREAT ATHLETE',
    desc:'Football · Baseball · Golf. One season at a time. Campus icon status.',
    deltas:{ gpa:-0.6, friendships:3.5, sports:4.0, intelligence:-1.0 } },
  { id:'body',      icon:'💪', title:'BODY TRANSFORMATION',
    desc:'Push/Pull/Legs. Track macros. Come back after winter break and nobody recognizes you.',
    deltas:{ sports:3.0, happiness:2.5, relationships:1.0, extracurriculars:-1.0 } }
];

function showJuniorYear() {
  const overlay = _getYrOverlay();
  const selected = new Set();
  function render() {
    overlay.innerHTML = `
      <div class="ys-inner">
        <div class="ys-badge">MONTA VISTA HIGH · JUNIOR YEAR</div>
        <div class="ys-title">CHOOSE YOUR COURSES</div>
        <div class="ys-subtitle">Pick <strong>2 courses</strong> — these hit your transcript.</div>
        <div class="ys-grid">
          ${JR_PATHS.map(p => `
            <div class="ys-card${selected.has(p.id) ? ' selected' : ''}" data-id="${p.id}">
              <div class="ys-card-icon">${p.icon}</div>
              <div class="ys-card-title">${p.title}</div>
              <div class="ys-card-desc">${p.desc}</div>
              <div class="ys-chips">${statChips(p.deltas)}</div>
            </div>`).join('')}
        </div>
        <button class="btn-primary ys-confirm" id="ys-confirm" ${selected.size < 2 ? 'disabled' : ''}>
          LOCK IN ${selected.size}/2 →
        </button>
      </div>`;
    overlay.querySelectorAll('.ys-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (selected.has(id)) selected.delete(id);
        else if (selected.size < 2) selected.add(id);
        render();
      });
    });
    const btn = document.getElementById('ys-confirm');
    if (btn && selected.size === 2) btn.addEventListener('click', () => {
      const [c1, c2] = [...selected];
      window._JR_C1 = c1; window._JR_C2 = c2;
      JR_PATHS.filter(p => selected.has(p.id)).forEach(p => applyDeltas(p.deltas));
      showJuniorLifeEvent(c1, c2);
    }, { once: true });
  }
  render();
}

function showJuniorLifeEvent(c1, c2) {
  const overlay = _getYrOverlay();
  let chosen = null;
  function render() {
    overlay.innerHTML = `
      <div class="ys-inner">
        <div class="ys-badge">JUNIOR YEAR · MAJOR LIFE FOCUS</div>
        <div class="ys-title">YOUR DEFINING YEAR</div>
        <div class="ys-subtitle">Choose <strong>1</strong> — this shapes who you become outside the classroom.</div>
        <div class="ys-grid">
          ${JR_LIFE.map(p => `
            <div class="ys-card${chosen === p.id ? ' selected' : ''}" data-id="${p.id}">
              <div class="ys-card-icon">${p.icon}</div>
              <div class="ys-card-title">${p.title}</div>
              <div class="ys-card-desc">${p.desc}</div>
              <div class="ys-chips">${statChips(p.deltas)}</div>
            </div>`).join('')}
        </div>
        <button class="btn-primary ys-confirm" id="ys-confirm" ${!chosen ? 'disabled' : ''}>THIS IS ME →</button>
      </div>`;
    overlay.querySelectorAll('.ys-card').forEach(card => {
      card.addEventListener('click', () => { chosen = card.dataset.id; render(); });
    });
    const btn = document.getElementById('ys-confirm');
    if (btn && chosen) btn.addEventListener('click', () => {
      applyDeltas(JR_LIFE.find(p => p.id === chosen).deltas);
      window._JR_LIFE = chosen;
      G.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => {
        overlay.style.display = 'none'; overlay.style.opacity = '';
        window.MYTH_START_STATS = Object.assign({}, Engine.getState().stats);
        if (typeof refreshStatsSidebar === 'function') refreshStatsSidebar();
        _jrStep(0, c1, c2);
      }});
    }, { once: true });
  }
  render();
}

// ── Junior Year State Machine ─────────────────────────
// c1-class1 → life-1 → c2-class1 → SAT → c1-class2 → life-2 → college-search → c2-class2 → life-3 → end
function _jrStep(idx, c1, c2) {
  c1 = c1 || window._JR_C1; c2 = c2 || window._JR_C2;
  window._JR_C1 = c1; window._JR_C2 = c2;
  const next = () => _jrStep(idx + 1, c1, c2);
  switch (idx) {
    case 0: _goToClass(c1, 1, next); break;
    case 1: _jrLifeScene(1, next); break;
    case 2: _goToClass(c2, 1, next); break;
    case 3: _jrSATScene(next); break;
    case 4: _goToClass(c1, 2, next); break;
    case 5: _jrLifeScene(2, next); break;
    case 6: _jrCollegeSearch(next); break;
    case 7: _goToClass(c2, 2, next); break;
    case 8: _jrLifeScene(3, next); break;
    default: if (window.showJuniorYearEnd) window.showJuniorYearEnd(); break;
  }
}

// Called by non-nav junior scenes (life events, SAT, college search)
function _jrSceneDone(...flags) {
  flags.forEach(f => Engine.setFlag(f));
  window.MYTH_ORIENTATION_ACTIVE = false;
  const done = window._JR_SCENE_DONE;
  window._JR_SCENE_DONE = null;
  _sophHide(() => { if (done) done(); });
}

// Dispatch life scenes to the right path
function _jrLifeScene(sceneIdx, done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  window._JR_SCENE_DONE = done;
  const path = window._JR_LIFE;
  if (path === 'socialite') {
    if (sceneIdx === 1) _jrSoc_driversTest();
    else if (sceneIdx === 2) _jrSoc_party();
    else _jrSoc_prom();
  } else if (path === 'athlete') {
    if (sceneIdx === 1) _jrAth_football();
    else if (sceneIdx === 2) _jrAth_baseball();
    else _jrAth_golf();
  } else {
    if (sceneIdx === 1) _jrBody_split();
    else if (sceneIdx === 2) _jrBody_diet();
    else _jrBody_progress();
  }
}

// ════════════════════════════════════════════════════════
//  JUNIOR CLASS — CALC BC
// ════════════════════════════════════════════════════════
let _calcScore = 0;
window.showCalcBC_Class1 = function() { Engine.setFlag('jr_calcbc1_started'); _calcScore = 0; _calcbc1_beat1(); };
function _calcbc1_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · MR. CONLIN</div>
    <h1 class="soph-title" style="font-size:1.9rem">CHAIN RULE THURSDAY.</h1>
    <div class="soph-scene"><p>Conlin writes d/dx[sin(e^(x²))] on the board without saying a word. He turns around. He's looking for someone. He finds you.</p></div>
    <div class="soph-speaker">MR. CONLIN</div><div class="soph-speech">"You. Board. Now."</div>
    <div class="soph-prompt">HOW DO YOU APPROACH IT?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Work through it: cos(e^(x²)) · e^(x²) · 2x — chain rule outside in</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Power rule — multiply the exponents somehow</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Ask Conlin to repeat — you want to see all the steps first</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc1_beat2(); }; });
}
function _calcbc1_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · MR. CONLIN</div>
    <div class="soph-scene"><p>Conlin throws a bonus problem on the board: <strong>∫sec²(x)tan(x) dx</strong>. First person to solve it gets exempted from next week's quiz.</p></div>
    <div class="soph-prompt">YOUR APPROACH?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">u-substitution: u = tan(x), du = sec²(x)dx — clean and fast</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Integration by parts — you know it works, just slower</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Skip it — not in the chapter, probably not on the exam</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc1_beat3(); }; });
}
function _calcbc1_beat3() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · MR. CONLIN</div>
    <div class="soph-scene"><p>40-problem set. 30 minutes. Conlin says "collaboration encouraged." Everyone scrambles to partner up.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Work alone — you get into a zone and don't look up</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Partner with Marcus — solid at calc, good to check work</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Copy from the person next to you when you get stuck</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc1_result(); }; });
}
function _calcbc1_result() {
  let grade, gpaD, stressD, col, conlinLine;
  if (_calcScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    conlinLine='"You actually know what you\'re doing. Don\'t get comfortable."';
  } else if (_calcScore >= 6) {
    grade='B'; gpaD=1; stressD=0; col='#a8d8a0';
    conlinLine='"Solid. Not impressive. Solid."';
  } else if (_calcScore >= 4) {
    grade='C'; gpaD=-1; stressD=2; col='#f7b731';
    conlinLine='"You\'re lost. Come to tutoring or this will compound fast."';
  } else {
    grade='D'; gpaD=-2; stressD=3; col='#fc7b54';
    conlinLine='"I genuinely don\'t know what happened in that head of yours today."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_calcScore}/9</div>
    <div class="soph-speaker">MR. CONLIN</div><div class="soph-speech">${conlinLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +1 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_calcbc1_done');
}

window.showCalcBC_Class2 = function() { Engine.setFlag('jr_calcbc2_started'); _calcScore = 0; _calcbc2_beat1(); };
function _calcbc2_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · AP FREE RESPONSE</div>
    <h1 class="soph-title" style="font-size:1.9rem">FREE RESPONSE FRIDAY.</h1>
    <div class="soph-scene"><p>Conlin hands out a full AP free response simulation. 45 minutes. <em>"This is your final practice. Treat it like the exam."</em></p></div>
    <div class="soph-prompt">WHERE DO YOU START?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Part A — build momentum, show all work clearly</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Part B first — get the hard calculator section out of the way</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Skip around — do the ones you recognize first</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc2_beat2(); }; });
}
function _calcbc2_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · AP FREE RESPONSE</div>
    <div class="soph-scene"><p>You hit it: <strong>∫arctan(x) dx</strong>. You remember seeing this once. Barely.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Integration by parts: u=arctan(x), dv=dx — work it out carefully</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Best guess from memory: x·arctan(x) − ½ln(1+x²) + C</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Skip it and move on — time management over one problem</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc2_beat3(); }; });
}
function _calcbc2_beat3() {
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · AP FREE RESPONSE</div>
    <div class="soph-scene"><p>Five minutes left. Two problems still untouched. Your hand is cramping.</p></div>
    <div class="soph-prompt">FINAL FIVE MINUTES:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Partial credit run — write setup equations and label everything</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Go back and verify your completed work — lock in clean points</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Rush through both — sloppy but you tried</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _calcScore += parseInt(b.dataset.pts); _calcbc2_result(); }; });
}
function _calcbc2_result() {
  let grade, gpaD, stressD, col, conlinLine;
  if (_calcScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    conlinLine='"That\'s a 5 on the AP. Maybe. Don\'t tell anyone I said that."';
  } else if (_calcScore >= 6) {
    grade='B'; gpaD=1; stressD=0; col='#a8d8a0';
    conlinLine='"Passing. You\'re passing. In Calc BC that means something."';
  } else if (_calcScore >= 4) {
    grade='C'; gpaD=-1; stressD=2; col='#f7b731';
    conlinLine='"Study the fundamentals again. Seriously. Start over if you have to."';
  } else {
    grade='D/F'; gpaD=-3; stressD=3; col='#fc7b54';
    conlinLine='"I don\'t know how to help you if you won\'t help yourself."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 2 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 304 — CALC BC · FINAL RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_calcScore}/9</div>
    <div class="soph-speaker">MR. CONLIN</div><div class="soph-speech">${conlinLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +2 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_calcbc2_done');
}

// ════════════════════════════════════════════════════════
//  JUNIOR CLASS — APUSH
// ════════════════════════════════════════════════════════
let _apushScore = 0;
window.showAPUSH_Class1 = function() { Engine.setFlag('jr_apush1_started'); _apushScore = 0; _apush1_beat1(); };
function _apush1_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · MR. THOMAS</div>
    <h1 class="soph-title" style="font-size:1.9rem">THE DBQ.</h1>
    <div class="soph-scene"><p>Thomas drops 7 primary source documents on your desk. The prompt: <em>"Evaluate the extent to which Reconstruction changed American society from 1865–1877."</em> You have 15 minutes to read. Then you write for 45.</p></div>
    <div class="soph-prompt">HOW DO YOU APPROACH THE DOCUMENTS?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Read all 7 carefully — annotate source, purpose, and point of view for each</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Skim 5, read 2 fully — try to catch the main arguments</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Read the last paragraph of each — thesis and conclusion</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush1_beat2(); }; });
}
function _apush1_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · MR. THOMAS</div>
    <div class="soph-scene"><p>Time to write your thesis. Thomas says a strong thesis earns points even if the body paragraphs struggle.</p></div>
    <div class="soph-prompt">YOUR THESIS APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Complex argument addressing multiple causes with qualifications and counterarguments</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Simple, clear claim — easy to defend consistently throughout</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Broad overview of the period — technically accurate, says nothing specific</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush1_beat3(); }; });
}
function _apush1_beat3() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · MR. THOMAS</div>
    <div class="soph-scene"><p>8 minutes left. One body paragraph still unwritten. You're behind.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Strong topic sentence + cite 2 docs with analysis — partial but clean</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Write as fast as you can — quantity over quality</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Go back and clean up the paragraphs you already wrote</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush1_result(); }; });
}
function _apush1_result() {
  let grade, gpaD, stressD, col, riveraLine;
  if (_apushScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    riveraLine='"Strong thesis. Strong sourcing. This is how the DBQ is supposed to look."';
  } else if (_apushScore >= 6) {
    grade='B+'; gpaD=2; stressD=0; col='#a8d8a0';
    riveraLine='"Good argument. Your analysis could go deeper. Work on that."';
  } else if (_apushScore >= 4) {
    grade='C'; gpaD=-1; stressD=2; col='#f7b731';
    riveraLine='"The documents were there. You didn\'t use them. Why were they there?"';
  } else {
    grade='D'; gpaD=-2; stressD=3; col='#fc7b54';
    riveraLine='"You need to come in before school. This needs serious work before the AP."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · DBQ RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_apushScore}/9</div>
    <div class="soph-speaker">MR. THOMAS</div><div class="soph-speech">${riveraLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +1 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_apush1_done');
}

window.showAPUSH_Class2 = function() { Engine.setFlag('jr_apush2_started'); _apushScore = 0; _apush2_beat1(); };
function _apush2_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · GROUP LEQ PROJECT</div>
    <h1 class="soph-title" style="font-size:1.9rem">THE GROUP LEQ.</h1>
    <div class="soph-scene"><p>Thomas assigns groups of 4 for the Long Essay Question project. You get Jordan, Marcus, and a kid named Derek who doesn't speak in class. Thomas says this counts for 20% of your grade.</p></div>
    <div class="soph-prompt">YOUR ROLE IN THE GROUP:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Take the lead — you map out the argument structure and assign sections</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Handle the primary sources — you know how to find strong evidence</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Let someone else lead — you'll contribute when asked</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush2_beat2(); }; });
}
function _apush2_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · GROUP LEQ PROJECT</div>
    <div class="soph-scene"><p>Jordan finds a Frederick Douglass speech that perfectly supports your thesis. Marcus says it might be too controversial for Thomas. You decide:</p></div>
    <div class="soph-prompt">USE THE CONTROVERSIAL SOURCE?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Use it — analyze it fully and address the counterargument directly</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">No — find something safer that Thomas will definitely accept</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Include it as a footnote — hedge your bets</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush2_beat3(); }; });
}
function _apush2_beat3() {
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · PRESENTATION DAY</div>
    <div class="soph-scene"><p>Your group presents to the class. It's your section: historical context. 4 minutes in front of everyone.</p></div>
    <div class="soph-prompt">YOUR DELIVERY:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">You practiced it cold — deliver from memory, make eye contact</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Read from your notes — not great, but accurate</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Wing it — you know this period, you'll figure it out up there</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _apushScore += parseInt(b.dataset.pts); _apush2_result(); }; });
}
function _apush2_result() {
  let grade, gpaD, stressD, col, riveraLine;
  if (_apushScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    riveraLine='"Best group presentation this period. The sourcing was exceptional."';
  } else if (_apushScore >= 6) {
    grade='B'; gpaD=2; stressD=0; col='#a8d8a0';
    riveraLine='"Strong. Presentation could be more confident, but the writing was there."';
  } else if (_apushScore >= 4) {
    grade='C+'; gpaD=-1; stressD=2; col='#f7b731';
    riveraLine='"You had the pieces. The argument never fully came together. Try again on the AP."';
  } else {
    grade='D'; gpaD=-2; stressD=3; col='#fc7b54';
    riveraLine='"I expected more. Significantly more."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 1, friendships: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 201 — APUSH · GROUP LEQ RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_apushScore}/9</div>
    <div class="soph-speaker">MR. THOMAS</div><div class="soph-speech">${riveraLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +1 INT · +1 Friends</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_apush2_done');
}

// ════════════════════════════════════════════════════════
//  JUNIOR CLASS — DUAL ENROLLMENT
// ════════════════════════════════════════════════════════
let _deScore = 0;
window.showDualEnroll_Class1 = function() { Engine.setFlag('jr_de1_started'); _deScore = 0; _de1_beat1(); };
function _de1_beat1() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · ENGLISH 1A · PROF. KIM</div>
    <h1 class="soph-title" style="font-size:1.9rem">THE ARGUMENTATIVE ESSAY.</h1>
    <div class="soph-scene"><p>Prof. Kim is not a high school teacher. She doesn't remind you twice. <em>"Five pages. Argumentative. Cited sources. Due in three weeks. Good luck."</em></p></div>
    <div class="soph-prompt">YOUR TOPIC:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">School choice and education equity — complex argument, rich in available research</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Social media and teen mental health — accessible, comfortable territory</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Why homework should be eliminated — low effort ceiling at college level</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de1_beat2(); }; });
}
function _de1_beat2() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · ENGLISH 1A · RESEARCH PHASE</div>
    <div class="soph-scene"><p>Prof. Kim says Wikipedia is not a source. "It's a starting point at best." The library database login is on the board.</p></div>
    <div class="soph-prompt">YOUR RESEARCH METHOD:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">JSTOR + peer-reviewed articles — proper academic sourcing from the start</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Google Scholar + credible news sources — solid but not fully academic</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Personal experience and one article from The Atlantic</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de1_beat3(); }; });
}
function _de1_beat3() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · ENGLISH 1A · REVISION</div>
    <div class="soph-scene"><p>Prof. Kim offers one round of feedback before the deadline. Most students skip it.</p></div>
    <div class="soph-prompt">YOUR REVISION APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Submit draft a week early — incorporate her feedback, revise twice</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Proofread carefully the night before and submit on time</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Submit as-is — you ran out of time</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de1_result(); }; });
}
function _de1_result() {
  let grade, gpaD, stressD, col, kimLine;
  if (_deScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    kimLine='"This is college-level work. I mean that."';
  } else if (_deScore >= 6) {
    grade='B+'; gpaD=2; stressD=0; col='#a8d8a0';
    kimLine='"Good argument. Sources could be stronger. You know what to fix."';
  } else if (_deScore >= 4) {
    grade='C'; gpaD=-1; stressD=2; col='#f7b731';
    kimLine='"The argument is there, but it\'s buried under weak sourcing."';
  } else {
    grade='D'; gpaD=-2; stressD=3; col='#fc7b54';
    kimLine='"This reads like a high school paper. We are at a college. Retry."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">DE ANZA — ENGLISH 1A · RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_deScore}/9</div>
    <div class="soph-speaker">PROF. KIM</div><div class="soph-speech">${kimLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +1 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_de1_done');
}

window.showDualEnroll_Class2 = function() { Engine.setFlag('jr_de2_started'); _deScore = 0; _de2_beat1(); };
function _de2_beat1() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · PSYCHOLOGY 1 · PROF. KIM</div>
    <h1 class="soph-title" style="font-size:1.9rem">THE RESEARCH PAPER.</h1>
    <div class="soph-scene"><p>Prof. Kim's Psychology 1 final: a 7-page research paper on a psychological phenomenon. "Your topic, your methodology, your argument. Don't ask me what to write about."</p></div>
    <div class="soph-prompt">YOUR RESEARCH TOPIC:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Implicit bias in academic evaluation — ambitious, rich peer-reviewed literature</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">The Bystander Effect — well-documented, clean sources, safe argument</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Dream interpretation — personal examples, very sparse academic research</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de2_beat2(); }; });
}
function _de2_beat2() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · PSYCHOLOGY 1 · METHODOLOGY</div>
    <div class="soph-scene"><p>Prof. Kim says methodology is 30% of the grade. "How you study something matters as much as what you found."</p></div>
    <div class="soph-prompt">YOUR METHODOLOGY:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Literature review and meta-analysis of existing published studies</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Interview De Anza's psychology faculty — a real primary source</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Survey your 15 classmates — small sample, but real data you collected</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de2_beat3(); }; });
}
function _de2_beat3() {
  _sophShow(`<div class="soph-badge">SCIENCE E — DE ANZA · PSYCHOLOGY 1 · SUBMISSION</div>
    <div class="soph-scene"><p>Due date: Sunday 11:59 PM. It's Sunday afternoon.</p></div>
    <div class="soph-prompt">HOW DO YOU SUBMIT?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Double-check every APA citation, proofread twice, submit at 6 PM</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Hit submit on time, citations are correct, you checked once</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Submit at 12:07 AM — 10% late penalty per Kim's syllabus</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _deScore += parseInt(b.dataset.pts); _de2_result(); }; });
}
function _de2_result() {
  let grade, gpaD, stressD, col, kimLine;
  if (_deScore >= 8) {
    grade='A'; gpaD=3; stressD=-1; col='#6bcb77';
    kimLine='"This is publishable at a community college level. Genuinely."';
  } else if (_deScore >= 6) {
    grade='B'; gpaD=2; stressD=0; col='#a8d8a0';
    kimLine='"Strong work. The methodology section was particularly good."';
  } else if (_deScore >= 4) {
    grade='C+'; gpaD=-1; stressD=2; col='#f7b731';
    kimLine='"You have the ideas. The execution wasn\'t there this time."';
  } else {
    grade='D'; gpaD=-2; stressD=3; col='#fc7b54';
    kimLine='"I\'m not sure what happened here. Come see me during office hours."';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, intelligence: 2 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">DE ANZA — PSYCHOLOGY 1 · RESULT</div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:12px 0;color:${col};font-weight:bold">GRADE: ${grade} &nbsp;·&nbsp; Score ${_deScore}/9</div>
    <div class="soph-speaker">PROF. KIM</div><div class="soph-speech">${kimLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +2 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('jr_de2_done');
}

// ════════════════════════════════════════════════════════
//  JUNIOR SAT SCENE
// ════════════════════════════════════════════════════════
let _satScore = 0;
function _jrSATScene(done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  window._JR_SCENE_DONE = done;
  _satScore = 0;
  _sat_beat1();
}
function _sat_beat1() {
  _sophShow(`<div class="soph-badge">CUPERTINO HIGH SCHOOL — TESTING CENTER</div>
    <h1 class="soph-title">THE SAT.</h1>
    <div class="soph-scene"><p>6:45 AM. You're holding your admission ticket and two #2 pencils. Around you: 200 other kids who look equally miserable. The proctor says <em>"You may begin."</em></p></div>
    <div class="soph-prompt">HOW DID YOU PREPARE THE LAST 48 HOURS?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Full practice tests + targeted review of your weak areas</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Key formulas and strategy tips — focused prep</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Nothing special — you'll figure it out in there</span></button>
    </div><div class="soph-nav"><span class="soph-progress">SAT · Section 1 of 4</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _satScore += parseInt(b.dataset.pts); _sat_beat2(); }; });
}
function _sat_beat2() {
  _sophShow(`<div class="soph-badge">SAT — READING SECTION · 52 QUESTIONS · 65 MIN</div>
    <div class="soph-scene"><p>The first passage is an 1840s letter from a senator about land policy. Dense. Slow. You have 5 minutes left and you're on question 47 of 52.</p></div>
    <div class="soph-prompt">HOW DO YOU HANDLE THE DENSE PASSAGE?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Focus on the main idea per paragraph — answer in order, stay methodical</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Skim each answer choice and aggressively eliminate wrong ones</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Answer the specific detail questions and skip the analysis ones</span></button>
    </div><div class="soph-nav"><span class="soph-progress">SAT · Section 2 of 4</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _satScore += parseInt(b.dataset.pts); _sat_beat3(); }; });
}
function _sat_beat3() {
  _sophShow(`<div class="soph-badge">SAT — MATH NO CALCULATOR · 20 QUESTIONS · 25 MIN</div>
    <div class="soph-scene"><p>Problem 17: a system of equations you haven't seen this exact setup of. Your brain stalls. You have 6 minutes left for 4 problems.</p></div>
    <div class="soph-prompt">YOUR APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Set up the equations and trust the algebra — work through it</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Back-solve: plug in the answer choices one by one</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Flag it, move on, come back if time allows</span></button>
    </div><div class="soph-nav"><span class="soph-progress">SAT · Section 3 of 4</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _satScore += parseInt(b.dataset.pts); _sat_beat4(); }; });
}
function _sat_beat4() {
  _sophShow(`<div class="soph-badge">SAT — MATH CALCULATOR · 38 QUESTIONS · 55 MIN</div>
    <div class="soph-scene"><p>15 minutes left. 8 questions remaining. You can do this — or you can spiral. The kid next to you is already turning in their test.</p></div>
    <div class="soph-prompt">FINAL STRETCH:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Mark your gut instinct, move through systematically — no second-guessing</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Focus only on the ones you're confident about — lock in clean points</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Rush through everything — probably get some right by volume</span></button>
    </div><div class="soph-nav"><span class="soph-progress">SAT · Section 4 of 4</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _satScore += parseInt(b.dataset.pts); _sat_result(); }; });
}
function _sat_result() {
  let scoreRange, intD, stressD, gpaD, col, narr;
  if (_satScore >= 11) {
    scoreRange='1550–1600'; intD=4; stressD=-2; gpaD=1; col='#6bcb77';
    narr='The scores come back three weeks later. You stare at the number. Your mom stares at it longer. National Merit consideration. You screenshot it.';
  } else if (_satScore >= 8) {
    scoreRange='1450–1549'; intD=3; stressD=-1; gpaD=0; col='#a8d8a0';
    narr='Strong score. Really strong. Every UC and most private schools consider this competitive. You feel good about it for exactly one day before you start thinking about retaking.';
  } else if (_satScore >= 5) {
    scoreRange='1350–1449'; intD=2; stressD=1; gpaD=0; col='#f7b731';
    narr='Solid score. You\'re in range for a lot of schools. But you know it could be better. A retake might be worth it.';
  } else {
    scoreRange='<1350'; intD=1; stressD=3; gpaD=-1; col='#fc7b54';
    narr='Below where you wanted. The test felt off from the start. A retake is probably the move. Your counselor is going to bring it up.';
  }
  Engine.modifyStats({ intelligence: intD, stress: stressD, gpa: gpaD }); _flushStatToast();
  _sophShow(`<div class="soph-badge">SAT — RESULTS</div>
    <h1 class="soph-title" style="color:${col};font-size:2.2rem">${scoreRange}</h1>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">+${intD} INT · Stress ${stressD>=0?'+':''}${stressD}${gpaD!==0?' · GPA '+(gpaD>0?'+':'')+gpaD:''}</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _jrSceneDone('jr_sat_done');
}

// ════════════════════════════════════════════════════════
//  JUNIOR COLLEGE SEARCH SCENE
// ════════════════════════════════════════════════════════
function _jrCollegeSearch(done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  window._JR_SCENE_DONE = done;
  _college_beat1();
}
function _college_beat1() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — COLLEGE COUNSELING</div>
    <h1 class="soph-title" style="font-size:1.9rem">COLLEGE SEARCH.</h1>
    <div class="soph-scene"><p>October of junior year. Every teacher suddenly brings up college. Your parents ask about it at dinner. Naviance and Fiske Guide are open on every tab. Your counselor, Mr. Okonkwo, sits down across from you.</p></div>
    <div class="soph-speaker">MR. OKONKWO</div><div class="soph-speech">"Let's build your list. You need reaches, matches, and safeties. No all-reaches. No all-safeties. Where do you want to go?"</div>
    <div class="soph-prompt">HOW DO YOU BUILD YOUR LIST?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Mix of reaches (Stanford/MIT), matches (UCSD/Davis), and safeties (SJSU/CSULB) — balanced</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">All reaches — you're swinging for the top, nothing else matters</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">Mostly safeties — play it safe, no stress, guaranteed acceptance</span></button>
    </div><div class="soph-nav"><span class="soph-progress">College Search · Phase 1 of 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { window._collegeScore = (window._collegeScore||0) + parseInt(b.dataset.pts); _college_beat2(); }; });
}
function _college_beat2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — COLLEGE SEARCH · CAMPUS VISIT</div>
    <div class="soph-scene"><p>You have one free Saturday. Okonkwo says campus visits matter — you need to actually feel the place before you commit four years of your life to it.</p></div>
    <div class="soph-prompt">WHERE DO YOU GO?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Road trip to UCSD — you've never been to San Diego, you need to see if it clicks</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Visit UC Berkeley — 45 minutes away and it should feel like home by now</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Skip it — you can get the full feel from YouTube tours and Reddit</span></button>
    </div><div class="soph-nav"><span class="soph-progress">College Search · Phase 2 of 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { window._collegeScore = (window._collegeScore||0) + parseInt(b.dataset.pts); _college_beat3(); }; });
}
function _college_beat3() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — COLLEGE COUNSELING · COMMON APP ESSAY</div>
    <div class="soph-scene"><p>The Common App essay. 650 words. Okonkwo says admissions officers read thousands of these. <em>"The ones they remember are honest."</em></p></div>
    <div class="soph-prompt">YOUR ESSAY ANGLE:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">The real story — the one that makes you a little vulnerable but is completely you</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Academic journey and growth — safe, well-structured, respectable</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Start and delete it six times — miss Okonkwo's draft deadline entirely</span></button>
    </div><div class="soph-nav"><span class="soph-progress">College Search · Phase 3 of 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { window._collegeScore = (window._collegeScore||0) + parseInt(b.dataset.pts); _college_result(); }; });
}
function _college_result() {
  const cs = window._collegeScore || 0;
  window._collegeScore = 0;
  let intD, happyD, stressD, narr;
  if (cs >= 8) {
    intD=2; happyD=2; stressD=-1;
    narr='Okonkwo looks over your list and nods. "This is a thoughtful list. You did this right." The essay draft makes him go quiet for a second. "This is good. This is really good."';
  } else if (cs >= 5) {
    intD=1; happyD=1; stressD=1;
    narr='The list is solid. The essay needs another draft, Okonkwo says, but the bones are there. You leave feeling cautiously okay about it.';
  } else {
    intD=0; happyD=-1; stressD=3;
    narr='Okonkwo gives you the look. The serious one. "You have to take this seriously. This is not something you can wing." You leave feeling behind. Because you are.';
  }
  Engine.modifyStats({ intelligence: intD, happiness: happyD, stress: stressD }); _flushStatToast();
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — COLLEGE COUNSELING · OUTCOME</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-scene"><p style="color:#c8bfa8;font-size:13px">Senior year applications open in August. You have a head start — or you don't. Either way, it's coming.</p></div>
    <div class="soph-stat-delta">+${intD} INT · Happiness ${happyD>=0?'+':''}${happyD} · Stress ${stressD>=0?'+':''}${stressD}</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _jrSceneDone('jr_college_done');
}

// ════════════════════════════════════════════════════════
//  LIFE PATH — SOCIALITE
// ════════════════════════════════════════════════════════
let _drivingScore = 0;
function _jrSoc_driversTest() {
  _drivingScore = 0;
  _sophShow(`<div class="soph-badge">CUPERTINO DMV — 8:15 AM</div>
    <h1 class="soph-title">THE DRIVER'S TEST.</h1>
    <div class="soph-scene"><p>The DMV examiner — mid-50s, clipboard, no expression — gets in the passenger seat. Your hands are at 10 and 2. The car smells like anxiety.</p></div>
    <div class="soph-prompt">HOW DID YOU PREPARE LAST NIGHT?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Studied the DMV handbook cover to cover — every sign, every rule</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">Hour of drive practice on local streets with your older sibling</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Nothing — you've been driving fine for months, it'll be fine</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Driver's Test · Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _drivingScore += parseInt(b.dataset.pts); _jrSoc_driving2(); }; });
}
function _jrSoc_driving2() {
  _sophShow(`<div class="soph-badge">CUPERTINO DMV — PARALLEL PARKING</div>
    <div class="soph-scene"><p>The examiner points to a spot between two orange cones. <em>"Parallel park here."</em> The lane is narrow. A small crowd has somehow gathered.</p></div>
    <div class="soph-prompt">YOUR TECHNIQUE:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">Three-point check — slow and methodical — you nail the alignment</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">One shot — close enough to the curb, no adjustment needed (hopefully)</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">Rush it, bump the curb, immediately apologize to the examiner</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Driver's Test · Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _drivingScore += parseInt(b.dataset.pts); _jrSoc_driving3(); }; });
}
function _jrSoc_driving3() {
  _sophShow(`<div class="soph-badge">CUPERTINO DMV — EXAMINER QUESTION</div>
    <div class="soph-scene"><p>As you pull back into the lot, the examiner looks up from his clipboard. <em>"At a 4-way stop where two cars arrive at the same time — who goes first?"</em></p></div>
    <div class="soph-prompt">YOUR ANSWER:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">"First-to-arrive goes. If simultaneous, yield to the car on your right."</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">"I think you yield to the right? I'm pretty sure."</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">"I'm honestly not certain." (said out loud to a DMV examiner)</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Driver's Test · Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _drivingScore += parseInt(b.dataset.pts); _jrSoc_drivingResult(); }; });
}
function _jrSoc_drivingResult() {
  const passed = _drivingScore >= 4;
  const perfect = _drivingScore >= 7;
  if (passed) {
    Engine.modifyStats({ happiness: perfect?3:2, relationships: perfect?2:1, friendships: 1 }); _flushStatToast();
    Engine.setFlag('jr_drivers_license');
    _sophShow(`<div class="soph-badge">CUPERTINO DMV — RESULT</div>
      <h1 class="soph-title" style="color:#6bcb77">YOU PASSED.</h1>
      <div class="soph-scene"><p>${perfect ? 'Examiner: "No deductions. Clean test." He almost smiles. You call your mom before you\'re out of the parking lot.' : 'Examiner: "Passed. Watch the curb next time." You take the paper and leave fast before he changes his mind.'}</p></div>
      <div class="soph-scene"><p>The photo is terrible. You look genuinely shocked. You keep it in your wallet for the rest of junior year.</p></div>
      <div class="soph-stat-delta">Happiness +${perfect?3:2} · Relationships +${perfect?2:1} · +1 Friends</div>
      <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  } else {
    Engine.modifyStats({ happiness: -2, stress: 3 }); _flushStatToast();
    _sophShow(`<div class="soph-badge">CUPERTINO DMV — RESULT</div>
      <h1 class="soph-title" style="color:#fc7b54">YOU FAILED.</h1>
      <div class="soph-scene"><p>The examiner circles three things on his clipboard. He says "not today" with the energy of someone who has said "not today" 11,000 times.</p></div>
      <div class="soph-scene"><p>You schedule a retake two weeks out. You study the handbook properly this time. You pass. The photo is still terrible.</p></div>
      <div class="soph-stat-delta neg">Happiness −2 · Stress +3</div>
      <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  }
  document.getElementById('soph-done').onclick = () => _jrSceneDone('jr_soc_drivers_done');
}

function _jrSoc_party() {
  _sophShow(`<div class="soph-badge">FRIDAY NIGHT — MONTA VISTA · 10:00 PM</div>
    <h1 class="soph-title" style="font-size:1.9rem">FIRST REAL PARTY.</h1>
    <div class="soph-scene"><p>Kai's house. Parents are out of town. Word spread on Friday morning and now there are 40 people in a house meant for six. The music is loud enough to feel it in your chest.</p></div>
    <div class="soph-prompt">HOW DO YOU SHOW UP?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="party-a"><span class="soph-choice-label">With your three closest friends — safety in numbers, you know who you're with</span></button>
      <button class="soph-choice" id="party-b"><span class="soph-choice-label">Solo — you want to actually meet new people tonight</span></button>
      <button class="soph-choice" id="party-c"><span class="soph-choice-label">Fashionably late — you let the crowd warm up first</span></button>
    </div>`);
  document.getElementById('party-a').onclick = () => { Engine.modifyStats({friendships:2,happiness:2}); _flushStatToast(); _jrSoc_party2(); };
  document.getElementById('party-b').onclick = () => { Engine.modifyStats({friendships:3,stress:1}); _flushStatToast(); _jrSoc_party2(); };
  document.getElementById('party-c').onclick = () => { Engine.modifyStats({happiness:1,relationships:1}); _flushStatToast(); _jrSoc_party2(); };
}
function _jrSoc_party2() {
  _sophShow(`<div class="soph-badge">FRIDAY NIGHT — MONTA VISTA · 11:15 PM</div>
    <div class="soph-scene"><p>By 11 PM things are rowdy. Someone knocked over a lamp. Kai looks like he's reconsidering his life choices.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="party2-a"><span class="soph-choice-label">Find your people — lock into your zone, enjoy the vibe on your terms</span></button>
      <button class="soph-choice" id="party2-b"><span class="soph-choice-label">Step outside for air — read the situation and check back in</span></button>
      <button class="soph-choice" id="party2-c"><span class="soph-choice-label">Try to vibe with everyone — you're everywhere tonight</span></button>
    </div>`);
  document.getElementById('party2-a').onclick = () => { Engine.modifyStats({happiness:2,stress:-1}); _flushStatToast(); _jrSoc_party3(); };
  document.getElementById('party2-b').onclick = () => { Engine.modifyStats({stress:-1,selfAwareness:2}); _flushStatToast(); _jrSoc_party3(); };
  document.getElementById('party2-c').onclick = () => { Engine.modifyStats({friendships:3,stress:2}); _flushStatToast(); _jrSoc_party3(); };
}
function _jrSoc_party3() {
  _sophShow(`<div class="soph-badge">FRIDAY NIGHT — 1:30 AM</div>
    <div class="soph-scene"><p>You told your parents 1 AM. It's 1:30. You could stay — the night's still going. Or you could do what you said you'd do.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="party3-a"><span class="soph-choice-label">Leave now — you said 1, and you keep your word</span></button>
      <button class="soph-choice" id="party3-b"><span class="soph-choice-label">Text "on my way" and actually leave 20 minutes later</span></button>
      <button class="soph-choice" id="party3-c"><span class="soph-choice-label">Stay until 2 and deal with whatever comes next</span></button>
    </div>`);
  document.getElementById('party3-a').onclick = () => { Engine.modifyStats({relationships:2,sleep:1}); _flushStatToast(); _jrSceneDone('jr_soc_party_done'); };
  document.getElementById('party3-b').onclick = () => { Engine.modifyStats({happiness:1,relationships:-1}); _flushStatToast(); _jrSceneDone('jr_soc_party_done'); };
  document.getElementById('party3-c').onclick = () => { Engine.modifyStats({happiness:2,sleep:-1,relationships:-2}); _flushStatToast(); _jrSceneDone('jr_soc_party_done'); };
}

function _jrSoc_prom() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — JUNIOR PROM</div>
    <h1 class="soph-title">PROM NIGHT.</h1>
    <div class="soph-scene"><p>The theme is "A Night in Paris." The gym has been transformed in a way that would not fool anyone who has actually been to Paris. But you're here. It counts.</p></div>
    <div class="soph-prompt">WHO ARE YOU GOING WITH?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="prom-a"><span class="soph-choice-label">You asked your crush. They said yes. You've been nervous for two weeks straight.</span></button>
      <button class="soph-choice" id="prom-b"><span class="soph-choice-label">Going with a squad of 6 close friends — no complications, just fun</span></button>
      <button class="soph-choice" id="prom-c"><span class="soph-choice-label">Solo — you'll have a great time on your own terms</span></button>
    </div>`);
  document.getElementById('prom-a').onclick = () => { Engine.modifyStats({happiness:3,stress:1,relationships:3}); _flushStatToast(); _jrSoc_prom2(); };
  document.getElementById('prom-b').onclick = () => { Engine.modifyStats({friendships:3,happiness:2,stress:-1}); _flushStatToast(); _jrSoc_prom2(); };
  document.getElementById('prom-c').onclick = () => { Engine.modifyStats({selfAwareness:2,happiness:2}); _flushStatToast(); _jrSoc_prom2(); };
}
function _jrSoc_prom2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — PROM · ARRIVALS</div>
    <div class="soph-scene"><p>The parking lot is a chaos of rented cars and phone cameras. Everyone's trying to get the photo before it rains. It doesn't rain.</p></div>
    <div class="soph-prompt">HOW DID YOU GET HERE?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="prom2-a"><span class="soph-choice-label">Split a limo with 8 people — honestly cheaper and way more fun</span></button>
      <button class="soph-choice" id="prom2-b"><span class="soph-choice-label">Fancy Uber — just you, clean and simple</span></button>
      <button class="soph-choice" id="prom2-c"><span class="soph-choice-label">Parents drop you off — they insisted on photos and you let them</span></button>
    </div>`);
  document.getElementById('prom2-a').onclick = () => { Engine.modifyStats({happiness:3,friendships:2}); _flushStatToast(); _jrSoc_prom3(); };
  document.getElementById('prom2-b').onclick = () => { Engine.modifyStats({happiness:2}); _flushStatToast(); _jrSoc_prom3(); };
  document.getElementById('prom2-c').onclick = () => { Engine.modifyStats({happiness:1,relationships:2}); _flushStatToast(); _jrSoc_prom3(); };
}
function _jrSoc_prom3() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — PROM · THE NIGHT</div>
    <div class="soph-scene"><p>The lights are low. The DJ is decent. There are four hours of this left and you're exactly where you're supposed to be.</p></div>
    <div class="soph-prompt">HOW DO YOU SPEND IT?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="prom3-a"><span class="soph-choice-label">Center of the dance floor all night — you don't sit down once</span></button>
      <button class="soph-choice" id="prom3-b"><span class="soph-choice-label">Roam the whole venue — photos, long conversations, see everyone</span></button>
      <button class="soph-choice" id="prom3-c"><span class="soph-choice-label">The slow dance under the lights. A few real moments. That's the memory.</span></button>
    </div>`);
  document.getElementById('prom3-a').onclick = () => { Engine.modifyStats({happiness:3,athleticism:1}); _flushStatToast(); _jrSceneDone('jr_soc_prom_done'); };
  document.getElementById('prom3-b').onclick = () => { Engine.modifyStats({friendships:3,happiness:2}); _flushStatToast(); _jrSceneDone('jr_soc_prom_done'); };
  document.getElementById('prom3-c').onclick = () => { Engine.modifyStats({happiness:3,relationships:2,selfAwareness:1}); _flushStatToast(); _jrSceneDone('jr_soc_prom_done'); };
}

// ════════════════════════════════════════════════════════
//  LIFE PATH — TRIPLE-THREAT ATHLETE
// ════════════════════════════════════════════════════════
function _jrAth_football() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — STATE PLAYOFF · 4TH QUARTER</div>
    <h1 class="soph-title" style="font-size:1.9rem">FOOTBALL.</h1>
    <div class="soph-scene"><p>Down by 4. Two minutes left. 3rd and 8. The QB is looking your way. The route opens up perfectly.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO WITH THE BALL?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="fb-a"><span class="soph-choice-label">Catch, set your feet hard, and fight for every yard to the first down</span></button>
      <button class="soph-choice" id="fb-b"><span class="soph-choice-label">Catch and cut — you see a lane and you take it, aiming for the end zone</span></button>
      <button class="soph-choice" id="fb-c"><span class="soph-choice-label">Draw the pass interference — strategically let it go and take the free play</span></button>
    </div>`);
  document.getElementById('fb-a').onclick = () => { Engine.modifyStats({sports:3,athleticism:2}); _flushStatToast(); _jrAth_football2(); };
  document.getElementById('fb-b').onclick = () => { Engine.modifyStats({sports:2,athleticism:3,stress:1}); _flushStatToast(); _jrAth_football2(); };
  document.getElementById('fb-c').onclick = () => { Engine.modifyStats({intelligence:2,sports:1}); _flushStatToast(); _jrAth_football2(); };
}
function _jrAth_football2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — STATE PLAYOFF · FINAL DRIVE</div>
    <div class="soph-scene"><p>Running back breaks through the line. It's just you between him and the end zone. The whole season on the line.</p></div>
    <div class="soph-prompt">THE TACKLE:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="fb2-a"><span class="soph-choice-label">Lower your shoulder — clean, fundamental, hard stop</span></button>
      <button class="soph-choice" id="fb2-b"><span class="soph-choice-label">Go for the strip — risky, but if you pop the ball out it's over</span></button>
      <button class="soph-choice" id="fb2-c"><span class="soph-choice-label">Force him toward the sideline — take the safe angle, don't give up the score</span></button>
    </div>`);
  document.getElementById('fb2-a').onclick = () => { Engine.modifyStats({athleticism:3,sports:2}); _flushStatToast(); _jrSceneDone('jr_ath_football_done'); };
  document.getElementById('fb2-b').onclick = () => { Engine.modifyStats({sports:3,athleticism:1,stress:1}); _flushStatToast(); _jrSceneDone('jr_ath_football_done'); };
  document.getElementById('fb2-c').onclick = () => { Engine.modifyStats({sports:2,athleticism:2,relationships:1}); _flushStatToast(); _jrSceneDone('jr_ath_football_done'); };
}

function _jrAth_baseball() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — CIF SEMIFINAL · BOTTOM 7TH</div>
    <h1 class="soph-title" style="font-size:1.9rem">BASEBALL.</h1>
    <div class="soph-scene"><p>2 outs, runner on 2nd. You're up. The pitcher is dealing — 4 up, 4 down. The third base coach gives you the sign: green light. Your call.</p></div>
    <div class="soph-prompt">AT THE PLATE:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="bb-a"><span class="soph-choice-label">Sit on a fastball — wait for your pitch, swing for contact</span></button>
      <button class="soph-choice" id="bb-b"><span class="soph-choice-label">Work the count — take some pitches, make him come to you</span></button>
      <button class="soph-choice" id="bb-c"><span class="soph-choice-label">First pitch aggression — it's coming in hot and you're ready</span></button>
    </div>`);
  document.getElementById('bb-a').onclick = () => { Engine.modifyStats({sports:2,athleticism:2}); _flushStatToast(); _jrAth_baseball2(); };
  document.getElementById('bb-b').onclick = () => { Engine.modifyStats({sports:2,intelligence:2}); _flushStatToast(); _jrAth_baseball2(); };
  document.getElementById('bb-c').onclick = () => { Engine.modifyStats({sports:3,athleticism:2}); _flushStatToast(); _jrAth_baseball2(); };
}
function _jrAth_baseball2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — CIF SEMIFINAL · 5TH INNING</div>
    <div class="soph-scene"><p>Shallow pop fly into no man's land between you and the shortstop. You're both going full speed. Somebody has to call it.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="bb2-a"><span class="soph-choice-label">"I GOT IT" — you call it loud and commit all the way</span></button>
      <button class="soph-choice" id="bb2-b"><span class="soph-choice-label">Back off — let the shortstop call it, you trust him</span></button>
      <button class="soph-choice" id="bb2-c"><span class="soph-choice-label">Both go for it — whoever gets there first</span></button>
    </div>`);
  document.getElementById('bb2-a').onclick = () => { Engine.modifyStats({sports:2,athleticism:2}); _flushStatToast(); _jrSceneDone('jr_ath_baseball_done'); };
  document.getElementById('bb2-b').onclick = () => { Engine.modifyStats({relationships:2,sports:1}); _flushStatToast(); _jrSceneDone('jr_ath_baseball_done'); };
  document.getElementById('bb2-c').onclick = () => { Engine.modifyStats({athleticism:3,stress:2}); _flushStatToast(); _jrSceneDone('jr_ath_baseball_done'); };
}

function _jrAth_golf() {
  _sophShow(`<div class="soph-badge">PALO ALTO GOLF COURSE — BAY AREA INVITATIONAL</div>
    <h1 class="soph-title" style="font-size:1.9rem">GOLF.</h1>
    <div class="soph-scene"><p>170 yards out. Pin is tucked right, hazard left. Wind is off the bay. This is the shot that decides the round.</p></div>
    <div class="soph-prompt">CLUB SELECTION:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="golf-a"><span class="soph-choice-label">7-iron to the fat part of the green — take the smart angle, two-putt for par</span></button>
      <button class="soph-choice" id="golf-b"><span class="soph-choice-label">6-iron at the pin — you've been hitting this all day, go for it</span></button>
      <button class="soph-choice" id="golf-c"><span class="soph-choice-label">Lay up short of the green — pitch on, eliminate the hazard risk entirely</span></button>
    </div>`);
  document.getElementById('golf-a').onclick = () => { Engine.modifyStats({sports:2,selfAwareness:2}); _flushStatToast(); _jrAth_golf2(); };
  document.getElementById('golf-b').onclick = () => { Engine.modifyStats({sports:3,stress:1}); _flushStatToast(); _jrAth_golf2(); };
  document.getElementById('golf-c').onclick = () => { Engine.modifyStats({sports:1,selfAwareness:3}); _flushStatToast(); _jrAth_golf2(); };
}
function _jrAth_golf2() {
  _sophShow(`<div class="soph-badge">PALO ALTO GOLF COURSE — FINAL HOLE</div>
    <div class="soph-scene"><p>Last hole. You're tied for the lead. Your playing partner looks rattled. You're not rattled. Or you're pretending not to be. Same thing.</p></div>
    <div class="soph-prompt">YOUR APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="golf2-a"><span class="soph-choice-label">Stick to your routine — same pre-shot you've done all day, trust the reps</span></button>
      <button class="soph-choice" id="golf2-b"><span class="soph-choice-label">Visualize the perfect shot in full detail, then pull the trigger</span></button>
      <button class="soph-choice" id="golf2-c"><span class="soph-choice-label">Aggressive line — cut the corner, hero shot, take the tournament</span></button>
    </div>`);
  document.getElementById('golf2-a').onclick = () => { Engine.modifyStats({sports:3,selfAwareness:2}); _flushStatToast(); _jrSceneDone('jr_ath_golf_done'); };
  document.getElementById('golf2-b').onclick = () => { Engine.modifyStats({sports:2,selfAwareness:3}); _flushStatToast(); _jrSceneDone('jr_ath_golf_done'); };
  document.getElementById('golf2-c').onclick = () => { Engine.modifyStats({sports:3,stress:2}); _flushStatToast(); _jrSceneDone('jr_ath_golf_done'); };
}

// ════════════════════════════════════════════════════════
//  LIFE PATH — BODY TRANSFORMATION
// ════════════════════════════════════════════════════════
const _SPLIT_CORRECT = { 'Bench Press':'push','Overhead Press':'push','Tricep Pushdowns':'push','Barbell Row':'pull','Pull-ups':'pull','Bicep Curls':'pull','Squat':'legs','Romanian Deadlift':'legs','Leg Press':'legs' };
function _jrBody_split() {
  window._splitAssign = {};
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH GYM — DAY 1</div>
    <h1 class="soph-title" style="font-size:1.7rem">BUILD YOUR SPLIT.</h1>
    <div class="soph-scene"><p>You've decided on Push/Pull/Legs — the classic hypertrophy split. Now you have to actually build it. Assign each exercise to the right training day.</p></div>
    <div id="split-board" style="display:grid;gap:7px;margin:14px 0"></div>
    <div style="font-size:11px;color:#a0a090;margin-bottom:10px">Click the buttons to assign each exercise to PUSH, PULL, or LEGS.</div>
    <div class="soph-nav"><span class="soph-progress">Assign all 9 exercises</span><button class="btn-primary" id="split-submit" disabled>SUBMIT SPLIT →</button></div>`);
  const board = document.getElementById('split-board');
  Object.keys(_SPLIT_CORRECT).forEach(ex => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;';
    row.innerHTML = `<span style="width:160px;font-size:13px;color:#e8dfc8">${ex}</span>
      <button class="soph-choice" data-ex="${ex}" data-day="push" style="padding:5px 10px;font-size:11px;min-height:0;flex:1">PUSH</button>
      <button class="soph-choice" data-ex="${ex}" data-day="pull" style="padding:5px 10px;font-size:11px;min-height:0;flex:1">PULL</button>
      <button class="soph-choice" data-ex="${ex}" data-day="legs" style="padding:5px 10px;font-size:11px;min-height:0;flex:1">LEGS</button>`;
    board.appendChild(row);
    row.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        window._splitAssign[ex] = btn.dataset.day;
        row.querySelectorAll('button').forEach(b => b.style.background = '');
        btn.style.background = 'rgba(107,203,119,0.35)';
        const done = Object.keys(window._splitAssign).length === 9;
        const sub = document.getElementById('split-submit');
        if (sub) sub.disabled = !done;
      };
    });
  });
  document.getElementById('split-submit').onclick = _jrBody_splitResult;
}
function _jrBody_splitResult() {
  let correct = 0;
  Object.entries(window._splitAssign).forEach(([ex, day]) => { if (_SPLIT_CORRECT[ex] === day) correct++; });
  let gpaD, physD, narr;
  if (correct >= 8) {
    gpaD=0; physD=3;
    narr=`Perfect split. ${correct}/9 correct. You actually know what you're doing. Push day is chest, shoulders, tris. Pull is back and bis. Legs is everything that keeps you from getting called out.`;
  } else if (correct >= 6) {
    gpaD=0; physD=2;
    narr=`${correct}/9 correct — solid understanding, a couple of misplacements. You fix them during warm-up and move on. Good enough to make real progress.`;
  } else if (correct >= 4) {
    gpaD=0; physD=1;
    narr=`${correct}/9 correct. Your split is functional but inefficient. You'll make gains, just slower. You realize halfway through week 2 that you had Romanian Deadlift on push day.`;
  } else {
    gpaD=0; physD=0;
    narr=`${correct}/9 correct. Your split is... a lot. Biceps on push day. Squats mid-pull session. You spend two weeks hitting the wrong muscles on the wrong days before looking it up.`;
  }
  Engine.modifyStats({ physique: physD, athleticism: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH GYM — WEEK 1 REVIEW</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-stat-delta">+${physD} Physique · +1 Athleticism</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _jrSceneDone('jr_body_split_done');
}

function _jrBody_diet() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — MONTH 2 · NUTRITION</div>
    <h1 class="soph-title" style="font-size:1.9rem">WHAT ARE YOU EATING?</h1>
    <div class="soph-scene"><p>The gym is easy. The kitchen is where transformations actually happen. You need a plan.</p></div>
    <div class="soph-prompt">WEEKLY NUTRITION APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="diet-a"><span class="soph-choice-label">Meal prep every Sunday — chicken, rice, broccoli, repeat. Consistent, boring, effective.</span></button>
      <button class="soph-choice" id="diet-b"><span class="soph-choice-label">Track macros with a flexible diet — hit your numbers, eat what you want</span></button>
      <button class="soph-choice" id="diet-c"><span class="soph-choice-label">Eat whatever, just make sure to hit protein goals at minimum</span></button>
    </div>`);
  document.getElementById('diet-a').onclick = () => { Engine.modifyStats({physique:3,happiness:-1,stress:1}); _flushStatToast(); _jrBody_diet2(); };
  document.getElementById('diet-b').onclick = () => { Engine.modifyStats({physique:2,happiness:2}); _flushStatToast(); _jrBody_diet2(); };
  document.getElementById('diet-c').onclick = () => { Engine.modifyStats({physique:1,happiness:2}); _flushStatToast(); _jrBody_diet2(); };
}
function _jrBody_diet2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH GYM — WEEK 8 CHECK-IN</div>
    <div class="soph-scene"><p>8 weeks in. You've been consistent — or you've been trying to be. Someone at school asks you how many times you've been to the gym this week.</p></div>
    <div class="soph-prompt">YOUR CONSISTENCY OVER 8 WEEKS:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="diet2-a"><span class="soph-choice-label">Missed 2 sessions total — essentially perfect attendance</span></button>
      <button class="soph-choice" id="diet2-b"><span class="soph-choice-label">Hit every upper body session, skipped a few leg days</span></button>
      <button class="soph-choice" id="diet2-c"><span class="soph-choice-label">Inconsistent — a full week here, a gap week there</span></button>
    </div>`);
  document.getElementById('diet2-a').onclick = () => { Engine.modifyStats({physique:3,athleticism:2}); _flushStatToast(); _jrSceneDone('jr_body_diet_done'); };
  document.getElementById('diet2-b').onclick = () => { Engine.modifyStats({physique:2,athleticism:1}); _flushStatToast(); _jrSceneDone('jr_body_diet_done'); };
  document.getElementById('diet2-c').onclick = () => { Engine.modifyStats({physique:1}); _flushStatToast(); _jrSceneDone('jr_body_diet_done'); };
}

function _jrBody_progress() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — MONTH 4 · RECOVERY</div>
    <h1 class="soph-title" style="font-size:1.9rem">THE PROGRESS CHECK.</h1>
    <div class="soph-scene"><p>4 months in. You can see the change in the mirror — and so can other people. But the gains are starting to slow, and your body needs to recover.</p></div>
    <div class="soph-prompt">YOUR RECOVERY APPROACH:</div>
    <div class="soph-choices">
      <button class="soph-choice" id="prog-a"><span class="soph-choice-label">8 hours sleep + active recovery days — you take this as seriously as the lifts</span></button>
      <button class="soph-choice" id="prog-b"><span class="soph-choice-label">Push through every day — no rest days, more is more</span></button>
      <button class="soph-choice" id="prog-c"><span class="soph-choice-label">Rest days when your body tells you — you listen to it</span></button>
    </div>`);
  document.getElementById('prog-a').onclick = () => { Engine.modifyStats({physique:2,sleep:2}); _flushStatToast(); _jrBody_progress2(); };
  document.getElementById('prog-b').onclick = () => { Engine.modifyStats({physique:1,athleticism:2,stress:2}); _flushStatToast(); _jrBody_progress2(); };
  document.getElementById('prog-c').onclick = () => { Engine.modifyStats({physique:2,sleep:1}); _flushStatToast(); _jrBody_progress2(); };
}
function _jrBody_progress2() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH — AFTER SCHOOL</div>
    <div class="soph-scene"><p>Someone who hasn't seen you in two months stops you in the hallway. <em>"Wait — you look different."</em> They mean it as a compliment. You know it is one.</p></div>
    <div class="soph-prompt">WHAT DO YOU SAY?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="prog2-a"><span class="soph-choice-label">Tell them everything — full program, diet, split, timeline</span></button>
      <button class="soph-choice" id="prog2-b"><span class="soph-choice-label">Just smile and say "consistency" — true, simple, and kind of legendary</span></button>
      <button class="soph-choice" id="prog2-c"><span class="soph-choice-label">"Want to train together sometime?" — you offer immediately</span></button>
    </div>`);
  document.getElementById('prog2-a').onclick = () => { Engine.modifyStats({relationships:2,friendships:1}); _flushStatToast(); _jrSceneDone('jr_body_progress_done'); };
  document.getElementById('prog2-b').onclick = () => { Engine.modifyStats({selfAwareness:3,happiness:2}); _flushStatToast(); _jrSceneDone('jr_body_progress_done'); };
  document.getElementById('prog2-c').onclick = () => { Engine.modifyStats({relationships:3,friendships:2}); _flushStatToast(); _jrSceneDone('jr_body_progress_done'); };
}

function showJuniorYearEnd() {
  const overlay=_getYrOverlay(), now=_currentStats();
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">MONTA VISTA HIGH · CUPERTINO, CA</div>
      <div class="ys-year-label">JUNIOR YEAR</div>
      <div class="yr-complete">COMPLETE</div>
      <div class="yr-divider"></div>
      <div class="ys-stats-grid">${_statsGrid(now)}</div>
      <div class="yr-divider" style="margin-top:24px"></div>
      <div class="ys-next-label">SENIOR YEAR BEGINS</div>
      <p class="ys-card-desc" style="margin-top:8px">The home stretch. Apps, chaos, and the end of an era.</p>
      <button class="btn-primary ys-confirm" id="ys-sr-btn" style="margin-top:20px">CONTINUE TO SENIOR YEAR →</button>
    </div>`;
  document.getElementById('ys-sr-btn').addEventListener('click',()=>{
    G.to(overlay,{opacity:0,duration:0.5,onComplete:()=>{
      overlay.style.display='none'; overlay.style.opacity='';
      if(typeof refreshStatsSidebar==='function') refreshStatsSidebar();
      showSeniorYear();
    }});
  },{once:true});
}

// ── SENIOR YEAR ──────────────────────────────────────

const SR_TIME_KILLERS = [
  { id:'kalshi',    icon:'📈', title:'MARKET GAMBLER',
    desc:'You spend free periods betting on event contracts. Addictive.',
    deltas:{ intelligence:1.0, gpa:-0.2, happiness:0.5 } },
  { id:'athlete_s', icon:'⛳', title:'DUAL ATHLETE',
    desc:'Golf & Football. Finish your high school career strong.',
    deltas:{ sports:2.5, friendships:1.5, gpa:-0.3 } },
  { id:'assassin',  icon:'💧', title:'SENIOR ASSASSIN',
    desc:"Water guns and paranoia. The most fun you've had all year.",
    deltas:{ friendships:2.0, happiness:2.5, intelligence:-0.5 } }
];

function showSeniorYear() {
  const overlay=_getYrOverlay();
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">MONTA VISTA HIGH · SENIOR YEAR</div>
      <div class="ys-event-icon">📝</div>
      <div class="ys-title">COLLEGE APP SEASON</div>
      <p class="ys-card-desc" style="max-width:500px;font-size:1rem;line-height:1.7;margin-top:8px">
        First semester. A blur of essays, deadlines, and sleepless nights.
        The process sucks the life out of you — but you finish.
      </p>
      <div class="ys-chips" style="margin-top:16px;justify-content:center">
        ${statChips({ extracurriculars:2.0, intelligence:1.0, happiness:-3.0, gpa:-0.5 })}
      </div>
      <button class="btn-primary ys-confirm" id="ys-apps-done" style="margin-top:32px">SUBMIT APPS →</button>
    </div>`;
  applyDeltas({ extracurriculars:2.0, intelligence:1.0, happiness:-3.0, gpa:-0.5 });
  document.getElementById('ys-apps-done').addEventListener('click',()=>_srFlip(),{once:true});
}

function _srFlip() {
  const overlay=_getYrOverlay();
  const lockIn=Math.random()<0.5;
  const ev=lockIn
    ? { icon:'🔒', title:'THE LOCK-IN PHASE', desc:"You stay disciplined to protect your offers.", deltas:{gpa:0.5,intelligence:1.0,happiness:-1.0} }
    : { icon:'😴', title:'SEVERE SENIORITIS',  desc:"You ditch class. You don't care anymore.",   deltas:{gpa:-0.6,friendships:2.0,happiness:1.5,intelligence:-1.0} };
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">SENIOR YEAR · SECOND SEMESTER</div>
      <div class="ys-event-icon">${ev.icon}</div>
      <div class="ys-title" style="font-size:2.2rem">${ev.title}</div>
      <p class="ys-card-desc" style="max-width:460px;font-size:1rem;line-height:1.7;margin-top:8px">${ev.desc}</p>
      <div class="ys-chips" style="margin-top:16px;justify-content:center">${statChips(ev.deltas)}</div>
      <button class="btn-primary ys-confirm" id="ys-flip-done" style="margin-top:28px">CONTINUE →</button>
    </div>`;
  applyDeltas(ev.deltas);
  document.getElementById('ys-flip-done').addEventListener('click',()=>_srSunrise(),{once:true});
}

function _srSunrise() {
  const overlay=_getYrOverlay();
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">SENIOR YEAR · EVENT</div>
      <div class="ys-event-icon">🌅</div>
      <div class="ys-title" style="font-size:2.2rem">SENIOR SUNRISE</div>
      <p class="ys-card-desc" style="max-width:460px;font-size:1rem;line-height:1.7;margin-top:8px">
        5:00 AM. You drag yourself out of bed. Completely cloudy — can't see the sun.
        But you're there. That counts for something.
      </p>
      <div class="ys-chips" style="margin-top:16px;justify-content:center">
        ${statChips({ friendships:0.5, happiness:-0.5 })}
      </div>
      <button class="btn-primary ys-confirm" id="ys-sr-hc" style="margin-top:28px">CONTINUE →</button>
    </div>`;
  applyDeltas({ friendships:0.5, happiness:-0.5 });
  document.getElementById('ys-sr-hc').addEventListener('click',()=>_srHomecoming(),{once:true});
}

function _srHomecoming() {
  const overlay=_getYrOverlay();
  const now=_currentStats();
  const withPartner=(now.relationships??0)>5.0;
  const deltas=withPartner?{happiness:2.0,relationships:1.5}:{friendships:1.5,relationships:-0.5};
  const desc=withPartner
    ? "You go with your partner. The night is everything."
    : "No date. You roll with the squad. Still a memory.";
  overlay.innerHTML=`
    <div class="ys-inner">
      <div class="ys-badge">SENIOR YEAR · EVENT</div>
      <div class="ys-event-icon">🕺</div>
      <div class="ys-title" style="font-size:2.2rem">HOMECOMING DANCE</div>
      <div class="ys-card-desc" style="font-size:0.8rem;opacity:0.55;margin-top:4px">
        ${withPartner?'REL > 5.0 — You have a date.':'REL ≤ 5.0 — Going with friends.'}
      </div>
      <p class="ys-card-desc" style="max-width:460px;font-size:1rem;line-height:1.7;margin-top:10px">${desc}</p>
      <div class="ys-chips" style="margin-top:16px;justify-content:center">${statChips(deltas)}</div>
      <button class="btn-primary ys-confirm" id="ys-sr-tk" style="margin-top:28px">CONTINUE →</button>
    </div>`;
  applyDeltas(deltas);
  document.getElementById('ys-sr-tk').addEventListener('click',()=>_srTimeKiller(),{once:true});
}

function _srTimeKiller() {
  const overlay=_getYrOverlay();
  let chosen=null;

  function render() {
    overlay.innerHTML=`
      <div class="ys-inner">
        <div class="ys-badge">SENIOR YEAR · FINAL SEMESTER</div>
        <div class="ys-title">HOW DO YOU SPEND IT?</div>
        <div class="ys-subtitle">One last thing that defines your senior year.</div>
        <div class="ys-grid">
          ${SR_TIME_KILLERS.map(p=>`
            <div class="ys-card${chosen===p.id?' selected':''}" data-id="${p.id}">
              <div class="ys-card-icon">${p.icon}</div>
              <div class="ys-card-title">${p.title}</div>
              <div class="ys-card-desc">${p.desc}</div>
              <div class="ys-chips">${statChips(p.deltas)}</div>
            </div>`).join('')}
        </div>
        <button class="btn-primary ys-confirm" id="ys-confirm" ${!chosen?'disabled':''}>LOCK IN →</button>
      </div>`;
    overlay.querySelectorAll('.ys-card').forEach(card=>{
      card.addEventListener('click',()=>{ chosen=card.dataset.id; render(); });
    });
    const btn=document.getElementById('ys-confirm');
    if(btn && chosen) btn.addEventListener('click',()=>{
      applyDeltas(SR_TIME_KILLERS.find(p=>p.id===chosen).deltas);
      showGraduation();
    },{once:true});
  }
  render();
}

function showGraduation() {
  const overlay=_getYrOverlay(), now=_currentStats();
  const gpa=now.gpa??0;
  const label=gpa>=3.8?'VALEDICTORIAN CANDIDATE':gpa>=3.0?'HONOR ROLL':gpa>=2.0?'GRADUATED':'BARELY MADE IT';
  const desc=gpa>=3.8?"Four years of excellence. They'll remember your name."
           : gpa>=3.0?"Solid. You did what you came to do."
           : gpa>=2.0?"You got through it. That's something."
           : "It was hard. But you're here.";
  overlay.innerHTML=`
    <div class="ys-inner" style="text-align:center">
      <div class="ys-badge">MONTA VISTA HIGH SCHOOL · CLASS OF 2026</div>
      <div class="ys-event-icon" style="font-size:4rem;margin:20px 0">🎓</div>
      <div class="ys-year-label" style="font-size:3rem;letter-spacing:.15em">GRADUATION</div>
      <div class="yr-complete" style="font-size:1.6rem;margin:6px 0">${label}</div>
      <p class="ys-card-desc" style="max-width:480px;font-size:1rem;line-height:1.7;margin:12px auto">${desc}</p>
      <div class="yr-divider" style="margin:20px auto;max-width:480px"></div>
      <div class="ys-stats-grid" style="max-width:520px;margin:0 auto">${_statsGrid(now)}</div>
      <div class="yr-divider" style="margin:20px auto;max-width:480px"></div>
      <p style="font-size:0.78rem;opacity:0.35;margin-top:6px;letter-spacing:.1em">MYTH · HIGH SCHOOL LIFE SIMULATOR</p>
    </div>`;
  if(typeof refreshStatsSidebar==='function') refreshStatsSidebar();
}

// ════════════════════════════════════════════════════════
//  SOPHOMORE YEAR SYSTEM
// ════════════════════════════════════════════════════════

// Active Enter-key handler for soph-overlay — replaced on every _sophShow call
let _sophEnterKH = null;
function _sophShow(html) {
  const inner = document.getElementById('soph-inner');
  G.killTweensOf(inner);
  G.set(inner, { opacity: 1, y: 0 });
  inner.innerHTML = html;
  const overlay = document.getElementById('soph-overlay');
  overlay.style.display = 'flex';
  G.fromTo(inner, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });

  // Remove any previous Enter listener before attaching a fresh one
  if (_sophEnterKH) { document.removeEventListener('keydown', _sophEnterKH); _sophEnterKH = null; }
  _sophEnterKH = function(e) {
    if (e.key !== 'Enter') return;
    // Only fire on single-advance buttons — never auto-click choice buttons
    const btn = inner.querySelector('#soph-done, #soph-next, #soph-yr-done');
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  };
  document.addEventListener('keydown', _sophEnterKH);
}
function _sophHide(cb) {
  if (_sophEnterKH) { document.removeEventListener('keydown', _sophEnterKH); _sophEnterKH = null; }
  G.to('#soph-inner', { opacity: 0, y: -12, duration: 0.3, ease: 'power2.in', onComplete: () => {
    document.getElementById('soph-overlay').style.display = 'none';
    if (cb) cb();
  }});
}

// ── Freshman year end + class/EC selection ────────────
window.showFreshmanYearEnd = function() {

  // ── Freshman year narrative recap ─────────────────────────
  const now    = (typeof Engine !== 'undefined' && Engine.getState) ? (Engine.getState()?.stats ?? {}) : {};
  const start  = window.MYTH_START_STATS || {};
  const ec     = window.MYTH_CLUB_CHOICE === 'robotics' ? 'Robotics Club' :
                 window.MYTH_CLUB_CHOICE === 'football'  ? 'Football'       : 'No EC';
  const gpa    = now.gpa || 0;
  const gpaLabel = gpa >= 3.8 ? 'Honors Freshman' : gpa >= 3.0 ? 'Solid Year' : gpa >= 2.0 ? 'Getting By' : 'Rough Start';
  const disobeyed = window.MYTH_PE_DISOBEYED;
  const statOrder = ['gpa','friendships','relationships','sports','intelligence','extracurriculars','happiness'];
  function summaryRow(key) {
    const s0 = start[key] ?? (now[key] || 0), s1 = now[key] || 0, d = +(s1-s0).toFixed(2);
    const arrow = d > 0 ? `<span style="color:#6BCB77">▲ +${d}</span>` : d < 0 ? `<span style="color:#FC7B54">▼ ${d}</span>` : `<span style="color:#888">—</span>`;
    const label = (typeof STAT_LABELS !== 'undefined' ? STAT_LABELS[key] : null) || key.toUpperCase();
    const pct = key === 'gpa' ? (s1/4)*100 : (s1/10)*100;
    const col = pct >= 70 ? '#F7B731' : pct >= 40 ? '#6BCB77' : '#FC7B54';
    return `<div class="yr-stat-row"><span class="yr-stat-label">${label}</span><div class="yr-stat-bar-wrap"><div class="yr-stat-bar" style="width:${Math.round(pct)}%;background:${col}"></div></div><span class="yr-stat-val">${s1.toFixed(key==='gpa'?2:1)}</span><span class="yr-stat-delta">${arrow}</span></div>`;
  }

  const _bioRecapLine = {
    outage:   "Bio class. Mrs. Alvarez handed out the rubrics. Then every light in the building died at once. Storm knocked the whole grid. Automatic A — you never touched a scalpel.",
    practical:"Bio class. Formaldehyde. Five fetal pigs on steel trays. You walked station to station and answered questions under timed conditions. You figured out what you were made of.",
    chemical: "Bio class. A lab tech mixed the wrong bottles. Pale gas rolled off the trays. Jaylen Rodriguez hit the floor. You made it to the courtyard with streaming eyes. Automatic A — and a story you'll tell for years.",
  }[window.MYTH_BIO_SCENARIO] || "Bio class. Whatever happened in that room, you survived it.";

  _sophShow(`
    <div class="soph-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; FRESHMAN YEAR — RECAP</div>
    <h1 class="soph-title" style="font-size:2.6rem;margin-bottom:6px">YEAR ONE.</h1>
    <div class="soph-scene" style="max-width:560px;margin:0 auto 18px">
      <p style="font-size:1.2rem;line-height:1.8;color:#f0ece4">${_bioRecapLine}</p>
      <p style="font-size:1.2rem;line-height:1.8;color:#f0ece4;margin-top:10px">PE. A PA announcement that didn't sound like a drill. Forty-one minutes on a cold gym floor. ${disobeyed ? "You ran. Principal's office. Monday morning. It went on the record." : "You stayed. Coach Williams' voice was flat. You breathed through it."}</p>
      <p style="font-size:1.15rem;line-height:1.8;color:#c8c0b0;margin-top:10px">EC: <strong style="color:#ffd700">${ec}</strong> &nbsp;·&nbsp; Verdict: <strong style="color:#ffd700">${gpaLabel}</strong></p>
    </div>
    <div class="yr-stats" style="width:100%;max-width:520px;margin:0 auto">${statOrder.map(summaryRow).join('')}</div>
    <div class="soph-nav" style="margin-top:32px"><button class="btn-primary" id="soph-summary-next">SOPHOMORE YEAR →</button></div>
  `);
  document.getElementById('soph-summary-next').addEventListener('click', _showCourseSelect, { once: true });

  // ── Pick 2 courses (no EC) ────────────────────────────────
  function _showCourseSelect() {
    const chosen = new Set();
    function render() {
      const courses = [
        { id:'apcsa',   label:'AP COMPUTER SCIENCE A', desc:'Code, problem-solve, survive Mr. Greenstein\'s grading. High stress. High reward.' },
        { id:'physics', label:'AP PHYSICS 1',           desc:'Mr. Birdsong. Egg drops and a surprise field trip. Hands-on. Unpredictable.' },
        { id:'studies', label:'STUDIES PERIOD',          desc:'Structured free period. More people. More drama. Easier on the GPA.' },
      ];
      _sophShow(`
        <div class="soph-badge">MONTA VISTA HIGH SCHOOL &nbsp;·&nbsp; SOPHOMORE YEAR</div>
        <h1 class="soph-title">PICK YOUR CLASSES.</h1>
        <div class="soph-scene"><p>You get to choose two courses this year. Choose wisely — you'll actually have to show up.</p></div>
        <div class="soph-grade-choice-grid" id="soph-course-grid" style="grid-template-columns:1fr 1fr 1fr">
          ${courses.map(c => `<div class="soph-grade-card${chosen.has(c.id)?' selected':''}" data-pick="${c.id}">
            <div class="sgc-label">${c.label}</div><div class="sgc-desc">${c.desc}</div>
            ${chosen.has(c.id) ? `<div style="color:#6BCB77;font-size:.75rem;margin-top:6px;font-weight:700">✓ SELECTED</div>` : ''}
          </div>`).join('')}
        </div>
        <div class="soph-nav" style="margin-top:28px">
          <span class="soph-progress">${chosen.size}/2 selected</span>
          <button class="btn-primary" id="soph-start-btn" ${chosen.size<2?'disabled':''}>START SOPHOMORE YEAR →</button>
        </div>
      `);
      document.getElementById('soph-course-grid').querySelectorAll('.soph-grade-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.pick;
          if (chosen.has(id)) chosen.delete(id);
          else if (chosen.size < 2) chosen.add(id);
          render();
        });
      });
      if (chosen.size === 2) {
        document.getElementById('soph-start-btn').addEventListener('click', () => {
          const [c1, c2] = [...chosen];
          Engine.setFlag('soph_class_' + c1); Engine.setFlag('soph_class_' + c2);
          Engine.setFlag('freshman_year_complete');
          _sophHide(() => {
            window.MYTH_ORIENTATION_ACTIVE   = false;
            window.MYTH_PE_DONE              = true;
            window.MYTH_FRESHMAN_RESTRICTION = false;
            refreshStatsSidebar();
            _sophStep(0, c1, c2);
          });
        }, { once: true });
      }
    }
    render();
  }
};

// ════════════════════════════════════════════════════════
//  SOPHOMORE YEAR SEQUENCE STATE MACHINE
// ════════════════════════════════════════════════════════

// Classroom locations — r is minimap indicator radius only.
// minX/maxX/minZ/maxZ = DOOR THRESHOLD zone: a narrow band (door-width ± 2,
// 3 units deep just inside the doorway). Only fires when the player physically
// walks through the door opening — not when passing by outside.
//
// South-door formula (standard building(bx,bz,w,d)):
//   door center = (bx, bz+d/2)
//   threshold   = minX:bx-2  maxX:bx+2  minZ:bz+d/2-3  maxZ:bz+d/2
//
// Bio west-door: door center = (-108, -36)
//   threshold   = minX:-108  maxX:-105  minZ:-37.5  maxZ:-34.5
const _SOPH_LOCS = {
  // building(12,-74,26,15)  → south door @ (12, -66.5)
  apcsa:    { room: 'Room 214 — Building B',   x: 12,  z: -74, r: 13,
              minX: 10,  maxX: 14,  minZ: -69.5, maxZ: -66.5 },
  // building(76,-32,24,15)  → south door @ (76, -24.5)
  physics:  { room: 'Room 203 — Physics Wing', x: 76,  z: -32, r: 12,
              minX: 74,  maxX: 78,  minZ: -27.5, maxZ: -24.5 },
  // building(-32,-54,26,13) → south door @ (-32, -47.5)
  studies:  { room: 'Room 119 — Building C',   x: -32, z: -54, r: 13,
              minX: -34, maxX: -30, minZ: -50.5, maxZ: -47.5 },
  // bio room bx=-97 bw=22   → west door  @ (-108, -36)
  robotics: { room: 'Room 108 — Robotics Lab', x: -97, z: -36, r: 11,
              minX: -108,maxX: -105,minZ: -37.5, maxZ: -34.5 },
  // open football field — keep wide zone
  football: { room: 'Football Field',          x: -82, z: 102, r: 18,
              minX: -140, maxX: -25, minZ: 65,  maxZ: 155 },
  // ── Junior year (same door-threshold approach) ──
  // building(50,-74,26,15)  → south door @ (50, -66.5)
  calc_bc:     { room: 'Room 304 — Building D (Calc BC)',       x: 50,  z: -74, r: 13,
                 minX: 48,  maxX: 52,  minZ: -69.5, maxZ: -66.5 },
  // building(-32,-74,30,15) → south door @ (-32, -66.5)
  apush:       { room: 'Room 201 — Admin Wing (APUSH)',         x: -32, z: -74, r: 13,
                 minX: -34, maxX: -30, minZ: -69.5, maxZ: -66.5 },
  // building(12,-54,24,13)  → south door @ (12, -47.5)
  dual_enroll: { room: 'Science E — De Anza (Dual Enrollment)', x: 12,  z: -54, r: 13,
                 minX: 10,  maxX: 14,  minZ: -50.5, maxZ: -47.5 },
};

// Sequence: c1c1, c2c1, brawl, c1c2, psat, c2c2, fitness, end
function _sophStep(idx, c1, c2) {
  c1 = c1 || window._SOPH_C1; c2 = c2 || window._SOPH_C2;
  window._SOPH_C1 = c1; window._SOPH_C2 = c2;
  const next = () => _sophStep(idx + 1);
  switch (idx) {
    case 0: _goToClass(c1, 1, next); break;
    case 1: _goToClass(c2, 1, next); break;
    case 2: _sophBrawlPhase(next); break;
    case 3: _goToClass(c1, 2, next); break;
    case 4: _sophPSATPhase(next); break;
    case 5: _goToClass(c2, 2, next); break;
    case 6: _sophFitnessPhase(next); break;
    default: if (window.showSophYearEnd) window.showSophYearEnd(); break;
  }
}

function _goToClass(course, classNum, done) {
  const loc = _SOPH_LOCS[course];
  const hint = document.getElementById('soph-nav-hint');
  // Determine nav time limit (EC = 90s real-time, class = unlimited)
  const isEC = (course === 'robotics' || course === 'football');
  const timeLimit = isEC ? 90 : 0; // seconds; 0 = no limit
  window.MYTH_EC_NAV_START = isEC ? Date.now() : null;
  window.MYTH_EC_NAV_LIMIT = timeLimit;
  window.MYTH_EC_LATE      = false;
  if (hint) {
    const timerStr = isEC ? ' · <span id="ec-nav-timer">1:30</span>' : '';
    hint.innerHTML = '📍 Head to ' + loc.room + timerStr;
    hint.style.display = 'block';
  }
  window.MYTH_SOPH_NAV_TARGET = { x: loc.x, z: loc.z, r: loc.r, course, classNum, done };
  window.MYTH_ORIENTATION_ACTIVE = false;
}

// Called by each class function's done button — checks for sequence callback first
function _sophDone(...flags) {
  flags.forEach(f => Engine.setFlag(f));
  const cb = window.MYTH_SOPH_ON_DONE;
  window.MYTH_SOPH_ON_DONE = null;
  _sophHide(() => { if (cb) cb(); else safeEventCheck(); });
}

// ── Brawl Stars phase ─────────────────────────────────────
function _sophBrawlPhase(done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  _sophShow(`
    <div class="soph-badge">PHONE NOTIFICATION</div>
    <h1 class="soph-title" style="font-size:2rem">TOURNAMENT INVITE.</h1>
    <div class="soph-scene">
      <p>A notification from the school's esports Discord. Okafor pinged everyone:</p>
      <div class="soph-speech">"32-player regional Brawl Stars bracket — this weekend, open entry, real prize pool. I signed up. You should too."</div>
    </div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices" id="brawl-phase-choices">
      <button class="soph-choice" id="brawl-yes"><span class="soph-choice-label">ENTER THE TOURNAMENT — "I'm in."</span><span class="soph-choice-hint">32-player single elimination. Rock Paper Scissors format.</span></button>
      <button class="soph-choice" id="brawl-no"><span class="soph-choice-label">PASS — too much going on right now</span><span class="soph-choice-hint">You keep your evenings free. Stats reduced.</span></button>
    </div>
  `);
  document.getElementById('brawl-yes').onclick = () => {
    window.MYTH_SOPH_ON_DONE = done;
    window._brawlTournamentOnly();
  };
  document.getElementById('brawl-no').onclick = () => {
    Engine.modifyStats({ stress: -1, extracurriculars: -1 }); _flushStatToast();
    Engine.setFlag('brawl_tournament_declined');
    _sophShow(`
      <div class="soph-badge">PHONE</div>
      <div class="soph-scene"><p>"Respect," Okafor texts back. "Next one." You pocket your phone. The bracket fills without you.</p></div>
      <div class="soph-nav"><button class="btn-primary" id="soph-done">CONTINUE →</button></div>
    `);
    document.getElementById('soph-done').onclick = () => { Engine.setFlag('brawl_tournament_offered'); _sophHide(() => done && done()); };
  };
}

// ── PSAT phase ────────────────────────────────────────────
function _sophPSATPhase(done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  _sophShow(`
    <div class="soph-badge">FRONT ENTRANCE — BULLETIN BOARD</div>
    <h1 class="soph-title" style="font-size:2rem">PSAT.</h1>
    <div class="soph-scene">
      <p>There's a sign-up sheet on the bulletin board. <strong style="color:#ffd700">PSAT — Saturday, October 14th.</strong> It counts as practice for the SAT junior year. Some people blow it off. Others treat it like their life depends on it.</p>
    </div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="psat-study"><span class="soph-choice-label">STUDY HARD — make it count</span><span class="soph-choice-hint">Costs you now. Pays off when applying to college.</span></button>
      <button class="soph-choice" id="psat-wing"><span class="soph-choice-label">WING IT — it's just practice anyway</span><span class="soph-choice-hint">Easier now. Harder when it actually counts.</span></button>
    </div>
  `);
  document.getElementById('psat-study').onclick = () => {
    Engine.modifyStats({ gpa: -1, happiness: -1, stress: +2, sleep: -1 }); _flushStatToast();
    Engine.setFlag('psat_studied');
    _sophShow(`
      <div class="soph-badge">PSAT — RESULT</div>
      <div class="soph-scene"><p>You spend three weekends on prep books. Your social life takes the hit. The test itself feels manageable. You won't know if it mattered for another two years — but it will.</p></div>
      <div class="soph-nav"><button class="btn-primary" id="soph-done">CONTINUE →</button></div>
    `);
    document.getElementById('soph-done').onclick = () => { _sophHide(() => done && done()); };
  };
  document.getElementById('psat-wing').onclick = () => {
    Engine.modifyStats({ happiness: +1, stress: -1 }); _flushStatToast();
    Engine.setFlag('psat_skipped_prep');
    _sophShow(`
      <div class="soph-badge">PSAT — RESULT</div>
      <div class="soph-scene"><p>You show up Saturday with a pencil and no prep. The reading section is rougher than expected. You bubble something for every question and leave early. It felt fine. It wasn't.</p></div>
      <div class="soph-nav"><button class="btn-primary" id="soph-done">CONTINUE →</button></div>
    `);
    document.getElementById('soph-done').onclick = () => { _sophHide(() => done && done()); };
  };
}

// ── Fitness phase ─────────────────────────────────────────
function _sophFitnessPhase(done) {
  window.MYTH_ORIENTATION_ACTIVE = true;
  window.MYTH_SOPH_ON_DONE = done;
  window.showFitnessJourney();
}

// ════════════════════════════════════════════════════════
//  APCSA CLASS 1
// ════════════════════════════════════════════════════════
window.showAPCSA_Class1 = function() { Engine.setFlag('soph_apcsa1_started'); _apcsa1_beat1(); };

function _apcsa1_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A</div><h1 class="soph-title">PERIOD 2.</h1>
    <div class="soph-scene"><p>Mr. Greenstein's room smells like dry-erase markers. Posters of Java syntax line the walls. He's already writing before anyone's seated.</p></div>
    <div class="soph-speaker">MR. GREENSTEIN</div><div class="soph-speech">"Find a seat. Doesn't matter which — for today."</div>
    <div class="soph-scene"><p>You sit. The kid next to you already has their laptop open.</p></div>
    <div class="soph-nav"><span class="soph-progress">1 / 5</span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = _apcsa1_beat2;
}
function _apcsa1_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A</div>
    <div class="soph-speaker">MR. GREENSTEIN</div><div class="soph-speech">"This is AP CSA. We use Java. You write code, read code, debug code. The AP exam is in May. I do not curve."</div>
    <div class="soph-speech">"First task. What does this print?"</div>
    <div class="soph-code-block">System.out.println("Hello" + " " + "World");</div>
    <div class="soph-prompt">WHAT IS THE OUTPUT?</div>
    <div class="soph-choices" id="soph-choices">
      <button class="soph-choice" data-ans="correct"><span class="soph-choice-label">Hello World</span></button>
      <button class="soph-choice" data-ans="wrong"><span class="soph-choice-label">HelloWorld</span></button>
      <button class="soph-choice" data-ans="wrong"><span class="soph-choice-label">"Hello" + " " + "World"</span></button>
      <button class="soph-choice" data-ans="wrong"><span class="soph-choice-label">Error</span></button>
    </div>
    <div class="soph-nav"><span class="soph-progress">2 / 5</span></div>`);
  document.querySelectorAll('#soph-choices .soph-choice').forEach(b => { b.onclick = () => _apcsa1_q1result(b.dataset.ans === 'correct'); });
}
function _apcsa1_q1result(correct) {
  Engine.modifyStat('gpa', correct ? 1 : -0.5); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A</div>
    <div class="soph-speaker">MR. GREENSTEIN</div>
    <div class="soph-speech">${correct ? '"Correct. String concatenation." He marks his gradebook.' : '"No. Read the operators." He marks his gradebook.'}</div>
    <div class="soph-stat-delta ${correct ? '' : 'neg'}">GPA ${correct ? '+1.0' : '−0.5'}</div>
    <div class="soph-scene"><p>Class moves on. Three more exercises. Your hand hurts by the end.</p></div>
    <div class="soph-nav"><span class="soph-progress">3 / 5</span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = _apcsa1_beat4;
}
function _apcsa1_beat4() {
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A</div>
    <div class="soph-scene"><p>End of class. The kid next to you — Marcus — leans over.</p></div>
    <div class="soph-speaker">MARCUS</div><div class="soph-speech">"You get that last one? I had no idea what a for-loop was before today."</div>
    <div class="soph-prompt">HOW DO YOU RESPOND?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="sc-a"><span class="soph-choice-label">HELP HIM OUT</span><span class="soph-choice-hint">Walk him through it before you leave.</span></button>
      <button class="soph-choice" id="sc-b"><span class="soph-choice-label">"YEAH, IT'S BASICALLY A LOOP"</span></button>
      <button class="soph-choice" id="sc-c"><span class="soph-choice-label">SHRUG AND PACK UP</span></button>
    </div>
    <div class="soph-nav"><span class="soph-progress">4 / 5</span></div>`);
  document.getElementById('sc-a').onclick = () => { Engine.modifyStats({ friendships:1, integrity:1 }); _flushStatToast(); _apcsa1_beat5('You spend five minutes at the board. He gets it.'); };
  document.getElementById('sc-b').onclick = () => { Engine.modifyStats({ friendships:1 }); _flushStatToast(); _apcsa1_beat5('Close enough. He nods and writes something down.'); };
  document.getElementById('sc-c').onclick = () => { _apcsa1_beat5('You leave. He figures it out on his own, probably.'); };
}
function _apcsa1_beat5(narr) {
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A</div>
    <div class="soph-scene"><p>${narr}</p><p>Greenstein's problem set is already in your bag.</p></div>
    <div class="soph-nav"><span class="soph-progress">5 / 5</span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_apcsa1_done');
}

// ════════════════════════════════════════════════════════
//  APCSA FINAL EXAM
// ════════════════════════════════════════════════════════
window.showAPCSA_Final = function() { Engine.setFlag('soph_apcsa_final_started'); _apcsa_final_beat1(); };

function _apcsa_final_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 214 · AP COMPUTER SCIENCE A — FINAL EXAM</div><h1 class="soph-title">FINALS WEEK.</h1>
    <div class="soph-scene"><p>Desks spread apart. No bags. Assigned seats printed in 8-point font. Two hours. Greenstein sets a timer on the projector and sits down without a word.</p></div>
    <div class="soph-nav"><span class="soph-progress">Exam begins.</span><button class="btn-primary" id="soph-next">BEGIN EXAM →</button></div>`);
  document.getElementById('soph-next').onclick = _apcsa_final_q1;
}
let _apcsa_correct = 0;
function _apcsa_final_q1() {
  _apcsa_correct = 0;
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · Q1</div>
    <div class="soph-code-block">int[] nums = {3, 1, 4, 1, 5};\nSystem.out.println(nums[2]);</div>
    <div class="soph-prompt">WHAT IS PRINTED?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">1</span></button>
      <button class="soph-choice" data-a="c"><span class="soph-choice-label">4</span><span class="soph-choice-hint">Arrays are zero-indexed</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">3</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">5</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Q 1 / 2</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { if (b.dataset.a==='c') _apcsa_correct++; _apcsa_final_q2(); }; });
}
function _apcsa_final_q2() {
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · Q2</div>
    <div class="soph-code-block">for (int i = 0; i < 3; i++) {\n    System.out.print(i + " ");\n}</div>
    <div class="soph-prompt">WHAT IS THE OUTPUT?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">1 2 3</span></button>
      <button class="soph-choice" data-a="c"><span class="soph-choice-label">0 1 2 </span><span class="soph-choice-hint">Starts at 0, condition is i &lt; 3</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">0 1 2 3</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">Error</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Q 2 / 2</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { if (b.dataset.a==='c') _apcsa_correct++; _apcsa_final_waterBreak(false); }; });
}
function _apcsa_final_waterBreak(second) {
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · MID-EXAM</div>
    <div class="soph-speaker">MS. PARK</div>
    <div class="soph-speech">"Water's outside if you need it. Won't affect your score."</div>
    <div class="soph-scene"><p>The hallway is quiet. The fountain is twenty feet away. Your hand aches.</p></div>
    <div class="soph-prompt">DO YOU TAKE THE WATER BREAK?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="wb-yes"><span class="soph-choice-label">YES — STEP OUT</span></button>
      <button class="soph-choice" id="wb-no"><span class="soph-choice-label">NO — KEEP WORKING</span></button>
    </div>`);
  document.getElementById('wb-yes').onclick = _apcsa_final_faint;
  document.getElementById('wb-no').onclick   = () => second ? _apcsa_final_finish() : _apcsa_final_q3();
}
function _apcsa_final_q3() {
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · CONTINUING</div>
    <div class="soph-code-block">String s = "Monta Vista";\nSystem.out.println(s.length());</div>
    <div class="soph-prompt">WHAT IS PRINTED?</div>
    <div class="soph-choices">
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">8</span></button>
      <button class="soph-choice" data-a="c"><span class="soph-choice-label">9</span><span class="soph-choice-hint">length() counts all characters</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">10</span></button>
    </div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { if (b.dataset.a==='c') _apcsa_correct++; _apcsa_final_q4(); }; });
}
function _apcsa_final_q4() {
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · LAST QUESTION</div>
    <div class="soph-prompt">TRUE OR FALSE: Java is case-sensitive.</div>
    <div class="soph-choices">
      <button class="soph-choice" data-a="c"><span class="soph-choice-label">TRUE</span><span class="soph-choice-hint">int ≠ Int ≠ INT</span></button>
      <button class="soph-choice" data-a="w"><span class="soph-choice-label">FALSE</span></button>
    </div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { if (b.dataset.a==='c') _apcsa_correct++; _apcsa_final_waterBreak(true); }; });
}
function _apcsa_final_finish() {
  const gpaD = _apcsa_correct >= 3 ? 2 : _apcsa_correct === 2 ? 1 : 0;
  if (gpaD) Engine.modifyStat('gpa', gpaD); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 214 — FINAL · COMPLETE</div><h1 class="soph-title">PENCILS DOWN.</h1>
    <div class="soph-scene"><p>Greenstein collects the exams without a word. Marcus gives you a look on the way out: <em>how'd you do?</em> You shrug.</p></div>
    <div class="soph-stat-delta ${gpaD>0?'':'neg'}">GPA ${gpaD>0?'+':'±'}${gpaD} · ${_apcsa_correct} / 4 correct</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_apcsa_final_done');
}
function _apcsa_final_faint() {
  _sophShow(`<div class="soph-badge">ROOM 214 — HALLWAY</div>
    <div class="soph-scene"><p>You set your pencil down. The hallway is empty. Your shoes squeak on the linoleum. The fountain is right there. Cool water.</p><p>It feels good. For about two seconds.</p></div>
    <div class="soph-scene" style="color:#fc7b54"><p>Then the floor tilts. Your vision narrows to a pinhole. Your knees don't respond.</p></div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = () => {
    G.to('#soph-inner', { opacity: 0, duration: 1.6, ease: 'power2.in', onComplete: () => {
      const inner = document.getElementById('soph-inner');
      inner.innerHTML = `<div style="text-align:center;padding:80px 0;font-family:monospace;color:rgba(255,255,255,0.06);font-size:11px;letter-spacing:.22em">. . .</div>`;
      G.set(inner, {opacity:1,y:0});
      G.fromTo(inner, {opacity:0}, {opacity:1, duration:0.5, delay:1.2,
        onComplete: () => setTimeout(_apcsa_ambulance_scene, 900)});
    }});
  };
}

let _ambInterval = null;
function _apcsa_ambulance_scene() {
  const inner = document.getElementById('soph-inner');
  G.killTweensOf(inner); G.set(inner, {opacity:1, y:0});
  inner.innerHTML = `
    <div class="soph-badge">MONTA VISTA HIGH — EAST HALLWAY</div>
    <div class="amb-scene" id="amb-scene-box">
      <div class="amb-flash" id="amb-flash-el"></div>
      <div class="amb-text">
        <p>A student found you face-down near the fountain. You hit the basin edge on the way down.</p>
      </div>
    </div>
    <div id="amb-beats" style="font-size:14px;line-height:1.85;color:#c8bfa8;min-height:120px"></div>
  `;

  const beats = [
    { ms: 600,  txt: '📢  "SOMEONE CALL THE NURSE! NOW!"' },
    { ms: 1800, txt: 'Two teachers sprint down the hallway from opposite ends.' },
    { ms: 3200, txt: '🚑  Sirens outside. Getting louder. Red and blue through the windows.' },
    { ms: 4600, txt: 'Paramedics push through the double doors with a gurney. The hallway clears in seconds.' },
    { ms: 6100, txt: '"Jaw fracture — possible. Pulse stable." Neck brace. Backboard. You can\'t feel your face.' },
    { ms: 7800, txt: '🚑  The exam room empties out to watch through the glass. Greenstein stands in the doorway, not moving.' },
    { ms: 9400, txt: 'Ambulance doors. Cold air. The siren starts again. Then everything goes very quiet.' },
  ];

  const beatsDiv = document.getElementById('amb-beats');
  if (_ambInterval) clearInterval(_ambInterval);
  _ambInterval = setInterval(() => {
    const el = document.getElementById('amb-flash-el');
    if (!el) { clearInterval(_ambInterval); _ambInterval = null; return; }
    el.style.animationPlayState = 'running';
  }, 100);

  beats.forEach(b => setTimeout(() => {
    const div = document.getElementById('amb-beats');
    if (!div) return;
    const p = document.createElement('p');
    p.className = 'amb-beat'; p.textContent = b.txt;
    div.appendChild(p);
  }, b.ms));

  setTimeout(() => {
    if (_ambInterval) { clearInterval(_ambInterval); _ambInterval = null; }
    const el = document.getElementById('amb-flash-el');
    if (el) el.classList.add('stopped');
    G.to(inner, { opacity:0, duration:1.4, delay:0.4, ease:'power2.in', onComplete: () => {
      inner.innerHTML = `<div style="text-align:center;padding:70px 0;font-family:monospace;color:rgba(180,200,255,0.1);font-size:11px;letter-spacing:.24em">. . . . .</div>`;
      G.set(inner, {opacity:1, y:0});
      G.fromTo(inner, {opacity:0}, {opacity:1, duration:0.6, delay:1.5,
        onComplete: () => setTimeout(_apcsa_hospital, 600)});
    }});
  }, 11500);
}

function _apcsa_hospital() {
  Engine.modifyStats({ stress:3, sleep:-2, gpa:-1 }); _flushStatToast();
  _sophShow(`
    <div class="soph-badge">KAISER MEDICAL CENTER · ROOM 7</div>
    <h1 class="soph-title" style="color:#b8d0f0;font-size:2.4rem">YOU WAKE UP.</h1>
    <div class="soph-hospital">
      <div class="soph-hospital-title">KAISER MEDICAL CENTER</div>
      <div class="monitor-line">
        <span class="monitor-pulse">♥</span>
        <span>PULSE &nbsp;72 BPM &nbsp;·&nbsp; BP 118/76 &nbsp;·&nbsp; O₂ 98%</span>
      </div>
      <div class="soph-scene" style="color:#c0d0e8;margin-top:14px">
        <p>White ceiling. The monitor beeps every second, steady. Your jaw feels like poured concrete and you can't open it.</p>
        <p>You didn't finish the exam. Greenstein posts a make-up on schoology and every person in that hallway saw it happen.</p>
      </div>
    </div>
    <div class="soph-stat-delta neg" style="margin-top:14px">GPA −1 &nbsp;·&nbsp; STRESS +3 &nbsp;·&nbsp; SLEEP −2</div>
    <div class="soph-nav" style="margin-top:24px"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_apcsa_final_done', 'soph_fainted');
}

// ════════════════════════════════════════════════════════
//  ROBOTICS EC  — interactive build mini-game
// ════════════════════════════════════════════════════════
window.showRobotics_EC = function() {
  Engine.setFlag('soph_robotics_started');
  const late = window.MYTH_EC_LATE;
  _sophShow(`
    <div class="soph-badge">ROOM 108 · ROBOTICS TEAM${late ? ' · <span style="color:#ff8060">LATE</span>' : ''}</div>
    <h1 class="soph-title" style="font-size:2.2rem">AFTER SCHOOL.</h1>
    <div class="soph-scene">
      <p>Vasquez's room looks like a hardware store exploded in a computer lab. Bins of servos, wires, half-assembled bots everywhere.</p>
      ${late ? '<p style="color:#ff8060;font-style:italic">You arrived late. Vasquez clocks you coming in. "You missed the brief."</p>' : ''}
    </div>
    <div class="soph-speaker">MR. VASQUEZ</div>
    <div class="soph-speech">"You're building a line-following bot for regionals. I need the chassis assembled — five components, in order. Watch the diagram."</div>
    <div class="soph-nav"><span class="soph-progress">1 / 3</span><button class="btn-primary" id="rb-start">START BUILD →</button></div>
  `);
  document.getElementById('rb-start').onclick = () => _robotics_build(late);
};

function _robotics_build(late) {
  // Component assembly mini-game: click components in the correct order within 18s
  const ORDER = ['chassis','motors','sensor','wiring','firmware'];
  const LABELS = { chassis:'🔩 CHASSIS', motors:'⚙ MOTORS', sensor:'👁 SENSOR', wiring:'🔌 WIRING', firmware:'💾 FIRMWARE' };
  let seq = [], errors = 0, timerID = null, timeLeft = 18;

  function render() {
    _sophShow(`
      <div class="soph-badge">ROOM 108 · BUILD SEQUENCE</div>
      <div class="soph-scene" style="text-align:center;padding:8px 0">
        <div style="font-size:0.8rem;color:#aaa;margin-bottom:6px;letter-spacing:.1em">ASSEMBLE IN ORDER → CHASSIS → MOTORS → SENSOR → WIRING → FIRMWARE</div>
        <div id="rb-timer" style="font-size:2rem;font-weight:700;color:#64dcff;letter-spacing:.12em;margin:8px 0">${timeLeft}s</div>
        <div id="rb-progress" style="font-size:1rem;color:#88eebb;min-height:1.5em">${seq.map(k=>LABELS[k]).join(' → ') || '...'}</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:14px 0" id="rb-components">
        ${ORDER.map(k => `<button class="soph-choice rb-part" id="rb-${k}" style="min-width:130px;padding:12px 8px;${seq.includes(k)?'opacity:0.3;pointer-events:none':''}">
          <span class="soph-choice-label" style="font-size:1.1rem">${LABELS[k]}</span>
        </button>`).join('')}
      </div>
      <div id="rb-error" style="color:#ff6060;font-size:0.85rem;min-height:1.2em;text-align:center"></div>
      <div class="soph-nav"><span class="soph-progress">2 / 3</span></div>
    `);
    // Wire buttons
    ORDER.forEach(k => {
      const btn = document.getElementById('rb-' + k);
      if (btn && !seq.includes(k)) {
        btn.onclick = () => {
          const expected = ORDER[seq.length];
          if (k === expected) {
            seq.push(k);
            document.getElementById('rb-progress').textContent = seq.map(x=>LABELS[x]).join(' → ');
            btn.style.opacity = '0.3'; btn.style.pointerEvents = 'none';
            btn.style.background = 'rgba(100,220,150,0.15)';
            if (seq.length === ORDER.length) {
              clearInterval(timerID);
              _robotics_build_done(errors, timeLeft, late);
            }
          } else {
            errors++;
            document.getElementById('rb-error').textContent = '✗ Wrong order — check the diagram!';
            btn.style.background = 'rgba(255,60,60,0.18)';
            setTimeout(() => { btn.style.background = ''; if(document.getElementById('rb-error')) document.getElementById('rb-error').textContent = ''; }, 700);
          }
        };
      }
    });
    // Start countdown
    timerID = setInterval(() => {
      timeLeft--;
      const tel = document.getElementById('rb-timer');
      if (tel) {
        tel.textContent = timeLeft + 's';
        tel.style.color = timeLeft <= 6 ? '#ff6060' : timeLeft <= 10 ? '#ffc040' : '#64dcff';
      }
      if (timeLeft <= 0) {
        clearInterval(timerID);
        _robotics_build_done(errors + (ORDER.length - seq.length), 0, late);
      }
    }, 1000);
  }
  render();
}

function _robotics_build_done(errors, timeLeft, late) {
  const perfect  = errors === 0 && timeLeft > 5;
  const decent   = errors <= 2;
  const narr = perfect
    ? 'Clean. Every component locked in under 15 seconds. Vasquez says nothing — which means he\'s impressed.'
    : decent
    ? 'A couple missteps but you finished it. Vasquez adjusts one connector. "Not bad for a first try."'
    : 'The build takes longer than it should. Vasquez walks over and re-does two connections. "Watch me."';
  const delta = perfect
    ? { extracurriculars:2, intelligence:1, gpa:0.2 }
    : decent
    ? { extracurriculars:1, intelligence:1 }
    : { extracurriculars:1, stress:1 };
  const deltaStr = perfect ? '+2 EC · +1 INT · GPA +0.2' : decent ? '+1 EC · +1 INT' : '+1 EC · +1 STRESS';
  Engine.modifyStats(delta); if (late) Engine.modifyStats({extracurriculars:-0.5}); _flushStatToast();

  _sophShow(`
    <div class="soph-badge">ROOM 108 · ROBOTICS TEAM</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-stat-delta${perfect?'':' '}">${deltaStr}${late ? ' · −0.5 EC (late)' : ''}</div>
    <div class="soph-speaker">MR. VASQUEZ</div>
    <div class="soph-speech">"Tuesdays and Thursdays. Regionals is February. The schedule is on the board."</div>
    <div class="soph-scene"><p>You stack the parts. The room smells like solder. It's kind of a good smell.</p></div>
    <div class="soph-nav"><span class="soph-progress">3 / 3</span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>
  `);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_robotics_done');
}

// ════════════════════════════════════════════════════════
//  FOOTBALL EC  — interactive sprint drill mini-game
// ════════════════════════════════════════════════════════
window.showFootball_EC = function() {
  Engine.setFlag('soph_football_started');
  const late = window.MYTH_EC_LATE;
  _sophShow(`
    <div class="soph-badge">ATHLETIC FIELD · VARSITY FOOTBALL${late ? ' · <span style="color:#ff8060">LATE</span>' : ''}</div>
    <h1 class="soph-title" style="font-size:2.2rem">FIRST PRACTICE.</h1>
    <div class="soph-scene">
      <p>The field smells like cut grass and sweat. Coach Thomas stands at the 40-yard line with a stopwatch.</p>
      ${late ? '<p style="color:#ff8060;font-style:italic">You jog in late. Thomas clocks you. "Conditioning after practice. You run extra."</p>' : ''}
    </div>
    <div class="soph-speaker">COACH THOMAS</div>
    <div class="soph-speech">"Forty-yard dash. Fastest today makes the depth chart. Tap LEFT and RIGHT as fast as you can — alternate feet. GO."</div>
    <div class="soph-nav"><span class="soph-progress">1 / 3</span><button class="btn-primary" id="fb-start">TAKE YOUR MARK →</button></div>
  `);
  document.getElementById('fb-start').onclick = () => _football_sprint(late);
};

function _football_sprint(late) {
  // Sprint drill: alternate tap ← → buttons as fast as possible in 5 seconds
  let taps = 0, nextExpected = 'L', done = false, timerID = null, timeLeft = 5;

  _sophShow(`
    <div class="soph-badge">ATHLETIC FIELD · SPRINT DRILL</div>
    <div class="soph-scene" style="text-align:center">
      <div style="font-size:0.8rem;color:#aaa;letter-spacing:.1em;margin-bottom:6px">ALTERNATE  ←  →  AS FAST AS YOU CAN</div>
      <div id="fb-timer" style="font-size:3rem;font-weight:700;color:#ffc040;letter-spacing:.1em">5</div>
      <div id="fb-taps" style="font-size:2rem;color:#88eebb;margin:6px 0">0 steps</div>
      <div id="fb-cue" style="font-size:1.8rem;font-weight:700;color:#64dcff;margin:10px 0;min-height:2.4rem">← LEFT</div>
    </div>
    <div style="display:flex;gap:16px;justify-content:center;margin:14px 0">
      <button id="fb-left"  style="padding:18px 32px;font-size:1.3rem;font-weight:700;background:rgba(60,120,220,0.25);border:2px solid #4488ff;border-radius:8px;color:#88bbff;cursor:pointer;min-width:120px">← LEFT</button>
      <button id="fb-right" style="padding:18px 32px;font-size:1.3rem;font-weight:700;background:rgba(220,120,60,0.25);border:2px solid #ff8844;border-radius:8px;color:#ffbb88;cursor:pointer;min-width:120px">RIGHT →</button>
    </div>
    <div class="soph-nav"><span class="soph-progress">2 / 3</span></div>
  `);

  function updateCue() {
    const cue = document.getElementById('fb-cue');
    if (cue) { cue.textContent = nextExpected === 'L' ? '← LEFT' : 'RIGHT →'; cue.style.color = nextExpected === 'L' ? '#64dcff' : '#ffaa44'; }
  }
  updateCue();

  function handleTap(dir) {
    if (done) return;
    const expected = nextExpected;
    if (dir === expected) {
      taps++;
      nextExpected = expected === 'L' ? 'R' : 'L';
      const tEl = document.getElementById('fb-taps'); if (tEl) tEl.textContent = taps + ' steps';
      updateCue();
      // Flash button green
      const btn = document.getElementById('fb-' + (dir === 'L' ? 'left' : 'right'));
      if (btn) { btn.style.background = 'rgba(80,220,120,0.35)'; setTimeout(()=>{ btn.style.background = dir==='L'?'rgba(60,120,220,0.25)':'rgba(220,120,60,0.25)'; }, 150); }
    } else {
      // Wrong key — flash red
      const btn = document.getElementById('fb-' + (dir === 'L' ? 'left' : 'right'));
      if (btn) { btn.style.background = 'rgba(220,60,60,0.35)'; setTimeout(()=>{ btn.style.background = dir==='L'?'rgba(60,120,220,0.25)':'rgba(220,120,60,0.25)'; }, 150); }
    }
  }

  document.getElementById('fb-left').onclick  = () => handleTap('L');
  document.getElementById('fb-right').onclick = () => handleTap('R');

  // Keyboard support (← and →)
  function kbHandler(e) {
    if (e.key === 'ArrowLeft')  handleTap('L');
    if (e.key === 'ArrowRight') handleTap('R');
  }
  document.addEventListener('keydown', kbHandler);

  timerID = setInterval(() => {
    timeLeft--;
    const tel = document.getElementById('fb-timer');
    if (tel) { tel.textContent = timeLeft; tel.style.color = timeLeft <= 2 ? '#ff6060' : '#ffc040'; }
    if (timeLeft <= 0) {
      clearInterval(timerID); done = true;
      document.removeEventListener('keydown', kbHandler);
      _football_sprint_done(taps, late);
    }
  }, 1000);
}

function _football_sprint_done(taps, late) {
  const elite = taps >= 14;
  const good  = taps >= 10;
  const time  = elite ? '5.1s' : good ? '5.5s' : '5.9s';
  const narr  = elite
    ? `${taps} alternating steps. Pure acceleration. Thomas's stopwatch reads ${time}. He writes it down without a word.`
    : good
    ? `${taps} steps. Solid. ${time} — you're in the top half. Thomas nods: "Good form. Build on it."`
    : `${taps} steps. ${time}. Thomas: "You've got more in there. We'll find it."`;
  const delta = elite ? { athleticism:3, physique:2 } : good ? { athleticism:2, physique:1 } : { athleticism:1, physique:1 };
  const ds    = elite ? '+3 ATH · +2 PHY' : good ? '+2 ATH · +1 PHY' : '+1 ATH · +1 PHY';
  Engine.modifyStats(delta); if (late) Engine.modifyStats({ athleticism:-1 }); _flushStatToast();

  _sophShow(`
    <div class="soph-badge">ATHLETIC FIELD · VARSITY FOOTBALL</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-stat-delta">${ds}${late ? ' · −1 ATH (late)' : ''}</div>
    <div class="soph-speaker">COACH THOMAS</div>
    <div class="soph-speech">"Route running. Five-yard out. Corner is live. Run it clean — or sell the fake. Your call."</div>
    <div class="soph-prompt">HOW DO YOU RUN THE ROUTE?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="rt-a"><span class="soph-choice-label">SELL THE FAKE — head juke into the break</span><span class="soph-choice-hint">High risk, high reward. Corner might bite.</span></button>
      <button class="soph-choice" id="rt-b"><span class="soph-choice-label">RUN IT EXACTLY AS DRAWN</span><span class="soph-choice-hint">Discipline. Thomas's baseline standard.</span></button>
    </div>
    <div class="soph-nav"><span class="soph-progress">3 / 3</span></div>
  `);
  document.getElementById('rt-a').onclick = () => {
    Engine.modifyStats({ athleticism:2, toxicity:1 }); _flushStatToast();
    _football_end('You sell the fake hard. Corner bites. Thomas whistles twice. "Do it again."', '+2 ATH · +1 TOX');
  };
  document.getElementById('rt-b').onclick = () => {
    Engine.modifyStats({ athleticism:1, integrity:1 }); _flushStatToast();
    _football_end('Clean break at the cone. Thomas: "That\'s the standard. Every time."', '+1 ATH · +1 INT');
  };
}

function _football_end(narr, delta) {
  _sophShow(`
    <div class="soph-badge">ATHLETIC FIELD · VARSITY FOOTBALL</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-stat-delta">${delta}</div>
    <div class="soph-scene"><p>Practice ends with conditioning — ten 100-yard gassers. By the showers you can barely lift your arms. But something about it felt right.</p></div>
    <div class="soph-nav"><span class="soph-progress">3 / 3</span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>
  `);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_football_done');
}

// ════════════════════════════════════════════════════════
//  STUDIES CLASS 1
// ════════════════════════════════════════════════════════
window.showStudies_Class1 = function() { Engine.setFlag('soph_studies1_started'); _studies1_beat1(); };
function _studies1_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div><h1 class="soph-title">FIRST DAY.</h1>
    <div class="soph-speaker">MR. NGUYEN</div><div class="soph-speech">"New seats today. Gets you out of your comfort zone."</div>
    <div class="soph-scene"><p>You find your name. Row three, second from the left. You sit. And then — <em>they</em> sit next to you.</p></div>
    <div class="soph-nav"><span class="soph-progress">1 / 5</span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = _studies1_beat2;
}
function _studies1_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>You've seen them around. The kind of person you've looked at twice and then pretended you hadn't.</p></div>
    <div class="soph-speaker">MR. NGUYEN</div><div class="soph-speech">"Turn to the person next to you. Thirty seconds. Learn their name and one thing you have in common. Go."</div>
    <div class="soph-prompt">WHAT DO YOU SAY FIRST?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="st-a"><span class="soph-choice-label">"HEY — I'M ${player.name || 'ME'}."</span></button>
      <button class="soph-choice" id="st-b"><span class="soph-choice-label">"YOU HAVE THAT CLASS WITH MR. GREENSTEIN, RIGHT?"</span></button>
      <button class="soph-choice" id="st-c"><span class="soph-choice-label">WAIT FOR THEM TO GO FIRST</span></button>
    </div><div class="soph-nav"><span class="soph-progress">2 / 5</span></div>`);
  document.getElementById('st-a').onclick = () => { Engine.modifyStats({relationships:1,integrity:1}); _flushStatToast(); _studies1_beat3('"Oh — yeah. Hey." They smile once. Something shifted.'); };
  document.getElementById('st-b').onclick = () => { Engine.modifyStats({relationships:1,selfAwareness:1}); _flushStatToast(); _studies1_beat3('"Yeah, Greenstein is brutal." You both laugh. Nguyen says time.'); };
  document.getElementById('st-c').onclick = () => { Engine.modifyStats({selfAwareness:1}); _flushStatToast(); _studies1_beat3('"I\'m Jordan." You give your name back.'); };
}
function _studies1_beat3(narr) {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-speaker">MR. NGUYEN</div><div class="soph-speech">"Open to page 44. I want a thesis from every pair by the end of class."</div>
    <div class="soph-prompt">HOW DO YOU WORK WITH THEM?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="st2-a"><span class="soph-choice-label">TAKE THE LEAD</span></button>
      <button class="soph-choice" id="st2-b"><span class="soph-choice-label">ASK WHAT THEY THINK FIRST</span></button>
      <button class="soph-choice" id="st2-c"><span class="soph-choice-label">SPLIT THE WORK</span></button>
    </div><div class="soph-nav"><span class="soph-progress">3 / 5</span></div>`);
  document.getElementById('st2-a').onclick = () => { Engine.modifyStats({gpa:1,relationships:-1}); _flushStatToast(); _studies1_beat4('You drive. Strong thesis but they seem distant.','+1 GPA · −1 REL'); };
  document.getElementById('st2-b').onclick = () => { Engine.modifyStats({relationships:2,gpa:1}); _flushStatToast(); _studies1_beat4('Their angle is better than yours. The thesis is good. So is the conversation.','+2 REL · +1 GPA'); };
  document.getElementById('st2-c').onclick = () => { Engine.modifyStats({gpa:1}); _flushStatToast(); _studies1_beat4('Efficient. Professional. Transactional.','+1 GPA'); };
}
function _studies1_beat4(narr, delta) {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>${narr}</p></div><div class="soph-stat-delta">${delta||''}</div>
    <div class="soph-speaker">JORDAN</div><div class="soph-speech">"Same seats next class, right?"</div>
    <div class="soph-choices">
      <button class="soph-choice" id="st3-a"><span class="soph-choice-label">"YEAH. SEE YOU THEN."</span></button>
      <button class="soph-choice" id="st3-b"><span class="soph-choice-label">"THAT WASN'T AS BAD AS I THOUGHT."</span></button>
      <button class="soph-choice" id="st3-c"><span class="soph-choice-label">JUST SMILE AND NOD</span></button>
    </div><div class="soph-nav"><span class="soph-progress">4 / 5</span></div>`);
  document.getElementById('st3-a').onclick = () => { Engine.modifyStats({relationships:1}); _flushStatToast(); _studies1_beat5('They smile once before the door closes.'); };
  document.getElementById('st3-b').onclick = () => { Engine.modifyStats({relationships:2}); _flushStatToast(); _studies1_beat5('They actually laugh. "Same." Then they\'re gone. The day feels different.'); };
  document.getElementById('st3-c').onclick = () => { _studies1_beat5('They give you one look and leave.'); };
}
function _studies1_beat5(narr) {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-nav"><span class="soph-progress">5 / 5</span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_studies1_done');
}

// ════════════════════════════════════════════════════════
//  STUDIES CLASS 2 — Group project
// ════════════════════════════════════════════════════════
window.showStudies_Class2 = function() { Engine.setFlag('soph_studies2_started'); _studies2_beat1(); };
function _studies2_beat1() {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD — WEEK 3</div><h1 class="soph-title">GROUP DAY.</h1>
    <div class="soph-scene"><p>Different seats. Jordan is across the room. Your group: Tyler (hasn't opened his notebook), Camille (visibly on her phone), Devon (shrugged when groups were announced).</p></div>
    <div class="soph-speaker">MR. NGUYEN</div><div class="soph-speech">"Thirty minutes. Outline the project. I'm walking around."</div>
    <div class="soph-nav"><span class="soph-progress">1 / 4</span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = _studies2_beat2;
}
function _studies2_beat2() {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>Five minutes in. Tyler is talking about something unrelated. Camille contributed two words. Devon is staring at the wall. The outline is blank. 25 minutes left.</p></div>
    <div class="soph-prompt">WHAT DO YOU DO?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="gp-a"><span class="soph-choice-label">JUST DO IT YOURSELF</span><span class="soph-choice-hint">Write the whole outline. At least it gets done.</span></button>
      <button class="soph-choice" id="gp-b"><span class="soph-choice-label">TELL MR. NGUYEN YOUR GROUP ISN'T WORKING</span></button>
      <button class="soph-choice" id="gp-c"><span class="soph-choice-label">ASSIGN TASKS OUT LOUD</span><span class="soph-choice-hint">"Tyler, intro. Camille, section two." Make it direct.</span></button>
    </div><div class="soph-nav"><span class="soph-progress">2 / 4</span></div>`);
  document.getElementById('gp-a').onclick = () => { Engine.modifyStats({gpa:1,stress:2,integrity:-1}); _flushStatToast(); _studies2_beat3('You write everything. Nguyen glances at you. He knows. The outline is the best in the room. You\'re also furious.','+1 GPA · +2 STRESS · −1 INT'); };
  document.getElementById('gp-b').onclick = () => { Engine.modifyStats({integrity:2,stress:-1,toxicity:1}); _flushStatToast(); _studies2_beat3('Nguyen comes over. Doesn\'t say anything — just watches. Suddenly everyone has opinions.','+2 INT · −1 STRESS · +1 TOX'); };
  document.getElementById('gp-c').onclick = () => { Engine.modifyStats({friendships:1,extracurriculars:1,stress:1}); _flushStatToast(); _studies2_beat3('"Tyler — intro. Camille — sources. Devon — conclusion." It works. Barely.','+1 FRND · +1 EC · +1 STRESS'); };
}
function _studies2_beat3(narr, delta) {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>${narr}</p></div>
    <div class="soph-nav"><span class="soph-progress">3 / 4</span><button class="btn-primary" id="soph-next">NEXT →</button></div>`);
  document.getElementById('soph-next').onclick = _studies2_beat4;
}
function _studies2_beat4() {
  _sophShow(`<div class="soph-badge">ROOM 119 · STUDIES PERIOD</div>
    <div class="soph-scene"><p>Bell rings. Jordan catches your eye from across the room and mouths: <em>"how was your group?"</em></p><p>You make a face. They laugh.</p></div>
    <div class="soph-nav"><span class="soph-progress">4 / 4</span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_studies2_done');
}

// ════════════════════════════════════════════════════════
//  PHYSICS CLASS 1 — EGG DROP
// ════════════════════════════════════════════════════════
window.showPhysics_Class1 = function() { Engine.setFlag('soph_physics1_started'); _phys1_intro(); };
function _phys1_intro() {
  _sophShow(`<div class="soph-badge">ROOM 203 · AP PHYSICS 1</div><h1 class="soph-title">EGG DROP DAY.</h1>
    <div class="soph-scene"><p>Mr. Birdsong is standing on a desk holding a raw egg. He's smiling in a way that should concern you.</p></div>
    <div class="soph-speaker">Mr. BIRDSONG</div><div class="soph-speech">"You design a protective device. It drops from the second-floor balcony. Egg survives — full marks. Egg dies — partial. No device — zero."</div>
    <div class="soph-scene"><p>Materials table: bubble wrap, straws, rubber bands, cotton balls, a plastic bag, cardboard, tape, foam pieces.</p></div>
    <div class="soph-nav"><span class="soph-progress">Build Phase</span><button class="btn-primary" id="soph-next">START BUILDING →</button></div>`);
  document.getElementById('soph-next').onclick = _phys1_build;
}
let _eggScore = 0;
function _phys1_build() {
  _eggScore = 0;
  _sophShow(`<div class="soph-badge">ROOM 203 — EGG DROP · BUILD PHASE</div>
    <div class="soph-prompt">OUTER CASING:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">BUBBLE WRAP + TAPE (double layer)</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">CARDBOARD BOX</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">PLASTIC BAG</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 1 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _eggScore += parseInt(b.dataset.pts); _phys1_build2(); }; });
}
function _phys1_build2() {
  _sophShow(`<div class="soph-badge">ROOM 203 — EGG DROP · BUILD PHASE</div>
    <div class="soph-prompt">CUSHIONING:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">COTTON BALLS (packed tight)</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">FOAM PIECES</span></button>
      <button class="soph-choice" data-pts="1"><span class="soph-choice-label">STRAWS (crumple zone)</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 2 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _eggScore += parseInt(b.dataset.pts); _phys1_build3(); }; });
}
function _phys1_build3() {
  _sophShow(`<div class="soph-badge">ROOM 203 — EGG DROP · BUILD PHASE</div>
    <div class="soph-prompt">LANDING SYSTEM:</div>
    <div class="soph-choices">
      <button class="soph-choice" data-pts="3"><span class="soph-choice-label">PARACHUTE (plastic bag + rubber bands)</span></button>
      <button class="soph-choice" data-pts="2"><span class="soph-choice-label">RUBBER BAND SHOCK ABSORBERS</span></button>
      <button class="soph-choice" data-pts="0"><span class="soph-choice-label">NOTHING — THE CUSHION IS ENOUGH</span></button>
    </div><div class="soph-nav"><span class="soph-progress">Step 3 / 3</span></div>`);
  document.querySelectorAll('#soph-inner .soph-choice').forEach(b => { b.onclick = () => { _eggScore += parseInt(b.dataset.pts); _phys1_drop(); }; });
}
function _phys1_drop() {
  // Harsher grading: max=9, thresholds tightened
  // 9 = perfect, 7-8 = good, 5-6 = marginal, 3-4 = poor, 2 = catastrophic
  let grade, gpaD, stressD, resultColor, resultLine, torresLine;
  if (_eggScore === 9) {
    grade='PERFECT'; gpaD=2; stressD=-1; resultColor='#6bcb77';
    resultLine='✓ EGG SURVIVED — FLAWLESS.';
    torresLine='"Textbook execution. Full marks. Both of them."';
  } else if (_eggScore >= 7) {
    grade='GOOD'; gpaD=1; stressD=0; resultColor='#a8d8a0';
    resultLine='✓ EGG SURVIVED — MINOR HAIRLINE CRACK.';
    torresLine='"Survived, technically. Some energy transfer at impact. Decent."';
  } else if (_eggScore >= 5) {
    grade='MARGINAL'; gpaD=0; stressD=1; resultColor='#f7b731';
    resultLine='~ EGG CRACKED — PARTIAL CREDIT ONLY.';
    torresLine='"Cracked. Your cushioning was insufficient. Half marks."';
  } else if (_eggScore >= 3) {
    grade='POOR'; gpaD=-1; stressD=2; resultColor='#fc9d5a';
    resultLine='✗ EGG BROKEN — MINIMAL CREDIT.';
    torresLine='"That\'s a failed design. You get one point for showing up."';
  } else {
    grade='CATASTROPHIC'; gpaD=-2; stressD=3; resultColor='#fc7b54';
    resultLine='✗ EGG DESTROYED ON IMPACT.';
    torresLine='"Did you even try? Zero. Log it as a learning experience." The class winces.';
  }
  Engine.modifyStats({ gpa: gpaD, stress: stressD, extracurriculars: 1 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">ROOM 203 — EGG DROP · THE DROP</div>
    <div class="soph-scene"><p>Birdsong lines everyone up at the second-floor balcony. He counts down. Three seconds of silence.</p></div>
    <div class="soph-scene" style="font-size:20px;text-align:center;padding:14px 0;color:${resultColor};font-weight:bold;letter-spacing:0.04em">
      ${resultLine}
    </div>
    <div class="soph-scene"><p style="color:#c8bfa8;font-size:13px;font-style:italic">Score: ${_eggScore}/9</p></div>
    <div class="soph-speaker">MR. BIRDSONG</div><div class="soph-speech">${torresLine}</div>
    <div class="soph-stat-delta ${gpaD>=0?'':'neg'}">GPA ${gpaD>=0?'+':''}${gpaD} · Stress ${stressD>=0?'+':''}${stressD} · +1 EC</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_physics1_done');
}

// ════════════════════════════════════════════════════════
//  PHYSICS CLASS 2 — GREAT AMERICA FIELD TRIP
// ════════════════════════════════════════════════════════
window.showPhysics_FieldTrip = function() { Engine.setFlag('soph_physics_trip_started'); _fieldtrip_intro(); };
function _fieldtrip_intro() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH · AP PHYSICS 1</div><h1 class="soph-title">SURPRISE.</h1>
    <div class="soph-speaker">MR. BIRDSONG</div><div class="soph-speech">"Field trip. Friday. Great America. Permission slips due tomorrow. This is a physics lab — but yes, you can ride the rides."</div>
    <div class="soph-nav"><span class="soph-progress">Friday morning.</span><button class="btn-primary" id="soph-next">ARRIVE AT GREAT AMERICA →</button></div>`);
  document.getElementById('soph-next').onclick = _fieldtrip_park;
}
function _fieldtrip_park() {
  _gaVisited = new Set();
  _sophShow(`<div class="soph-badge">GREAT AMERICA — SANTA CLARA, CA</div><h1 class="soph-title" style="color:#f7b731">YOU'RE HERE.</h1>
    <div class="soph-scene"><p>Birdsong gives you a worksheet and says <em>"meet at the front gate at 3:45, no exceptions."</em> Then he basically lets you go.</p></div>
    <div style="margin:18px 0"><canvas id="ga-map" width="520" height="300" style="border:1px solid rgba(200,180,120,0.3);border-radius:6px;display:block;cursor:pointer;max-width:100%"></canvas></div>
    <div id="ga-ride-info" style="min-height:54px;font-size:13px;color:#c8bfa8;padding:6px 0"></div>
    <div class="soph-nav"><span class="soph-progress" id="ga-count-label">Click a ride to visit it.</span><button class="btn-primary" id="ga-done-btn" disabled>HEAD BACK →</button></div>`);
  _buildGAMap();
}
const GA_RIDES = [
  { id:'demon',     label:'The Demon',    x:50,  y:40,  w:100,h:55, color:'#8B2020', desc:'Classic steel coaster. Four inversions. 3.5g.',         stats:{athleticism:1,stress:1,happiness:2} },
  { id:'gold',      label:'Gold Striker', x:190, y:35,  w:110,h:60, color:'#8B6914', desc:'Tallest wooden coaster on the West Coast. 103 ft drop.', stats:{athleticism:2,stress:2,happiness:3} },
  { id:'flight',    label:'Flight Deck',  x:340, y:40,  w:110,h:55, color:'#1a4a7a', desc:'Inverted coaster. Feet dangle. 4g on the loop.',         stats:{athleticism:2,stress:3,happiness:2,sleep:-1} },
  { id:'log',       label:'Loggers Run',  x:50,  y:155, w:100,h:55, color:'#2a6e2a', desc:'Log flume. A 45-foot plunge. You will get soaked.',       stats:{happiness:2,stress:-1} },
  { id:'skytower',  label:'Sky Tower',    x:190, y:160, w:100,h:55, color:'#4a3a8a', desc:'Observation tower. 30 seconds up. View of the whole bay.',stats:{selfAwareness:2,stress:-2,happiness:1} },
  { id:'vortex',    label:'Vortex',       x:340, y:155, w:110,h:55, color:'#7a3a20', desc:'Stand-up coaster. Your quads will not thank you.',        stats:{athleticism:2,physique:1,stress:2} },
];
let _gaVisited = new Set();
function _buildGAMap() {
  const canvas = document.getElementById('ga-map');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function draw() {
    ctx.fillStyle = '#0d1520'; ctx.fillRect(0,0,520,300);
    ctx.strokeStyle = 'rgba(200,180,100,0.15)'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(260,0); ctx.lineTo(260,300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,135); ctx.lineTo(520,135); ctx.stroke();
    ctx.fillStyle='rgba(201,145,58,0.6)'; ctx.font='bold 10px monospace'; ctx.fillText('GREAT AMERICA — SANTA CLARA',10,268);
    GA_RIDES.forEach(r => {
      const vis = _gaVisited.has(r.id);
      ctx.fillStyle = vis ? r.color+'55' : r.color;
      ctx.strokeStyle = vis ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)';
      ctx.lineWidth = vis ? 1 : 2;
      _gaRRect(ctx,r.x,r.y,r.w,r.h,5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = vis ? 'rgba(255,255,255,0.35)' : '#fff';
      ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      const words = r.label.split(' ');
      words.forEach((w,i) => ctx.fillText(w, r.x+r.w/2, r.y+r.h/2-(words.length-1)*6+i*13));
      if (vis) { ctx.fillStyle='#6bcb77'; ctx.font='13px sans-serif'; ctx.fillText('✓',r.x+r.w-10,r.y+14); }
      ctx.textAlign='left';
    });
  }
  draw();
  canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left)*(520/rect.width), my = (e.clientY-rect.top)*(300/rect.height);
    const hit = GA_RIDES.find(r => mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h);
    if (!hit || _gaVisited.has(hit.id)) return;
    const info = document.getElementById('ga-ride-info');
    Object.entries(hit.stats).forEach(([k,v]) => Engine.modifyStat(k,v)); _flushStatToast();
    _gaVisited.add(hit.id); draw();
    const n = _gaVisited.size;
    const label = document.getElementById('ga-count-label');
    const btn = document.getElementById('ga-done-btn');
    // Update info box
    let warningHtml = '';
    if (n === 4) {
      warningHtml = `<div style="color:#f7b731;font-size:12px;margin-top:6px;font-weight:bold">⚠ One more and you might miss the bus. Birdsong said 3:45, no exceptions.</div>`;
    } else if (n > 4) {
      warningHtml = `<div style="color:#fc7b54;font-size:12px;margin-top:6px;font-weight:bold">🚌 You're WAY over time. The bus leaves in minutes.</div>`;
    }
    if (info) info.innerHTML = `<strong style="color:#f7b731">${hit.label}</strong> — ${hit.desc}<br><span style="color:#6bcb77;font-size:11px;font-family:monospace">${Object.entries(hit.stats).map(([k,v])=>`${v>0?'+':''}${v} ${STAT_LABELS[k]||k}`).join(' · ')}</span>${warningHtml}`;
    // Update progress label
    if (label) {
      if (n <= 4) label.textContent = `${n} ride${n>1?'s':''} visited — looking good.`;
      else label.innerHTML = `<span style="color:#fc7b54;font-weight:bold">${n} rides — you're running late!</span>`;
    }
    if (btn) btn.disabled = false;
  };
  document.getElementById('ga-done-btn').onclick = () => {
    if (_gaVisited.size > 4) { _fieldtrip_missedbus(); return; }
    Engine.modifyStats({happiness:2,stress:-1}); _flushStatToast();
    _sophDone('soph_physics_trip_done');
  };
}
function _fieldtrip_missedbus() {
  Engine.modifyStats({ happiness: -2, stress: 4, gpa: -1, relationships: -2 }); _flushStatToast();
  _sophShow(`<div class="soph-badge">GREAT AMERICA — 4:07 PM</div>
    <h1 class="soph-title" style="color:#fc7b54">YOU MISSED THE BUS.</h1>
    <div class="soph-scene"><p>You sprint to the front gate — lungs burning, worksheet flying out of your hands. The parking lot is empty. The bus is gone.</p></div>
    <div class="soph-scene"><p>A police officer points to a folded note taped to the gate post. <em>"Called your emergency contact. Mr. Birdsong."</em></p></div>
    <div class="soph-speaker">MR. BIRDSONG (via phone)</div>
    <div class="soph-speech">"3:45. I said 3:45. I'm turning around, but this is going in your file. One more stunt like this and I'm pulling your lab grade entirely."</div>
    <div class="soph-scene"><p>The ride home is silent. Birdsong doesn't say another word. You stare out the window with ${_gaVisited.size} rides worth of guilt and a dead phone battery.</p></div>
    <div class="soph-stat-delta neg">GPA −1 · Stress +4 · Happiness −2 · Relationships −2</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_physics_trip_done', 'missed_bus');
}
function _gaRRect(ctx,x,y,w,h,r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

// ════════════════════════════════════════════════════════
//  BRAWL STARS EC (ESPORTS)
// ════════════════════════════════════════════════════════
window.showBrawlStars_EC = function() { Engine.setFlag('soph_brawl_started'); _brawl_intro(); };
window._brawlTournamentOnly = function() {
  Engine.setFlag('brawl_tournament');
  _sophShow(`<div class="soph-badge">BRAWL STARS TOURNAMENT · BRACKET OPENS</div><h1 class="soph-title">LET'S GO.</h1>
    <div class="soph-scene"><p>32 players. Single elimination. Okafor pulls up the bracket on his phone. Your first-round opponent: ranked 14th in the region.</p></div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="brawl-go">START ROUND 1 →</button></div>`);
  document.getElementById('brawl-go').onclick = () => _brawl_tournament(1, 32);
};
const _RPS = ['ROCK','PAPER','SCISSORS'];
function _rpsWin(p,c) { if(p===c) return 'tie'; if((p==='ROCK'&&c==='SCISSORS')||(p==='PAPER'&&c==='ROCK')||(p==='SCISSORS'&&c==='PAPER')) return 'win'; return 'lose'; }
function _brawl_intro() {
  _sophShow(`<div class="soph-badge">ROOM 102 · ESPORTS CLUB</div><h1 class="soph-title">AFTER SCHOOL.</h1>
    <div class="soph-scene"><p>Mr. Okafor's room has six gaming stations. It smells like energy drinks. You join the Brawl Stars team.</p></div>
    <div class="soph-speaker">MR. OKAFOR</div><div class="soph-speech">"There's a 32-player single elimination tournament this Saturday. Online. You want in?"</div>
    <div class="soph-prompt">DO YOU ENTER?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="brawl-yes"><span class="soph-choice-label">YES — COMPETE</span><span class="soph-choice-hint">32-player bracket. Win rounds, earn more stats.</span></button>
      <button class="soph-choice" id="brawl-no"><span class="soph-choice-label">NO — JUST PRACTICE</span><span class="soph-choice-hint">Less pressure. Half the gains.</span></button>
    </div>`);
  document.getElementById('brawl-yes').onclick = () => { Engine.setFlag('brawl_tournament'); _brawl_tournament(1,32); };
  document.getElementById('brawl-no').onclick  = () => {
    Engine.modifyStats({extracurriculars:1,intelligence:1}); _flushStatToast();
    _sophShow(`<div class="soph-badge">ESPORTS CLUB — PRACTICE</div><div class="soph-scene"><p>Scrimmages for two hours. Solid practice.</p></div><div class="soph-stat-delta">+1 EC · +1 INT</div><div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
    document.getElementById('soph-done').onclick = () => _sophDone('soph_brawl_done');
  };
}
function _brawl_tournament(round, remaining) {
  const names = {1:'ROUND OF 32',2:'ROUND OF 16',4:'QUARTERFINALS',8:'SEMIFINALS',16:'GRAND FINAL'};
  const cpu = _RPS[Math.floor(Math.random()*3)];
  _sophShow(`<div class="soph-badge">BRAWL STARS · ${names[round]||'ROUND '+round}</div>
    <div class="soph-scene"><p>${remaining} players remain. Your opponent loads in.</p></div>
    <div class="soph-prompt">YOUR MOVE:</div>
    <div class="soph-choices">${_RPS.map(o=>`<button class="soph-choice rps-btn" data-pick="${o}"><span class="soph-choice-label">${o}</span></button>`).join('')}</div>`);
  document.querySelectorAll('.rps-btn').forEach(b => {
    b.onclick = () => {
      const pick = b.dataset.pick;
      const r = _rpsWin(pick, cpu);
      if (r === 'win') {
        _brawl_roundWin(round, remaining, pick, cpu);
      } else if (r === 'tie') {
        // Show tie feedback, then auto-rematch after 1.8s — no re-clicking required
        _sophShow(`<div class="soph-badge">BRAWL STARS · ${names[round]||'ROUND '+round} — TIE</div>
          <div class="soph-scene" style="text-align:center;padding:18px 0">
            <div style="font-size:2rem;font-weight:bold;color:#f7b731">${pick} vs ${cpu}</div>
            <div style="font-size:1.1rem;margin-top:10px;color:#c8bfa8">SUDDEN DEATH REMATCH</div>
            <div style="font-size:0.85rem;margin-top:8px;color:#a09880">Replaying automatically…</div>
          </div>`);
        setTimeout(() => _brawl_tournament(round, remaining), 1800);
      } else {
        _brawl_roundLose(round, pick, cpu);
      }
    };
  });
}
function _brawl_roundWin(round, remaining, pick, cpu) {
  Engine.modifyStats({extracurriculars:1,intelligence:1,friendships:1}); _flushStatToast();
  const nextRound = round*2, nextRemaining = Math.floor(remaining/2), isFinal = nextRound > 16;
  _sophShow(`<div class="soph-badge">BRAWL STARS · WIN</div>
    <div class="soph-scene"><p><strong style="color:#f7b731">${pick}</strong> beats <strong style="color:#fc7b54">${cpu}</strong>. ${isFinal?'You win the tournament. The chat explodes. Okafor stands up from his desk.':`You advance. ${nextRemaining} players left.`}</p></div>
    <div class="soph-stat-delta">+1 EC · +1 INT · +1 FRIENDSHIPS</div>
    <div class="soph-nav"><span></span>${isFinal?`<button class="btn-primary" id="brawl-done">CLAIM VICTORY →</button>`:`<button class="btn-primary" id="brawl-next">NEXT ROUND →</button>`}</div>`);
  if (isFinal) {
    document.getElementById('brawl-done').onclick = () => { Engine.modifyStats({extracurriculars:2,friendships:2,intelligence:2}); _flushStatToast(); _sophDone('brawl_champion', 'soph_brawl_done'); };
  } else {
    document.getElementById('brawl-next').onclick = () => _brawl_tournament(nextRound, nextRemaining);
  }
}
function _brawl_roundLose(round, pick, cpu) {
  Engine.modifyStats({extracurriculars:1,intelligence:1}); _flushStatToast();
  _sophShow(`<div class="soph-badge">BRAWL STARS · ELIMINATED</div>
    <div class="soph-scene"><p><strong style="color:#f7b731">${pick}</strong> loses to <strong style="color:#6bcb77">${cpu}</strong>. ${Math.log2(round)===0?'First round exit.':'You made it ' + Math.log2(round+1) + ' rounds in. That\'s something.'}</p></div>
    <div class="soph-stat-delta">+1 EC · +1 INT</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('soph_brawl_done');
}

// ════════════════════════════════════════════════════════
//  FITNESS JOURNEY
// ════════════════════════════════════════════════════════
window.showFitnessJourney = function() { Engine.setFlag('fitness_started'); _fitness_offer(); };
function _fitness_offer() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH · GYM</div><h1 class="soph-title">THE GYM.</h1>
    <div class="soph-scene"><p>Coach Thomas stops you after PE. "You've got potential. The weight room's open after school Monday through Thursday. It's not required. But you can tell who uses it."</p></div>
    <div class="soph-prompt">DO YOU WANT TO START GOING TO THE GYM?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="fit-yes"><span class="soph-choice-label">YES — START A ROUTINE</span></button>
      <button class="soph-choice" id="fit-no"><span class="soph-choice-label">NOT RIGHT NOW</span></button>
    </div>`);
  document.getElementById('fit-yes').onclick = _fitness_commitment;
  document.getElementById('fit-no').onclick   = () => _sophDone();
}
function _fitness_commitment() {
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH · GYM</div>
    <div class="soph-prompt">HOW MUCH TIME CAN YOU COMMIT?</div>
    <div class="soph-choices">
      <button class="soph-choice" id="fit-low"><span class="soph-choice-label">LOW — 1 day/week</span><span class="soph-choice-hint">Easy to keep. Slow gains.</span></button>
      <button class="soph-choice" id="fit-med"><span class="soph-choice-label">MEDIUM — 3 days/week</span><span class="soph-choice-hint">Balanced. Visible results in a month.</span></button>
      <button class="soph-choice" id="fit-high"><span class="soph-choice-label">HIGH — 5 days/week</span><span class="soph-choice-hint">Serious. Costs time and energy.</span></button>
    </div>`);
  document.getElementById('fit-low').onclick  = () => _fitness_workout('low');
  document.getElementById('fit-med').onclick  = () => _fitness_workout('medium');
  document.getElementById('fit-high').onclick = () => _fitness_workout('high');
}
function _fitness_workout(level) {
  const o = { low:{stats:{physique:1,athleticism:1},narr:'One session a week. Your energy levels up slightly after a month.'}, medium:{stats:{physique:2,athleticism:2,sleep:1,stress:-1},narr:'Three days a week. You see actual change. Your sleep improves too.'}, high:{stats:{physique:3,athleticism:3,sleep:-1,stress:2},narr:'Five days a week. Best shape of your life. Also exhausted.'} }[level];
  Engine.modifyStats(o.stats); _flushStatToast();
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH · GYM</div>
    <div class="soph-scene"><p>${o.narr}</p></div>
    <div class="soph-stat-delta">${Object.entries(o.stats).map(([k,v])=>`${v>0?'+':''}${v} ${STAT_LABELS[k]||k}`).join(' · ')}</div>
    <div class="soph-nav"><span></span><button class="btn-primary" id="soph-done">CONTINUE →</button></div>`);
  document.getElementById('soph-done').onclick = () => _sophDone('fitness_done');
}

// ════════════════════════════════════════════════════════
//  SOPHOMORE YEAR END
// ════════════════════════════════════════════════════════
window.showSophYearEnd = function() {
  const start = window.MYTH_START_STATS || {}, cur = Engine.getState().stats;
  _sophShow(`<div class="soph-badge">MONTA VISTA HIGH SCHOOL · END OF SOPHOMORE YEAR</div><h1 class="soph-title">SOPHOMORE YEAR DONE.</h1>
    <div class="soph-scene"><p>Two years in. You know the campus now — the rhythms, the people, the unspoken rules. Something changed this year.</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;margin:18px 0">
      ${Object.entries(cur).map(([k,v]) => {
        const d = Math.round((v-(start[k]??v))*10)/10;
        const pct = v/10*100, bc = pct>=80?'#6bcb77':pct>=50?'#f7b731':'#fc7b54';
        return `<div><div style="display:flex;justify-content:space-between;font-family:monospace;font-size:10px;color:#a89878;margin-bottom:3px"><span>${STAT_LABELS[k]}</span><span style="color:${bc}">${v.toFixed(1)}${d!==0?` <span style="color:${d>0?'#6bcb77':'#fc7b54'}">(${d>0?'+':''}${d})</span>`:''}</span></div><div style="background:rgba(255,255,255,0.08);border-radius:2px;height:4px"><div style="width:${pct}%;height:100%;background:${bc};border-radius:2px"></div></div></div>`;
      }).join('')}
    </div>
    <div class="soph-nav" style="margin-top:24px"><span class="soph-progress">JUNIOR YEAR AWAITS.</span><button class="btn-primary" id="soph-yr-done">ENTER JUNIOR YEAR →</button></div>`);
  document.getElementById('soph-yr-done').onclick = () => {
    window.MYTH_START_STATS = Object.assign({}, Engine.getState().stats);
    Engine.setFlag('sophomore_year_complete'); Engine.forceGradeUp(); updateHUD();
    _sophHide(() => { refreshStatsSidebar(); showJuniorYear(); });
  };
};
