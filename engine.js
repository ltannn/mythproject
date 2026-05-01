/* ═══════════════════════════════════════════════════════
   engine.js — MYTH Game Engine
   State management, time, navigation, stat system,
   interaction API for story modules
═══════════════════════════════════════════════════════ */

'use strict';

const Engine = (function () {

  // ── Private state ───────────────────────────────────
  let _state = null;
  const _interactions  = {};  // id → interaction object
  const _npcDialogue   = {};  // npcId → dialogue tree (set by story modules)
  const _gradeConditions = {}; // grade → additional conditions
  const _hooks = {};          // eventName → [callback, ...]
  const _storyFlags = new Set();

  // ── Helpers ─────────────────────────────────────────
  function _zoneById(id)   { return ZONES.find(z => z.id === id) || null; }
  function _npcById(id)    { return NPCS.find(n => n.id === id)  || null; }
  function _periodByIdx(i) { return PERIODS[i] || PERIODS[PERIODS.length - 1]; }
  function _clamp(v, lo=0, hi=10) { return Math.max(lo, Math.min(hi, v)); }

  function _emit(event, data = {}) {
    (_hooks[event] || []).forEach(cb => cb({ ...data, state: Engine.getState() }));
  }

  // ── Init ────────────────────────────────────────────
  function init(playerData) {
    _state = {
      player: {
        name:        playerData.name,
        friendGroup: playerData.friendGroup,
        personality: playerData.personality,
        height:      playerData.height,
        rumor:       playerData.rumor,
        background:  playerData.background,
        secret:      playerData.secret,
      },
      stats: { ...playerData.stats },

      // Time
      grade:        9,
      week:         1,
      dayIndex:     0,   // 0–4 (Mon–Fri)
      periodIndex:  0,   // index into PERIODS array

      // Location
      currentZone:  'gym',
      prevZone:     null,

      // Progression
      storyFlags:   new Set(),
      visitedZones: new Set(['gym']),
      metNPCs:      new Set(),

      // UI
      activeNPC:    null,
      activeInteraction: null,
      dialogueLine: 0,
    };

    _emit('init', { state: _state });
    return _state;
  }

  // ── State getters ───────────────────────────────────
  function getState() {
    if (!_state) return null;
    return {
      ..._state,
      stats:       { ..._state.stats },
      currentZone: _zoneById(_state.currentZone),
      period:      _periodByIdx(_state.periodIndex),
      day:         DAYS[_state.dayIndex],
      isFreeTime:  _periodByIdx(_state.periodIndex).free,
    };
  }

  function getStat(key) {
    return _state?.stats[key] ?? 0;
  }

  // ── Navigation ──────────────────────────────────────
  function getAccessibleZones() {
    if (!_state) return [];
    return ZONES.filter(z =>
      z.mapGrid !== null &&                   // on the main map
      z.unlocksAt <= _state.grade &&          // grade requirement met
      (!z.freeTimeOnly || _periodByIdx(_state.periodIndex).free)  // free time check
    );
  }

  function canGoTo(zoneId) {
    const zone = _zoneById(zoneId);
    if (!zone) return false;
    if (zone.unlocksAt > _state.grade) return false;
    if (zone.freeTimeOnly && !_periodByIdx(_state.periodIndex).free) return false;
    return true;
  }

  function goTo(zoneId) {
    if (!_state) return false;
    if (!canGoTo(zoneId)) {
      _emit('blocked', { zoneId, reason: _zoneById(zoneId)?.unlocksAt > _state.grade ? 'grade' : 'time' });
      return false;
    }
    _state.prevZone    = _state.currentZone;
    _state.currentZone = zoneId;
    _state.visitedZones.add(zoneId);
    _state.activeNPC   = null;
    _state.activeInteraction = null;
    _emit('zone_enter', { zone: _zoneById(zoneId) });
    return true;
  }

  // ── NPCs in zone ────────────────────────────────────
  function getNPCsInZone(zoneId) {
    const periodId = _periodByIdx(_state.periodIndex).id;
    return NPCS.filter(npc => {
      const loc = npc.schedule[periodId] ?? npc.defaultZone;
      if (loc !== zoneId) return false;
      // stat requirement check
      return Object.entries(npc.statRequirements || {})
        .every(([k, v]) => (_state.stats[k] || 0) >= v);
    });
  }

  // ── World objects in zone ────────────────────────────
  function getObjectsInZone(zoneId) {
    const base = WORLD_OBJECTS.filter(o => o.zone === zoneId);
    const story = Object.values(_interactions).filter(i => i.zone === zoneId);
    return [...base, ...story].filter(item => {
      if (!item.condition) return true;
      return item.condition(_state);
    });
  }

  // ── Stats ────────────────────────────────────────────
  function modifyStat(key, delta) {
    if (!_state || _state.stats[key] === undefined) return;
    const mult = (window.MYTH_STAT_MULT != null) ? window.MYTH_STAT_MULT : 1;
    const scaled = Math.round(delta * mult * 10) / 10;
    const before = _state.stats[key];
    _state.stats[key] = key === 'gpa'
      ? _clamp(before + scaled, 0, 4)
      : _clamp(before + scaled, 0, 10);
    _emit('stat_change', { key, before, after: _state.stats[key], delta: scaled });
  }

  function modifyStats(deltas = {}) {
    Object.entries(deltas).forEach(([k, v]) => modifyStat(k, v));
  }

  // ── Story flags ──────────────────────────────────────
  function setFlag(flag) {
    _state.storyFlags.add(flag);
    _storyFlags.add(flag);
    _emit('flag_set', { flag });
    _checkGradeAdvancement();
  }

  function hasFlag(flag) {
    return _state?.storyFlags.has(flag) ?? false;
  }

  // ── Interactions (story API) ─────────────────────────
  // Story modules call Engine.addInteraction({ id, zone, label, icon, condition, onTrigger })
  // onTrigger(state) → { text, choices: [{ label, onChoose(state) → statDeltas, flagsToSet }] }
  function addInteraction(interaction) {
    _interactions[interaction.id] = interaction;
  }

  function triggerInteraction(interactionId) {
    const item = _interactions[interactionId]
      || WORLD_OBJECTS.find(o => o.id === interactionId);
    if (!item) return null;
    _state.activeInteraction = interactionId;
    if (item.onTrigger) {
      const result = item.onTrigger(_state);
      _emit('interaction_open', { item, result });
      return result;
    }
    _emit('interaction_open', { item, result: null });
    return null;
  }

  function resolveChoice(choiceObj) {
    if (!choiceObj) return;
    if (choiceObj.statDeltas)  modifyStats(choiceObj.statDeltas);
    if (choiceObj.flagsToSet)  choiceObj.flagsToSet.forEach(setFlag);
    if (choiceObj.onChoose)    choiceObj.onChoose(_state);
    _state.activeInteraction = null;
    _emit('choice_resolved', { choice: choiceObj });
  }

  // ── NPC dialogue (story API) ──────────────────────────
  // Engine.addDialogue(npcId, tree)
  // tree: [{ line, speaker, condition(state)→bool, choices: [...] }]
  function addDialogue(npcId, tree) {
    _npcDialogue[npcId] = tree;
  }

  function talkTo(npcId) {
    const npc = _npcById(npcId);
    if (!npc) return null;
    _state.metNPCs.add(npcId);
    _state.activeNPC = npcId;
    const tree = _npcDialogue[npcId];
    if (!tree) {
      _emit('npc_talk', { npc, node: null });
      return null;
    }
    // Find first node whose condition passes (or has no condition)
    const node = tree.find(n => !n.condition || n.condition(_state)) || null;
    _emit('npc_talk', { npc, node });
    return { npc, node };
  }

  function closeDialogue() {
    _state.activeNPC = null;
    _state.activeInteraction = null;
    _emit('dialogue_close', {});
  }

  // ── Time ────────────────────────────────────────────
  function advancePeriod() {
    if (!_state) return;
    _state.periodIndex++;
    if (_state.periodIndex >= PERIODS.length) {
      _state.periodIndex = 0;
      _state.dayIndex++;
      if (_state.dayIndex >= DAYS.length) {
        _state.dayIndex = 0;
        _state.week++;
        _emit('week_end', { week: _state.week });
      }
      _emit('day_end', { day: DAYS[_state.dayIndex] });
    }
    _emit('period_change', { period: _periodByIdx(_state.periodIndex) });
    _checkGradeAdvancement();
  }

  function advanceDay() {
    // Skip to next before_school
    _state.periodIndex = 0;
    _state.dayIndex++;
    if (_state.dayIndex >= DAYS.length) {
      _state.dayIndex = 0;
      _state.week++;
    }
    _emit('day_start', { day: DAYS[_state.dayIndex], week: _state.week });
  }

  // ── Grade advancement ────────────────────────────────
  function _checkGradeAdvancement() {
    if (!_state || _state.grade >= 12) return;
    const nextGrade = _state.grade + 1;
    const conditions = GRADE_CONDITIONS[nextGrade];
    if (!conditions) return;

    // Check min stats
    const statsOk = Object.entries(conditions.minStats || {})
      .every(([k, v]) => (_state.stats[k] || 0) >= v);
    // Check required flags
    const flagsOk = (conditions.requiredFlags || [])
      .every(f => _state.storyFlags.has(f));
    // Check any extra conditions registered by story modules
    const extraOk = (_gradeConditions[nextGrade] || [])
      .every(fn => fn(_state));

    if (statsOk && flagsOk && extraOk) {
      _advanceGrade();
    }
  }

  function _advanceGrade() {
    const prev = _state.grade;
    _state.grade++;
    _state.week = 1;
    _state.dayIndex = 0;
    _state.periodIndex = 0;
    _emit('grade_up', { from: prev, to: _state.grade });
  }

  function addGradeCondition(grade, fn) {
    if (!_gradeConditions[grade]) _gradeConditions[grade] = [];
    _gradeConditions[grade].push(fn);
  }

  // ── Manual grade advance (for story modules / debugging) ─
  function forceGradeUp() {
    if (_state && _state.grade < 12) _advanceGrade();
  }

  // ── Event hooks ─────────────────────────────────────
  // Engine.on('zone_enter', (data) => { ... })
  // Events: init, zone_enter, blocked, npc_talk, dialogue_close,
  //         interaction_open, choice_resolved, stat_change,
  //         flag_set, period_change, day_start, day_end, week_end, grade_up
  function on(event, callback) {
    if (!_hooks[event]) _hooks[event] = [];
    _hooks[event].push(callback);
  }

  function off(event, callback) {
    if (!_hooks[event]) return;
    _hooks[event] = _hooks[event].filter(cb => cb !== callback);
  }

  // ── Public API ───────────────────────────────────────
  return {
    // Setup
    init,

    // Read state
    getState,
    getStat,
    hasFlag,

    // Navigation
    getAccessibleZones,
    canGoTo,
    goTo,
    getNPCsInZone,
    getObjectsInZone,

    // Stats
    modifyStat,
    modifyStats,

    // Flags
    setFlag,

    // Story API — call these from story modules
    addInteraction,
    triggerInteraction,
    resolveChoice,
    addDialogue,
    talkTo,
    closeDialogue,
    addGradeCondition,
    forceGradeUp,

    // Time
    advancePeriod,
    advanceDay,

    // Events
    on,
    off,
  };

})();
