# SPEC.md — Personal Trainer & Nutritionist App

The single source of truth for this project. Claude Code should read this before every working session. Do not add features that are not described here without asking first.

## 1. Purpose

A single-user app for me that acts as a personal trainer AND nutritionist in my pocket. It tells me what to train each day, prescribes the weights based on my history, manages my recovery, tells me what to eat to hit my targets, and generates the supermarket shopping list (with quantities) a week ahead. No other users initially.

### Coaching style: ambitious and progressive
The app should push me harder over time, not coast. Each training block should demand a little more than the last (more reps, then load, then volume, with effort creeping closer to failure), balanced by scheduled recovery so it stays sustainable. The tone of any motivational or coaching messaging should be demanding but supportive: a coach who believes I can do more and holds me to it. Crucially, "ambitious" means progressive overload managed properly, NOT reckless. Deloads and recovery are non-negotiable parts of the plan, not signs of weakness.

## 2. User profile

- Male, age 27, 6ft 2 (188 cm), ~90 kg, low muscle mass, some fat to lose.
- Goal: body recomposition (lose fat and build muscle simultaneously). Realistic given the untrained starting point.
- Trains 3 to 4 days per week.
- Office-based / lightly-to-moderately active outside the gym.
- Dietary rules: halal, no pork. (Hard constraint, never violate in meal suggestions.)

## 3. Nutrition targets (starting point, app should recompute and allow editing)

Calculated via Mifflin-St Jeor (age 27; keep age and all inputs editable):
- Maintenance (TDEE): ~2,820 kcal/day
- Daily target: ~2,400 to 2,450 kcal/day (modest deficit for recomp)
- Protein: ~180 g/day (high, to protect and build muscle in a deficit)
- Fat: ~70 g/day
- Carbs: ~270 g/day (fills the remaining calories)

Adjustment rule the app should support: hold targets 2 to 3 weeks, then suggest plus or minus 200 kcal based on the weight trend (if recomp stalls and weight is flat with no visible change, nudge down; if energy and lifts are crashing, nudge up). The user can override targets manually at any time.

## 4. Meal engine (app suggests meals)

The app builds each day's meals from a library to roughly hit the daily targets.

Meal preferences (bake these into selection logic and the seed library):
- Halal only, no pork.
- Air fryer recipes preferred, especially salmon and chicken.
- Minimal pan use / minimal washing up.
- Dinner cooked in a portion that leaves leftovers; next day's LUNCH is the previous day's dinner leftovers. So the engine plans breakfast + dinner explicitly, and lunch = yesterday's dinner.
- Start with a fixed library of ~15 to 20 real meals to rotate through (accuracy and consistency beat infinite variety). Each meal stores macros per serving.

Daily selection logic:
- Pick a breakfast + a dinner whose combined macros (plus the carried-over lunch) land within a tolerance band of the daily targets (e.g. plus or minus 10% on calories, protein at or above target).
- Avoid repeating the same dinner two days running.
- Let the user lock or swap any meal.
- Always select up to 2 snacks within the remaining kcal budget (protein-dense first), regardless of whether the protein target is already met. This ensures snack ingredients always appear on the shopping list.

Snack tracking:
- Each planned snack can be marked **eaten** (check) or **skipped** (cancel). These are mutually exclusive states.
- Eaten snacks count toward the day's macro totals and are preserved across re-fits.
- Skipped snacks are zeroed from the day's macro totals and are also preserved (visible as grayed-out). Re-fit treats a skipped snack as not consumed, so the engine may suggest a replacement snack when re-fit is triggered by other events (e.g. logging an off-plan meal).
- Pending snacks (neither eaten nor skipped) are replaced by re-fit if the macro balance changes.

## 5. Training plan

Split (driven by days available):
- **4 days (primary):** Upper A / Lower A / Upper B / Lower B, repeating in sequence. Each muscle trained twice per week; A sessions emphasise horizontal push/pull, B sessions emphasise vertical push/pull. Both upper sessions include direct biceps, triceps, and calf work; both lower sessions include calves.
- **3 days (fallback):** Full Body A / Full Body B / Full Body C, rotating each week. Use this only in weeks where 4 sessions are impossible — weekly per-muscle volume drops to ~6–10 sets (adequate to maintain, not optimise). Push back to 4-day whenever possible.

User does NOT like the barbell bench press; dumbbell chest press is the horizontal push staple.

Exercise selection (returning intermediate, commercial gym; editable):

**Upper A — Horizontal push/pull:**
- DB Chest Press (4 sets), Cable Fly (3 sets)
- Seated Cable Row (4 sets)
- Rear Delt Fly (2 sets), DB Lateral Raise (3 sets)
- Bicep Curl (3 sets), Tricep Pushdown (3 sets)
- Standing Calf Raise (3 sets)

**Upper B — Vertical push/pull:**
- Lat Pulldown (4 sets)
- DB Overhead Press (4 sets), Incline DB Press (3 sets)
- Face Pull (4 sets), DB Lateral Raise (3 sets)
- Hammer Curl (3 sets), Overhead Tricep Extension (3 sets)
- Seated Calf Raise (3 sets)

**Lower A — Quad-dominant:**
- Squat (4 sets), Leg Extension (3 sets)
- Romanian Deadlift (3 sets), Leg Curl (3 sets)
- Standing Calf Raise (4 sets)

**Lower B — Hip-dominant:**
- Romanian Deadlift (4 sets), Lying Leg Curl (4 sets)
- Leg Press (3 sets), Leg Extension (2 sets)
- Seated Calf Raise (4 sets)

**Full Body A (fallback):**
- Squat (4 sets), DB Chest Press (3 sets), Seated Cable Row (3 sets)
- DB Lateral Raise (2 sets), Bicep Curl (2 sets), Tricep Pushdown (2 sets)
- Standing Calf Raise (3 sets)

**Full Body B (fallback):**
- Romanian Deadlift (4 sets), Lat Pulldown (3 sets), DB Overhead Press (3 sets)
- Leg Extension (2 sets), Leg Curl (3 sets)
- Hammer Curl (2 sets), Overhead Tricep Extension (2 sets)
- Seated Calf Raise (3 sets)

**Full Body C (fallback):**
- Leg Press (3 sets), Incline DB Press (3 sets), Dumbbell Row (3 sets)
- Face Pull (3 sets), Lying Leg Curl (3 sets)
- Bicep Curl (2 sets), Tricep Pushdown (2 sets)
- Standing Calf Raise (3 sets)

Approximate weekly set totals — 4-day mode (opening block; climbs via mesocycle volume progression):

| Muscle group | Weekly direct sets | Notes |
|---|---|---|
| Chest | ~10 | UA 7 + UB 3 |
| Back (all pull patterns) | ~11 | UA 4 rows + UB 4 pulldown + 4 face pull |
| Rear delts | ~6 | UA 2 fly + UB 4 face pull |
| Medial delts | ~6 direct | UA 3 + UB 3 lateral raises |
| Biceps | ~6 direct (~14 effective) | +rows and pulldown secondary |
| Triceps | ~6 direct (~15 effective) | +all pressing secondary |
| Quads | ~12 | LA 7 + LB 5 |
| Hamstrings | ~14 | LA 6 + LB 8 |
| Calves | ~14 | all 4 sessions: 3+4+3+4 |

### Progression model: autoregulated double progression inside a periodised mesocycle
This is more sophisticated than plain double progression on purpose. Volume is the main driver of hypertrophy, and matching effort to daily readiness via RIR gives the right stimulus without excess fatigue.

Log per set: weight, reps, AND RIR (reps in reserve = how many more reps I could have done).

Within a week (double progression):
- Each exercise has a rep range (compounds 6 to 10, isolations 10 to 15, default 8 to 12) and a target RIR for the current week.
- Keep load the same and add reps week to week while hitting the target RIR.
- When all working sets reach the TOP of the rep range at the target RIR, increase load next session (+2.5 kg upper body, +5 kg lower body) and reset reps to the BOTTOM of the range.

Across a mesocycle (4 to 6 weeks) — this is the "push harder" mechanism:
- Week 1: start at moderate volume (sets) and conservative effort (~3 RIR).
- Each week: reduce target RIR by ~1 (3 to 2 to 1 to 0/1) and/or add a set to priority muscle groups, as recovery allows. Effort and volume both climb.
- The final week of the block is the hardest (closest to failure, most volume).
- Then a DELOAD week: cut volume by ~50% and keep effort easy (~4 RIR) to shed fatigue.
- The next block restarts from a slightly higher baseline (more load/reps than the previous block started at). This is what makes the app push me harder and harder over time, sustainably.

Opening recalibration block (Block 1, ~4 weeks): start at conservative loads (~60–70% of estimated working max) to re-establish accurate baselines after a layoff. The double progression engine and full RIR logic apply from day one — this is calibration, not coddling. RIR targets: Week 1 → 3 RIR, Week 2 → 2 RIR, Week 3 → 1 RIR, Week 4 → deload at ~4 RIR. Volume stays at the opening-week set counts in the templates above.

From Block 2 onward: full periodisation with no ceiling — volume climbs week-on-week, sets added to priority muscle groups, effort approaches failure in the final week, then deload and restart at a higher baseline. This is what drives sustained progress over time.

## 6. Recovery (part of training, not separate)

- Daily readiness check-in: sleep hours, soreness (1 to 5), energy (1 to 5). Low readiness makes the app dial back today's target RIR, suggest a lighter session, or recommend rest. This feeds the autoregulation above.
- Deloads: scheduled automatically at the end of each mesocycle, and triggered early (reactive deload) if readiness or performance drops repeatedly.
- Rest-day guidance, plus protein and sleep nudges.

## 7. Activity tracking (gym commute + cardio)

Manual entry only. Data is read off the Apple Watch and entered by hand; no HealthKit or native iOS integration.

For each gym trip, log:
- **Date & time** — defaults to now, editable for after-the-fact logging.
- **Travel to gym** — mode: run / walk / drive / dropped off.
- **Travel from gym** — mode: run / walk / drive / dropped off (independent of travel-to).
- **Calories burned** — for run and walk legs.
- **Distance (km) and time (min)** — for run legs only; pace is derived at display time (min/km, guarded for zero distance).
- **Gym workout calories** — entered separately.

Rules:
- A run-one-way / walk-back trip counts the run leg toward distance and pace; the walk leg contributes calories only.
- Pace is never stored; computed as `durMin / distKm`.
- Walk legs contribute calories but not distance/time to charts.

Progress view (at `/activity`, reachable via WORKOUTS → ACTIVITY tab):
- **Run Distance & Pace**: dual Y-axis line chart (distance left; pace right, inverted so faster = higher).
- **Run Time**: line chart.
- **Total Calories per session**: bar chart summing commute legs + workout.
- Charts require ≥ 2 sessions to display.
- Below charts: reverse-chronological trip list with route display, run stats, and per-leg calorie breakdown.

### gym_trips table

```
id                   INTEGER PK AUTOINCREMENT
date                 DATETIME NOT NULL
workout_id           INTEGER FK → workouts(id)   (optional)
travel_to_mode       TEXT NOT NULL   -- run | walk | drive | dropped_off
travel_to_calories   INTEGER
travel_to_dist_km    REAL
travel_to_dur_min    REAL
travel_from_mode     TEXT NOT NULL
travel_from_calories INTEGER
travel_from_dist_km  REAL
travel_from_dur_min  REAL
workout_calories     INTEGER
```

## 8. Data model (Phase 1 builds the core; later tables added in their phase)

Tables (libSQL / SQLite):
- body_metrics: id, date, weight_kg, body_fat_pct, notes
- exercises: id, name, muscle_group, rep_range_low, rep_range_high, increment_kg
- workout_templates: id, name (e.g. "Upper"), is_active
- template_exercises: id, template_id, exercise_id, order, target_sets
- mesocycles: id, start_date, length_weeks, current_week
- workouts: id, date, template_id, mesocycle_id, week_in_block, notes
- workout_sets: id, workout_id, exercise_id, set_number, weight_kg, reps, rir
- readiness: id, date, sleep_hours, soreness, energy, notes
- meals: id, name, type (breakfast/dinner), kcal, protein_g, fat_g, carbs_g, is_air_fryer, makes_leftovers
- meal_ingredients: id, meal_id, ingredient_name, quantity, unit, supermarket_aisle
- meal_plan: id, date, breakfast_meal_id, dinner_meal_id (lunch is derived = previous day's dinner)
- pantry (added in Phase 9): id, ingredient_name, quantity, unit

## 9. Tech stack and deployment

Primary use is on my PHONE (at the gym, the supermarket), but I build on my laptop. So it must be deployed and reachable from my phone at all times, without my laptop being on.

- Next.js (App Router), TypeScript.
- Database: libSQL via Turso (SQLite-compatible, works locally for dev AND on serverless), accessed through Prisma. Keeps the SQLite mental model but is reachable once deployed.
- Deploy to Vercel EARLY (Phase 1) so phone access is proven from the start.
- PWA: add a web app manifest and service worker so it installs to my phone home screen and behaves like a native app.
- Simple auth: a single password or PIN gate, because it lives on the public internet. No multi-user system, just protect my data.
- Charts: Recharts.
- Front end deliberately minimal at first, but MOBILE-FIRST layout since the phone is the primary device. Polish comes later.

## 10. Build phases (one focused session each)

- Phase 1: Scaffold + data layer (Next.js, Turso/libSQL via Prisma, schema + seed from this spec). Deploy a skeleton to Vercel to confirm phone access works early.
- Phase 2: Body tracking (log weight/body fat, trend chart).
- Phase 3: Workout logging (pick today's session, log weight, reps, and RIR per set).
- Phase 4: Progression engine (autoregulated double progression + mesocycle/volume periodisation + deloads). Start simple, ramp up.
- Phase 5: Recovery (readiness check-in feeding autoregulation, deload scheduling, rest-day guidance).
- Phase 6: Nutrition (daily meal plan hitting targets, day view).
- Phase 7: Shopping list (aggregate next week's meals into a categorised list WITH total quantities and units per ingredient, grouped by supermarket aisle).
- Phase 8: PWA + auth polish (home-screen install, password gate, mobile UX pass).
- Phase 9 (later): Fridge/pantry inventory. I enter what I already have, and the shopping list subtracts it so quantities update to only what I still need.
- Phase 10 (optional): Claude API "coach" layer for ambitious, motivational messaging and smart adjustments.

## 11. Working rules for Claude Code

- Read this file at the start of every session.
- Work on ONE phase at a time. Do not jump ahead.
- Before writing code, show a short plan and wait for my approval.
- Keep it simple. Prefer the boring, robust solution.
- Do not add features, libraries, or abstractions not requested. Ask first.
- After each phase, the app must run, be deployed, and the new feature must be testable by hand on my phone.
