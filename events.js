/* ═══════════════════════════════════════════════════════
   events.js — MYTH Event Framework
   Defines EventManager and sample events across all
   categories: academic, social, athletic, personal, drama
═══════════════════════════════════════════════════════ */

'use strict';

// ── Category definitions ──────────────────────────────
const EVENT_CATEGORIES = {
  academic:  { label: 'ACADEMIC',  color: '#3F5F8C' },
  social:    { label: 'SOCIAL',    color: '#C4613A' },
  athletic:  { label: 'ATHLETIC',  color: '#6E9E60' },
  personal:  { label: 'PERSONAL',  color: '#C47A82' },
  drama:     { label: 'DRAMA',     color: '#C9913A' },
  milestone: { label: 'MILESTONE', color: '#2D1F12' },
};

// ── EventManager ──────────────────────────────────────
const EventManager = (function () {

  const _registered = {};    // id → event
  const _fired      = new Set();
  const _queue      = [];
  let   _presenting = false;

  function register(event) {
    _registered[event.id] = event;
  }

  function registerMany(events) {
    events.forEach(register);
  }

  function checkTriggers(state) {
    if (!state) return;
    Object.values(_registered).forEach(event => {
      if (event.once && _fired.has(event.id)) return;
      if (_queue.find(e => e.id === event.id)) return;
      try {
        if (event.trigger(state)) _queue.push(event);
      } catch (e) { /* bad condition — skip */ }
    });
    _processQueue(state);
  }

  function _processQueue(state) {
    if (_presenting || _queue.length === 0) return;
    const event = _queue.shift();
    if (event.once) _fired.add(event.id);
    _present(event, state);
  }

  function _present(event, state) {
    _presenting = true;
    const cat   = EVENT_CATEGORIES[event.category] || { label: 'EVENT', color: '#A09080' };
    const scene = typeof event.scene === 'function' ? event.scene(state) : event.scene;

    const card  = document.getElementById('event-modal-card');
    card.style.setProperty('--em-color', cat.color);

    document.getElementById('em-category').textContent = cat.label;
    document.getElementById('em-category').style.color = cat.color;
    document.getElementById('em-location').textContent = scene.location || '';
    document.getElementById('em-title').textContent    = event.title;
    document.getElementById('em-setup').textContent    = scene.setup;

    const choicesEl = document.getElementById('em-choices');
    choicesEl.innerHTML = '';
    (scene.choices || []).forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'em-choice';
      btn.innerHTML = `<span class="em-choice-label">${choice.label}</span>
        ${choice.hint ? `<span class="em-choice-hint">${choice.hint}</span>` : ''}`;
      btn.addEventListener('click', () => _resolve(choice, scene, state));
      choicesEl.appendChild(btn);
    });

    const modal = document.getElementById('event-modal');
    modal.classList.add('open');
    gsap.fromTo('#event-modal-card',
      { opacity: 0, y: 36, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }
    );
  }

  function _resolve(choice, scene, state) {
    if (choice.outcome?.statDeltas)  Engine.modifyStats(choice.outcome.statDeltas);
    if (choice.outcome?.flagsToSet)  choice.outcome.flagsToSet.forEach(f => Engine.setFlag(f));
    if (choice.outcome?.onResolve)   choice.outcome.onResolve(Engine.getState());

    const narrative = choice.outcome?.narrative;
    if (narrative) {
      document.getElementById('em-setup').textContent = narrative;
      const choicesEl = document.getElementById('em-choices');
      choicesEl.innerHTML = '';
      const cont = document.createElement('button');
      cont.className = 'em-choice em-choice-continue';
      cont.textContent = 'Continue →';
      cont.addEventListener('click', _close);
      choicesEl.appendChild(cont);
    } else {
      _close();
    }
  }

  function _close() {
    gsap.to('#event-modal-card', {
      opacity: 0, y: 16, scale: 0.96, duration: 0.28, ease: 'power2.in',
      onComplete: () => {
        document.getElementById('event-modal').classList.remove('open');
        _presenting = false;
        if (_queue.length > 0) _processQueue(Engine.getState());
      }
    });
  }

  return { register, registerMany, checkTriggers };

})();


// ══════════════════════════════════════════════════════
//  SAMPLE EVENTS
//  Add your own story events in separate files using
//  EventManager.register({ id, category, title, once,
//    trigger(state) → bool,
//    scene: { location, setup, choices: [{ label, hint,
//      outcome: { statDeltas, flagsToSet, narrative, onResolve }
//    }] }
//  })
// ══════════════════════════════════════════════════════

const MYTH_EVENTS = [

  // ── MILESTONE ──────────────────────────────────────

  {
    id:       'first_morning',
    category: 'milestone',
    title:    'First Day',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 1 && s.dayIndex === 0 && s.period.id === 'before_school',
    scene: {
      location: 'FRONT ENTRANCE',
      setup: "You're here. Finally. The flag is going up. People are streaming in from the parking lot and the sidewalk. Some of them look like they own this place. None of them are paying attention to you — which is either the best or worst thing that could happen on day one.",
      choices: [
        {
          label: 'Find a good spot and watch everyone arrive',
          hint:  'Quiet start',
          outcome: {
            statDeltas:  { selfAwareness: +1 },
            flagsToSet:  ['observed_first_morning'],
            narrative:   "You take it all in. Faces, groups, dynamics. By the time the bell rings you already know more than most people realize.",
          },
        },
        {
          label: "Walk in like you've been here before",
          hint:  'Confident energy',
          outcome: {
            statDeltas:  { looks: +1, stress: -1 },
            flagsToSet:  ['confident_first_morning'],
            narrative:   "Head up. Shoulders back. A few people glance your way. You don't know any of them yet. But they noticed.",
          },
        },
        {
          label: 'Look for someone who seems as lost as you',
          hint:  'Open to connection',
          outcome: {
            statDeltas:  { friendships: +1, selfAwareness: +1 },
            flagsToSet:  ['connected_first_morning'],
            narrative:   "You catch eyes with someone near the bulletin board who's clearly reading it too hard to pretend they're not nervous. You both kind of laugh. Day one isn't over yet.",
          },
        },
      ],
    },
  },

  {
    id:       'end_of_first_week',
    category: 'milestone',
    title:    'End of Week One',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 1 && s.dayIndex === 4 && s.period.id === 'after_school',
    scene: {
      location: 'AFTER SCHOOL',
      setup: "Five days. You made it. You know the layout now — which hallways to cut through, which bathrooms to avoid, where the line moves fastest at lunch. You don't know most people's names yet. But you're already starting to understand how things work here.",
      choices: [
        {
          label: 'Walk home slowly, thinking it over',
          outcome: {
            statDeltas: { selfAwareness: +1, stress: -1 },
            narrative:  "You give yourself that. One slow walk. Things feel a little more possible than they did Monday morning.",
          },
        },
        {
          label: 'Text someone from today to hang this weekend',
          outcome: {
            statDeltas: { friendships: +1, relationships: +1 },
            flagsToSet: ['reached_out_week_one'],
            narrative:  "You send the text before you can overthink it. They say yes. That matters more than you let yourself think right now.",
          },
        },
        {
          label: 'Go straight home and decompress alone',
          outcome: {
            statDeltas: { sleep: +1, stress: -2 },
            narrative:  "You need it. No explanation required. Sometimes recovery is its own kind of strategy.",
          },
        },
      ],
    },
  },

  // ── SOCIAL ─────────────────────────────────────────

  {
    id:       'first_lunch_seat',
    category: 'social',
    title:    'Finding Your Table',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 1 && s.period.id === 'lunch' && s.currentZone?.id === 'cafeteria',
    scene: {
      location: 'CAFETERIA',
      setup: "The cafeteria is a map of the entire school. The loud table near the windows is already claimed. The quiet corner by the fire exit has three people who look like they'd rather be somewhere else. A group you vaguely recognize from this morning is waving at no one in particular — or maybe at you.",
      choices: [
        {
          label: 'Sit with the group who waved',
          hint:  'Take the social risk',
          outcome: {
            statDeltas: { friendships: +2, stress: +1 },
            flagsToSet: ['sat_with_crowd_day_one'],
            narrative:  "You walk over. There's a half-second where nobody says anything. Then someone pulls out a chair. You're in.",
          },
        },
        {
          label: 'Take the quiet corner table',
          hint:  'Low pressure, high observation',
          outcome: {
            statDeltas: { selfAwareness: +2, stress: -1 },
            flagsToSet: ['solo_lunch_day_one'],
            narrative:  "You eat alone. You notice things. The cafeteria has layers you wouldn't have seen from the loud table.",
          },
        },
        {
          label: 'Skip the cafeteria, eat outside',
          hint:  'The quad is less crowded',
          outcome: {
            statDeltas: { stress: -2, culturality: +1 },
            flagsToSet: ['outdoor_lunch_day_one'],
            narrative:  "Fresh air. Sun. The quad is quieter than you expected. You like it out here.",
          },
        },
      ],
    },
  },

  {
    id:       'party_invite',
    category: 'social',
    title:    'The Invite',
    once:     true,
    trigger: s => s.grade === 9 && s.week >= 3 && s.dayIndex === 3 && s.period.id === 'after_school' && s.stats.friendships >= 4,
    scene: {
      location: 'AFTER SCHOOL',
      setup: "Someone texts you on Thursday. \"There's something this weekend. You should come.\" No address yet. Just a question. It's not exactly an invitation — it's a vibe check. They're seeing if you're the kind of person who says yes.",
      choices: [
        {
          label: '"Yeah, send me the details"',
          hint:  'Open door',
          outcome: {
            statDeltas: { friendships: +1, toxicity: +1 },
            flagsToSet: ['accepted_first_party_invite'],
            narrative:  "You say yes. Details come Friday afternoon. It's at someone's house whose name you vaguely recognize.",
          },
        },
        {
          label: '"Maybe, depends on the vibe"',
          hint:  'Keep them guessing',
          outcome: {
            statDeltas: { selfAwareness: +1 },
            flagsToSet: ['maybe_first_party_invite'],
            narrative:  "They respect the non-answer more than you expect. The details come anyway.",
          },
        },
        {
          label: '"Nah, I\'m good this weekend"',
          hint:  'Hard pass',
          outcome: {
            statDeltas: { integrity: +1, friendships: -1 },
            narrative:  "They say \"ok\" and you can't fully read the tone. Maybe it was the right call. Maybe you'll find out later.",
          },
        },
      ],
    },
  },

  {
    id:       'homecoming_decision',
    category: 'social',
    title:    'Homecoming Week',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 6 && s.dayIndex === 1 && s.period.id === 'brunch',
    scene: {
      location: 'MAIN QUAD',
      setup: "The quad is covered in posters. Signs. Someone rented a fog machine for their proposal at lunch. Homecoming is a week away and the school has fully given itself over to the hype. The question is whether you're going, and how.",
      choices: [
        {
          label: 'Go with a group of friends',
          hint:  'The social version',
          outcome: {
            statDeltas: { friendships: +2, relationships: +1, stress: +1 },
            flagsToSet: ['went_homecoming_group'],
            narrative:  "You coordinate outfits via text for three days straight. It's chaotic. It's fun.",
          },
        },
        {
          label: 'Ask someone',
          hint:  'High risk, high reward',
          outcome: {
            statDeltas: { relationships: +2, stress: +2 },
            flagsToSet: ['asked_someone_homecoming'],
            narrative:  "You do it. In person, between classes, with no preparation. They say yes. Your heart rate doesn't go back to normal for a while.",
          },
        },
        {
          label: 'Skip the dance, find something better to do',
          hint:  'Your own tradition',
          outcome: {
            statDeltas: { integrity: +1, culturality: +1, stress: -1 },
            flagsToSet: ['skipped_homecoming'],
            narrative:  "You and a few others who felt the same way end up at the diner on Route 9 until midnight. It becomes a story you tell for years.",
          },
        },
      ],
    },
  },

  // ── ACADEMIC ───────────────────────────────────────

  {
    id:       'first_big_assignment',
    category: 'academic',
    title:    'The Assignment',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 2 && s.dayIndex === 0 && s.period.id === 'period_1',
    scene: {
      location: 'CLASS',
      setup: "Your English teacher drops a paper on every desk. Two pages. The assignment is to write about something true — something you've never put into words before. Due in a week. Half the class immediately starts talking. The other half goes quiet in a way that looks like thinking.",
      choices: [
        {
          label: 'Write something real. Actually real.',
          hint:  'High integrity, high exposure',
          outcome: {
            statDeltas: { gpa: +1, integrity: +2, stress: +1 },
            flagsToSet: ['wrote_something_real'],
            narrative:  "You write it. You don't show anyone first. You turn it in and then feel something you can't fully name for the rest of the day.",
          },
        },
        {
          label: 'Write something technically true but safe',
          hint:  'Low risk',
          outcome: {
            statDeltas: { gpa: +1, stress: -1 },
            narrative:  "It's a good paper. Competent. Your teacher gives it a B+ and writes \"well-crafted\" in the margin. You're fine with that.",
          },
        },
        {
          label: 'Procrastinate and grind it out the night before',
          hint:  'You\'ve survived worse',
          outcome: {
            statDeltas: { gpa: -1, stress: +2, sleep: -2 },
            narrative:  "You stay up until 2am. The paper is... something. You've written better. You've written worse. You turn it in.",
          },
        },
      ],
    },
  },

  {
    id:       'study_group_invite',
    category: 'academic',
    title:    'Study Group',
    once:     true,
    trigger: s => s.grade === 9 && s.week >= 3 && s.period.id === 'brunch' && s.currentZone?.id === 'library' && s.stats.gpa >= 5,
    scene: {
      location: 'LIBRARY',
      setup: "Someone from your math class taps you on the shoulder. They're putting together a study group for the unit test next week. Three people so far, they want a fourth. They specifically asked you — which either means they respect your brain or they've run out of options.",
      choices: [
        {
          label: 'Join in — you could use the structure',
          hint:  'Academic + social overlap',
          outcome: {
            statDeltas: { gpa: +1, friendships: +1 },
            flagsToSet: ['joined_study_group'],
            narrative:  "You meet in the library on Wednesday. It's actually productive. You leave understanding three things you didn't before.",
          },
        },
        {
          label: 'Decline — you work better solo',
          outcome: {
            statDeltas: { selfAwareness: +1 },
            narrative:  "You study alone that night. Music on. No interruptions. You know yourself.",
          },
        },
        {
          label: 'Say yes but flake the day of',
          hint:  'Easier in the moment',
          outcome: {
            statDeltas: { integrity: -1, stress: +1 },
            narrative:  "You text 'something came up' twenty minutes before. The group texts back fine but you know you damaged something small.",
          },
        },
      ],
    },
  },

  {
    id:       'teacher_calls_on_you',
    category: 'academic',
    title:    'Called Out',
    once:     false,
    trigger: s => s.week >= 2 && s.period.id === 'period_2' && Math.random() < 0.18,
    scene: {
      location: 'CLASS',
      setup: "Your teacher stops mid-sentence and looks directly at you. \"What do you think?\" The room shifts. Fourteen pairs of eyes. You either zoned out and have no idea what they're talking about, or you actually have a thought worth saying.",
      choices: [
        {
          label: 'Answer honestly — you have something to say',
          outcome: {
            statDeltas: { gpa: +1, selfAwareness: +1 },
            narrative:  "You answer. It's not perfect but it's real. Your teacher nods. Someone near the back writes something down.",
          },
        },
        {
          label: '"Sorry, can you repeat the question?"',
          hint:  'Buying time',
          outcome: {
            statDeltas: { stress: +1 },
            narrative:  "The question repeated is: essentially the same question. You give an answer. It's fine. The moment passes.",
          },
        },
        {
          label: 'Deflect: "I think what they were saying is—"',
          hint:  'Smooth redirect',
          outcome: {
            statDeltas: { integrity: -1, selfAwareness: +1 },
            narrative:  "You gesture toward someone across the aisle. They go with it. Your teacher gives you a look you can't fully decode.",
          },
        },
      ],
    },
  },

  // ── ATHLETIC ───────────────────────────────────────

  {
    id:       'pe_moment',
    category: 'athletic',
    title:    'PE First Impression',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 1 && s.period.id === 'period_3' && s.currentZone?.id === 'gym',
    scene: {
      location: 'GYM',
      setup: "First PE class. The gym smells exactly like every gym you've ever been in. Coach Rivera is calling roll from a clipboard. Then he says you're running a mile to start the year. Some people groan. Some people start stretching immediately. You recognize both types.",
      choices: [
        {
          label: 'Run it hard — set the tone early',
          hint:  'High effort',
          outcome: {
            statDeltas: { athleticism: +1, physique: +1, stress: +1 },
            flagsToSet: ['ran_hard_first_pe'],
            narrative:  "You go out fast. A few people notice. Coach Rivera glances at his stopwatch when you finish. He doesn't say anything but you see him mark something.",
          },
        },
        {
          label: 'Pace yourself — it\'s a marathon, not a sprint',
          outcome: {
            statDeltas: { selfAwareness: +1, sleep: +1 },
            narrative:  "Steady the whole way. You finish comfortably. Your lungs aren't burning at the end, which is more than you can say for some people.",
          },
        },
        {
          label: 'Jog it, conserve energy, see who you end up running with',
          hint:  'Social strategy',
          outcome: {
            statDeltas: { friendships: +1 },
            narrative:  "You end up alongside a few people at the same pace. By mile two you're all talking. PE becomes a different thing after that.",
          },
        },
      ],
    },
  },

  {
    id:       'sports_tryout_notice',
    category: 'athletic',
    title:    'Tryouts',
    once:     true,
    trigger: s => s.grade === 9 && s.week === 4 && s.dayIndex === 0 && s.period.id === 'before_school',
    scene: {
      location: 'FRONT ENTRANCE',
      setup: "There's a new flyer on the bulletin board. Tryouts. The date is in three weeks. You don't have to do it. But you're already thinking about it, which means something.",
      choices: [
        {
          label: 'Sign up — you\'ve been waiting for this',
          hint:  'Athletic path opens',
          outcome: {
            statDeltas: { athleticism: +1, extracurriculars: +1, stress: +1 },
            flagsToSet: ['signed_up_for_tryouts'],
            narrative:  "You write your name on the sheet before you can change your mind. Three weeks. You start doing something every afternoon.",
          },
        },
        {
          label: 'Consider it but don\'t commit yet',
          hint:  'You have time',
          outcome: {
            statDeltas: { stress: +1 },
            flagsToSet: ['considered_tryouts'],
            narrative:  "You take a photo of the flyer. You look at it three more times that week. The decision is still open.",
          },
        },
        {
          label: 'That\'s not your thing. Keep moving.',
          outcome: {
            statDeltas: { selfAwareness: +1 },
            narrative:  "You walk past it. Knowing what you're not interested in is also a kind of clarity.",
          },
        },
      ],
    },
  },

  {
    id:       'pickup_game',
    category: 'athletic',
    title:    'Pickup Game',
    once:     false,
    trigger: s => s.period.id === 'lunch' && s.currentZone?.id === 'basketball_courts' && s.stats.athleticism >= 4,
    scene: {
      location: 'BASKETBALL COURTS',
      setup: "Someone points at you. \"You run?\" There's a game going and they're one short. The courts are loud. The concrete is cracked. Nobody here cares about your GPA.",
      choices: [
        {
          label: 'Get in',
          hint:  'Full send',
          outcome: {
            statDeltas: { athleticism: +1, physique: +1, friendships: +1, stress: -1 },
            narrative:  "You play. You're rusty for the first few possessions then you find it. By the end someone asks if you're trying out for anything.",
          },
        },
        {
          label: 'Watch from the sideline this time',
          outcome: {
            statDeltas: { selfAwareness: +1 },
            narrative:  "You watch. Next time you'll be ready to answer yes faster.",
          },
        },
      ],
    },
  },

  // ── PERSONAL ───────────────────────────────────────

  {
    id:       'quiet_moment',
    category: 'personal',
    title:    'Just a Moment',
    once:     false,
    trigger: s => s.period.id === 'after_school' && s.currentZone?.id === 'main_quad' && s.dayIndex === 4 && Math.random() < 0.3,
    scene: {
      location: 'THE QUAD',
      setup: "Friday afternoon. The campus is emptying fast. The fountain is running. You're sitting on the bench and for once there's no reason to be anywhere else right now. The sky is that orange California kind of orange.",
      choices: [
        {
          label: 'Just sit here for a while',
          outcome: {
            statDeltas: { stress: -2, sleep: +1, selfAwareness: +1 },
            narrative:  "You stay until the sprinklers come on. It's the right amount of time.",
          },
        },
        {
          label: 'Call someone — feels like a good time',
          outcome: {
            statDeltas: { relationships: +1, stress: -1 },
            narrative:  "Whoever answers, you talk for longer than you planned. That's a good sign about both of you.",
          },
        },
        {
          label: 'Write something down',
          hint:  'In your notes app, or actually on paper',
          outcome: {
            statDeltas: { selfAwareness: +2, integrity: +1 },
            flagsToSet: ['wrote_something_down'],
            narrative:  "You write three sentences about how today felt. It's not for anyone. That's exactly why it matters.",
          },
        },
      ],
    },
  },

  {
    id:       'hard_morning',
    category: 'personal',
    title:    'Off Day',
    once:     false,
    trigger: s => s.stats.stress >= 7 && s.period.id === 'before_school' && Math.random() < 0.25,
    scene: {
      location: 'FRONT ENTRANCE',
      setup: "You didn't sleep well. Something is sitting on your chest this morning that you can't fully name. The campus looks the same as always. Everyone looks like they're fine. You're not sure you are.",
      choices: [
        {
          label: 'Push through — you\'ve done it before',
          outcome: {
            statDeltas: { integrity: +1, stress: +1, sleep: -1 },
            narrative:  "You get through it. The day passes. You're still here at the end of it.",
          },
        },
        {
          label: 'Find five minutes of quiet before class starts',
          outcome: {
            statDeltas: { stress: -2, selfAwareness: +1 },
            narrative:  "You find a bench around the side of the building. Five minutes. You breathe. It's not a cure but it's something.",
          },
        },
        {
          label: 'Text someone: "rough morning"',
          hint:  'Two words can open a door',
          outcome: {
            statDeltas: { relationships: +1, stress: -1 },
            narrative:  "They respond in two minutes. \"Want to talk?\" Sometimes that's all it takes to feel slightly less alone in a crowded place.",
          },
        },
      ],
    },
  },

  {
    id:       'library_alone',
    category: 'personal',
    title:    'Disappearing for a While',
    once:     false,
    trigger: s => s.period.free && s.currentZone?.id === 'library' && Math.random() < 0.2,
    scene: {
      location: 'LIBRARY',
      setup: "The library is quiet today. The librarian is at her desk. There's a table in the back with good light and nobody near it. You could just... be here for a while. Not studying. Not performing. Just existing somewhere calm.",
      choices: [
        {
          label: 'Sit and let your mind go wherever',
          outcome: {
            statDeltas: { stress: -2, selfAwareness: +1 },
            narrative:  "You stare at the ceiling for a while. Then the shelves. Then nothing. You feel slightly more like yourself when you leave.",
          },
        },
        {
          label: 'Actually pick up a book for yourself — not for class',
          outcome: {
            statDeltas: { culturality: +1, gpa: +1, stress: -1 },
            flagsToSet: ['read_for_fun'],
            narrative:  "You read the first twenty pages standing up and then have to sit down because you need to keep going.",
          },
        },
        {
          label: 'Write in your notes — process the week',
          outcome: {
            statDeltas: { selfAwareness: +2, stress: -1 },
            narrative:  "You figure out three things you've been thinking around but not about. It helps.",
          },
        },
      ],
    },
  },

  // ── DRAMA ──────────────────────────────────────────

  {
    id:       'hallway_beef',
    category: 'drama',
    title:    'The Hallway Thing',
    once:     false,
    trigger: s => s.week >= 2 && !s.period.free && Math.random() < 0.12,
    scene: {
      location: 'HALLWAY',
      setup: "Someone shoulders past you in the hallway without looking up from their phone. Hard enough that your bag slips off your shoulder. They keep walking. People nearby saw it. Nobody says anything. You have about three seconds to decide what to do.",
      choices: [
        {
          label: 'Say something — "Hey, watch it"',
          hint:  'Not going to pretend that was fine',
          outcome: {
            statDeltas: { integrity: +1, toxicity: +1 },
            narrative:  "They slow down but don't fully stop. Half-turn. Something flickers across their face — surprise, maybe. They keep moving. You said what you said.",
          },
        },
        {
          label: 'Let it go — it\'s not worth the energy',
          outcome: {
            statDeltas: { stress: +1, integrity: +1 },
            narrative:  "You adjust your bag and keep moving. Some things aren't worth the cost of responding to them.",
          },
        },
        {
          label: 'Catch eyes with someone nearby and let the look say everything',
          outcome: {
            statDeltas: { selfAwareness: +1, friendships: +1 },
            narrative:  "A shared moment with a stranger. They give you the 'that person' look. You both understand completely.",
          },
        },
      ],
    },
  },

  {
    id:       'friend_group_tension',
    category: 'drama',
    title:    'Caught in the Middle',
    once:     true,
    trigger: s => s.grade === 9 && s.week >= 5 && s.stats.friendships >= 5 && s.period.id === 'lunch',
    scene: {
      location: 'CAFETERIA',
      setup: "Two people you've been spending time with are clearly not talking to each other today. Both of them sit down at the table and stare in opposite directions. When you sit down, one of them immediately starts venting to you about the other one. The other one is watching.",
      choices: [
        {
          label: 'Listen to one, then the other. Don\'t take sides.',
          hint:  'The diplomatic move',
          outcome: {
            statDeltas: { friendships: +1, stress: +2, integrity: +1 },
            flagsToSet: ['mediator_first_drama'],
            narrative:  "You hear both versions. They're not the same story. You hold both without deciding. It's exhausting and the right thing.",
          },
        },
        {
          label: 'Side with the one you're closer to',
          hint:  'Loyalty',
          outcome: {
            statDeltas: { friendships: +1, toxicity: +1, integrity: -1 },
            narrative:  "You're their person right now. The other one clocks it. Something shifts in the group that doesn't fully unshift.",
          },
        },
        {
          label: 'Change the subject and refuse to engage',
          outcome: {
            statDeltas: { stress: -1, selfAwareness: +1 },
            narrative:  "You pivot hard to something else. They both look annoyed for about thirty seconds then the energy slowly unsticks.",
          },
        },
      ],
    },
  },

  {
    id:       'social_media_moment',
    category: 'drama',
    title:    'Posted Without Asking',
    once:     true,
    trigger: s => s.grade === 9 && s.week >= 4 && s.stats.friendships >= 3 && Math.random() < 0.4,
    scene: {
      location: 'PHONE',
      setup: "Someone posted a photo from the weekend and you're in it. Not a bad photo — actually kind of a good one — but you didn't know they took it, and you definitely didn't say they could post it. It has fourteen likes already. One of them is from someone you definitely didn't want to see it.",
      choices: [
        {
          label: 'Let it go — it\'s actually fine',
          outcome: {
            statDeltas: { stress: +1 },
            narrative:  "You check it twice more over the next hour then stop thinking about it. It's fine.",
          },
        },
        {
          label: 'Text them: "hey can you take that down?"',
          hint:  'Asserting a boundary',
          outcome: {
            statDeltas: { integrity: +1, stress: -1 },
            narrative:  "They seem surprised but they take it down without making it weird. You were right to ask.",
          },
        },
        {
          label: 'Screenshot the likes and overanalyze',
          hint:  'You\'re going to do this regardless',
          outcome: {
            statDeltas: { stress: +2, selfAwareness: +1 },
            narrative:  "Three hours later you've reconstructed an entire social timeline from fourteen likes. You know too much. You can't unknow it.",
          },
        },
      ],
    },
  },

];

// Register all sample events
EventManager.registerMany(MYTH_EVENTS);

// ════════════════════════════════════════════════════════
//  SOPHOMORE YEAR EVENT TRIGGERS
// ════════════════════════════════════════════════════════
EventManager.registerMany([

  // Freshman year end — fires after week 8 to launch year-end overlay
  {
    id:       'freshman_year_end',
    category: 'milestone',
    title:    'End of Freshman Year',
    once:     true,
    trigger:  s => s.grade === 9 && s.week >= 8 && s.dayIndex === 4 && s.period.id === 'after_school',
    scene: {
      location: 'END OF YEAR',
      setup: 'Freshman year is over. Summer is here.',
      choices: [{
        label: 'HEAD INTO SUMMER →',
        outcome: { onResolve: () => setTimeout(window.showFreshmanYearEnd, 400) },
      }],
    },
  },

  // Sophomore year events are now handled by the state machine in game.js (_sophStep).
  // Classes trigger via proximity nav (MYTH_SOPH_NAV_TARGET in world3d.js).
  // Phases (Brawl, PSAT, Fitness) fire as inline overlays in the sequence.
  // Only the freshman_year_end trigger above is still used to kick off showFreshmanYearEnd.

]);
