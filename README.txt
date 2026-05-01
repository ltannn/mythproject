MYTH — High School Life Simulator
==================================

A browser-based top-down 2D life simulator set in a California high school.
Build your character, pick your friend group, and navigate four years of
academics, social drama, athletics, and everything in between.


HOW TO PLAY
-----------
Open index.html in any modern browser. No server or install required.

1. Boot screen loads automatically.
2. Enter your name on the student ID card.
3. Choose a friend group (SOGYAG / XOBX / SACUL) — each shifts your starting stats.
4. Pick a personality archetype.
5. Your background, rumor, and secret are randomized.
6. Review your character card, then begin Freshman Year.

Controls (in-game world):
  W / A / S / D  or  Arrow Keys  — Move your character
  E                              — Interact (talk to nearby NPC or use object)
  STATS ↗  (top-right HUD)      — Open/close stats sidebar


CAMPUS ZONES
------------
The campus is a 3-column × 6-row grid. Walk your character into a zone to
enter it. Some zones are locked until a higher grade.

Grade 9  unlocks: Front Entrance, Main Quad, Admin, 200s, 100s,
                  Library, Cafeteria, Gym, Locker Rooms, Basketball Courts
Grade 10 unlocks: 300s, 400s / Arts, Tennis Courts, Baseball Diamond
Grade 11 unlocks: Junior Lot, 500s, Auditorium, Athletic Field / Track
Grade 12 unlocks: Senior Quad, Behind the 400s


FRIEND GROUPS
-------------
SOGYAG   — The popular crowd. +Friendships, +Toxicity, -GPA, -Integrity
XOBX     — Well-rounded. +Looks, +Physique, +GPA
SACUL    — Academic. +GPA, +Self-Awareness, -Relationships, -Looks


PERSONALITY ARCHETYPES
----------------------
The Nerd        — +GPA, +Self-Awareness
Extrovert       — +Friendships, +Relationships
The Athlete     — +Athleticism, +Physique, +Extracurriculars, -Sleep
The Charmer     — +Relationships, +Friendships, +Looks, -Integrity
The Observer    — +Self-Awareness, +Culturality, -Friendships
The Rebel       — +Toxicity, +Extracurriculars, -Integrity, -Stress
The Empath      — +Relationships, +Self-Awareness, +Stress, -Sleep
The Wildcard    — 3 random stats shifted; hidden bonuses


STATS
-----
GPA · Friendships · Relationships · Toxicity · Looks · Physique
Athleticism · Extracurriculars · Culturality · Integrity
Stress · Wealth · Self-Awareness · Sleep

All stats run 0–10. Toxicity and Stress are inverse (lower is better).


FILES
-----
index.html      Main HTML shell — all scenes and game UI
style.css       Full styling (warm parchment theme)
game.js         Scene sequencer, character creation, UI logic
engine.js       Game state engine — zones, NPCs, stats, time, event bus
campus.js       Data layer — zones, NPCs, periods, grade conditions
events.js       Event system — academic, social, athletic, personal, drama
phaser-game.js  Phaser 3 top-down 2D world — map, movement, interaction


TECH STACK
----------
Phaser 3.60   — 2D game world, movement, camera
GSAP 3.12     — UI transitions and animations
Vanilla JS    — Everything else (no framework)
Google Fonts  — Bebas Neue, Space Mono, DM Sans, Playfair Display


MONTA VISTA HIGH SCHOOL — CLASS OF 2030
