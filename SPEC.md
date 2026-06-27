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

## 5. Training plan

Split (driven by days available):
- 4 days: Upper / Lower / Upper / Lower
- 3 days: Full Body A / Full Body B / Full Body A (alternating each week)

Starting exercise selection (beginner, commercial gym; editable):
- Upper: dumbbell chest press (user prefers this; does NOT like the barbell bench press), lat pulldown or row, shoulder press, bicep curl, tricep pushdown.
- Lower: squat or leg press, Romanian deadlift or hamstring curl, leg extension, calf raise.
- Full Body A: squat, dumbbell chest press, row, shoulder press.
- Full Body B: deadlift or RDL, lat pulldown, leg press, incline press.

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

Beginner ramp (important): for the first 1 to 2 blocks, keep it simple. Conservative loads, focus on technique, double progression only, moderate volume. The app introduces full periodisation and volume progression once a baseline of consistent logging exists.

## 6. Recovery (part of training, not separate)

- Daily readiness check-in: sleep hours, soreness (1 to 5), energy (1 to 5). Low readiness makes the app dial back today's target RIR, suggest a lighter session, or recommend rest. This feeds the autoregulation above.
- Deloads: scheduled automatically at the end of each mesocycle, and triggered early (reactive deload) if readiness or performance drops repeatedly.
- Rest-day guidance, plus protein and sleep nudges.

## 7. Data model (Phase 1 builds the core; later tables added in their phase)

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

## 8. Tech stack and deployment

Primary use is on my PHONE (at the gym, the supermarket), but I build on my laptop. So it must be deployed and reachable from my phone at all times, without my laptop being on.

- Next.js (App Router), TypeScript.
- Database: libSQL via Turso (SQLite-compatible, works locally for dev AND on serverless), accessed through Prisma. Keeps the SQLite mental model but is reachable once deployed.
- Deploy to Vercel EARLY (Phase 1) so phone access is proven from the start.
- PWA: add a web app manifest and service worker so it installs to my phone home screen and behaves like a native app.
- Simple auth: a single password or PIN gate, because it lives on the public internet. No multi-user system, just protect my data.
- Charts: Recharts.
- Front end deliberately minimal at first, but MOBILE-FIRST layout since the phone is the primary device. Polish comes later.

## 9. Build phases (one focused session each)

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

## 10. Working rules for Claude Code

- Read this file at the start of every session.
- Work on ONE phase at a time. Do not jump ahead.
- Before writing code, show a short plan and wait for my approval.
- Keep it simple. Prefer the boring, robust solution.
- Do not add features, libraries, or abstractions not requested. Ask first.
- After each phase, the app must run, be deployed, and the new feature must be testable by hand on my phone.
