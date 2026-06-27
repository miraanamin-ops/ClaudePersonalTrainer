import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// ---------------------------------------------------------------------------
// EXERCISES
// ---------------------------------------------------------------------------

const exerciseData = [
  // Upper body
  { name: 'Dumbbell Chest Press',    muscleGroup: 'chest',           repRangeLow: 6,  repRangeHigh: 10, incrementKg: 2.5 },
  { name: 'Lat Pulldown',            muscleGroup: 'back',            repRangeLow: 6,  repRangeHigh: 10, incrementKg: 2.5 },
  { name: 'Dumbbell Row',            muscleGroup: 'back',            repRangeLow: 6,  repRangeHigh: 10, incrementKg: 2.5 },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders',       repRangeLow: 6,  repRangeHigh: 10, incrementKg: 2.5 },
  { name: 'Bicep Curl',              muscleGroup: 'biceps',          repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  { name: 'Tricep Pushdown',         muscleGroup: 'triceps',         repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  // Lower body
  { name: 'Squat',                   muscleGroup: 'quads',           repRangeLow: 6,  repRangeHigh: 10, incrementKg: 5.0 },
  { name: 'Romanian Deadlift',       muscleGroup: 'hamstrings',      repRangeLow: 6,  repRangeHigh: 10, incrementKg: 5.0 },
  { name: 'Leg Press',               muscleGroup: 'quads',           repRangeLow: 6,  repRangeHigh: 10, incrementKg: 5.0 },
  { name: 'Hamstring Curl',          muscleGroup: 'hamstrings',      repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  { name: 'Leg Extension',           muscleGroup: 'quads',           repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  { name: 'Calf Raise',              muscleGroup: 'calves',          repRangeLow: 10, repRangeHigh: 15, incrementKg: 2.5 },
  // Full Body B extras
  { name: 'Deadlift',                muscleGroup: 'posterior chain', repRangeLow: 5,  repRangeHigh: 8,  incrementKg: 5.0 },
  { name: 'Incline Dumbbell Press',  muscleGroup: 'chest',           repRangeLow: 6,  repRangeHigh: 10, incrementKg: 2.5 },
]

// ---------------------------------------------------------------------------
// WORKOUT TEMPLATES
// ---------------------------------------------------------------------------

const templateData = [
  {
    name: 'Upper',
    exercises: [
      { name: 'Dumbbell Chest Press',    sets: 3 },
      { name: 'Lat Pulldown',            sets: 3 },
      { name: 'Dumbbell Row',            sets: 3 },
      { name: 'Dumbbell Shoulder Press', sets: 3 },
      { name: 'Bicep Curl',              sets: 3 },
      { name: 'Tricep Pushdown',         sets: 3 },
    ],
  },
  {
    name: 'Lower',
    exercises: [
      { name: 'Squat',             sets: 3 },
      { name: 'Romanian Deadlift', sets: 3 },
      { name: 'Leg Extension',     sets: 3 },
      { name: 'Hamstring Curl',    sets: 3 },
      { name: 'Calf Raise',        sets: 3 },
    ],
  },
  {
    name: 'Full Body A',
    exercises: [
      { name: 'Squat',                   sets: 3 },
      { name: 'Dumbbell Chest Press',    sets: 3 },
      { name: 'Dumbbell Row',            sets: 3 },
      { name: 'Dumbbell Shoulder Press', sets: 3 },
    ],
  },
  {
    name: 'Full Body B',
    exercises: [
      { name: 'Deadlift',               sets: 3 },
      { name: 'Lat Pulldown',           sets: 3 },
      { name: 'Leg Press',              sets: 3 },
      { name: 'Incline Dumbbell Press', sets: 3 },
    ],
  },
]

// ---------------------------------------------------------------------------
// MEALS
// type: "breakfast" | "dinner" | "snack" | "supplement"
// Dinner macros are per serving (dinner makes 2 portions; 1 eaten tonight,
// 1 saved as next day's lunch).
// All halal — no pork anywhere.
// ---------------------------------------------------------------------------

type Ingredient = {
  ingredientName: string
  quantity: number
  unit: string
  supermarketAisle: string
}

type MealData = {
  name: string
  type: string
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  isAirFryer: boolean
  makesLeftovers: boolean
  ingredients: Ingredient[]
}

const mealData: MealData[] = [
  // -------------------------------------------------------------------------
  // BREAKFASTS
  // -------------------------------------------------------------------------
  {
    name: 'Greek Yogurt Parfait with Berries & Granola',
    type: 'breakfast', kcal: 540, proteinG: 42, fatG: 8, carbsG: 72,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Greek yogurt (0% fat)', quantity: 300, unit: 'g',   supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Mixed berries (frozen)', quantity: 100, unit: 'g',  supermarketAisle: 'frozen' },
      { ingredientName: 'Granola',               quantity: 60,  unit: 'g',   supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Honey',                 quantity: 1,   unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Scrambled Eggs on Sourdough',
    type: 'breakfast', kcal: 480, proteinG: 28, fatG: 18, carbsG: 52,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs',           quantity: 3, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Sourdough bread', quantity: 2, unit: 'slices', supermarketAisle: 'bakery' },
      { ingredientName: 'Butter',         quantity: 5, unit: 'g',     supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Salt & pepper',  quantity: 1, unit: 'pinch', supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Chicken & Egg Omelette',
    type: 'breakfast', kcal: 420, proteinG: 45, fatG: 22, carbsG: 8,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs',                     quantity: 3,   unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Halal chicken breast (cooked)', quantity: 100, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Baby spinach',             quantity: 30,  unit: 'g',     supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',                quantity: 5,   unit: 'ml',    supermarketAisle: 'oils & vinegars' },
    ],
  },
  {
    name: 'Protein Overnight Oats with Banana',
    type: 'breakfast', kcal: 520, proteinG: 42, fatG: 9, carbsG: 72,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Oats',               quantity: 80,  unit: 'g',  supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',  supermarketAisle: 'supplements' },
      { ingredientName: 'Whole milk',          quantity: 250, unit: 'ml', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Banana',              quantity: 1,   unit: 'medium', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Chia seeds',          quantity: 10,  unit: 'g',  supermarketAisle: 'health foods' },
    ],
  },
  {
    name: 'Egg & Halal Turkey Sausage Muffins',
    type: 'breakfast', kcal: 380, proteinG: 36, fatG: 22, carbsG: 14,
    isAirFryer: true, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs',                  quantity: 4,   unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Halal turkey sausage',  quantity: 100, unit: 'g',     supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Cheddar cheese',        quantity: 20,  unit: 'g',     supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Red pepper',            quantity: 50,  unit: 'g',     supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil spray',       quantity: 2,   unit: 'g',     supermarketAisle: 'oils & vinegars' },
    ],
  },
  {
    name: 'Smoked Salmon Bagel with Cream Cheese',
    type: 'breakfast', kcal: 560, proteinG: 38, fatG: 16, carbsG: 62,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Plain bagel',      quantity: 1,   unit: 'whole', supermarketAisle: 'bakery' },
      { ingredientName: 'Smoked salmon',    quantity: 100, unit: 'g',     supermarketAisle: 'fish counter' },
      { ingredientName: 'Cream cheese',     quantity: 30,  unit: 'g',     supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Cucumber',         quantity: 50,  unit: 'g',     supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Capers',           quantity: 10,  unit: 'g',     supermarketAisle: 'condiments & sauces' },
    ],
  },

  // -------------------------------------------------------------------------
  // DINNERS (all make leftovers — next day's lunch)
  // -------------------------------------------------------------------------
  {
    name: 'Air Fryer Salmon with Basmati Rice & Broccoli',
    type: 'dinner', kcal: 760, proteinG: 58, fatG: 22, carbsG: 82,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Salmon fillet',   quantity: 200, unit: 'g',    supermarketAisle: 'fish counter' },
      { ingredientName: 'Basmati rice (dry)', quantity: 150, unit: 'g', supermarketAisle: 'world foods' },
      { ingredientName: 'Broccoli',        quantity: 200, unit: 'g',    supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',       quantity: 10,  unit: 'ml',   supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Lemon',           quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic',          quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Soy sauce',       quantity: 15,  unit: 'ml',   supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Air Fryer Chicken Thighs with Sweet Potato & Green Beans',
    type: 'dinner', kcal: 820, proteinG: 62, fatG: 28, carbsG: 76,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken thighs (skin-on)', quantity: 250, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Sweet potato',    quantity: 300, unit: 'g',    supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Green beans',     quantity: 150, unit: 'g',    supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',       quantity: 15,  unit: 'ml',   supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic powder',   quantity: 2,   unit: 'g',    supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Smoked paprika',  quantity: 2,   unit: 'g',    supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Mixed herbs',     quantity: 2,   unit: 'g',    supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Halal Chicken & Rice Bowl',
    type: 'dinner', kcal: 780, proteinG: 68, fatG: 14, carbsG: 95,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast', quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Basmati rice (dry)',   quantity: 150, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Frozen peas',          quantity: 100, unit: 'g',  supermarketAisle: 'frozen' },
      { ingredientName: 'Chicken stock',        quantity: 200, unit: 'ml', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Garlic',               quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',            quantity: 10,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Cumin',                quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Air Fryer Beef Kofta with Couscous & Salad',
    type: 'dinner', kcal: 850, proteinG: 55, fatG: 32, carbsG: 84,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal beef mince (lean)', quantity: 250, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Couscous (dry)',          quantity: 120, unit: 'g', supermarketAisle: 'world foods' },
      { ingredientName: 'Mixed salad leaves',      quantity: 80,  unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion',                   quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Cumin',                   quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Ground coriander',        quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Olive oil',               quantity: 10,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Lemon',                   quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Salmon & Potato Tray Bake with Asparagus',
    type: 'dinner', kcal: 720, proteinG: 52, fatG: 26, carbsG: 68,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Salmon fillet',  quantity: 180, unit: 'g',  supermarketAisle: 'fish counter' },
      { ingredientName: 'New potatoes',   quantity: 300, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Asparagus',      quantity: 150, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',      quantity: 20,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Lemon',          quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic',         quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Fresh dill',     quantity: 5,   unit: 'g',  supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Air Fryer Chicken Breast with Pasta & Tomato Sauce',
    type: 'dinner', kcal: 810, proteinG: 64, fatG: 14, carbsG: 108,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast', quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Penne pasta (dry)',     quantity: 150, unit: 'g',  supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Passata',              quantity: 200, unit: 'g',  supermarketAisle: 'tins & jars' },
      { ingredientName: 'Garlic',               quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',            quantity: 10,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Fresh basil',          quantity: 5,   unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Parmesan',             quantity: 20,  unit: 'g',  supermarketAisle: 'dairy & eggs' },
    ],
  },
  {
    name: 'Halal Beef Bolognese with Spaghetti',
    type: 'dinner', kcal: 850, proteinG: 56, fatG: 28, carbsG: 100,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal beef mince (lean)', quantity: 250, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Spaghetti (dry)',         quantity: 150, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Passata',                quantity: 200, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Onion',                  quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic',                 quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',              quantity: 10,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Mixed Italian herbs',    quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Air Fryer Chicken Shawarma Bowl with Rice',
    type: 'dinner', kcal: 870, proteinG: 68, fatG: 26, carbsG: 88,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken thighs (boneless)', quantity: 250, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Basmati rice (dry)',  quantity: 150, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Plain yogurt',        quantity: 60,  unit: 'g',  supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Garlic',              quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Cumin',              quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Turmeric',           quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Smoked paprika',     quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Lemon',              quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Chicken & Vegetable Stir Fry with Brown Rice',
    type: 'dinner', kcal: 720, proteinG: 56, fatG: 18, carbsG: 82,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast',  quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Brown rice (dry)',       quantity: 150, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Mixed stir fry veg',    quantity: 200, unit: 'g',  supermarketAisle: 'frozen' },
      { ingredientName: 'Soy sauce',             quantity: 30,  unit: 'ml', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Sesame oil',            quantity: 5,   unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic',                quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Fresh ginger',          quantity: 5,   unit: 'g',  supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Air Fryer Salmon with Quinoa & Roasted Veg',
    type: 'dinner', kcal: 730, proteinG: 54, fatG: 28, carbsG: 70,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Salmon fillet',  quantity: 180, unit: 'g',  supermarketAisle: 'fish counter' },
      { ingredientName: 'Quinoa (dry)',   quantity: 120, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Courgette',      quantity: 150, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Red pepper',     quantity: 150, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',      quantity: 15,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Lemon',          quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic',         quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Air Fryer Lamb Chops with Roasted Potatoes',
    type: 'dinner', kcal: 890, proteinG: 58, fatG: 40, carbsG: 72,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal lamb chops', quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Potatoes',         quantity: 350, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil',        quantity: 20,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic',           quantity: 3,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Fresh rosemary',   quantity: 5,   unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Mint sauce',       quantity: 30,  unit: 'g',  supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Turkey Mince Chilli with Brown Rice',
    type: 'dinner', kcal: 780, proteinG: 64, fatG: 18, carbsG: 88,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal turkey mince',       quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Brown rice (dry)',          quantity: 150, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Kidney beans (tinned)',     quantity: 200, unit: 'g',  supermarketAisle: 'tins & jars' },
      { ingredientName: 'Chopped tomatoes (tinned)', quantity: 200, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Onion',                    quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Chilli powder',            quantity: 3,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Cumin',                    quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Air Fryer Cod & Sweet Potato Wedges with Peas',
    type: 'dinner', kcal: 680, proteinG: 50, fatG: 12, carbsG: 90,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Cod fillet',      quantity: 200, unit: 'g',  supermarketAisle: 'fish counter' },
      { ingredientName: 'Sweet potato',    quantity: 350, unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Frozen peas',     quantity: 150, unit: 'g',  supermarketAisle: 'frozen' },
      { ingredientName: 'Olive oil',       quantity: 10,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika',  quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Garlic powder',   quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Lemon',           quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Halal Chicken Curry with Basmati Rice',
    type: 'dinner', kcal: 860, proteinG: 62, fatG: 24, carbsG: 96,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast',      quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Basmati rice (dry)',         quantity: 150, unit: 'g',  supermarketAisle: 'world foods' },
      { ingredientName: 'Chopped tomatoes (tinned)',  quantity: 200, unit: 'g',  supermarketAisle: 'tins & jars' },
      { ingredientName: 'Onion',                     quantity: 1,   unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic',                    quantity: 3,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Fresh ginger',              quantity: 10,  unit: 'g',  supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Curry powder',              quantity: 5,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Coconut milk',              quantity: 100, unit: 'ml', supermarketAisle: 'world foods' },
    ],
  },

  // -------------------------------------------------------------------------
  // SNACKS
  // -------------------------------------------------------------------------
  {
    name: 'Rice Cakes with Peanut Butter',
    type: 'snack', kcal: 280, proteinG: 8, fatG: 12, carbsG: 36,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Rice cakes',               quantity: 4,  unit: 'whole', supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Peanut butter (smooth)',   quantity: 30, unit: 'g',     supermarketAisle: 'condiments & sauces' },
    ],
  },
  {
    name: 'Almonds',
    type: 'snack', kcal: 230, proteinG: 8, fatG: 20, carbsG: 6,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Almonds', quantity: 40, unit: 'g', supermarketAisle: 'snacks & nuts' },
    ],
  },
  {
    name: 'Halal Beef Jerky',
    type: 'snack', kcal: 160, proteinG: 22, fatG: 3, carbsG: 8,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Halal beef jerky', quantity: 60, unit: 'g', supermarketAisle: 'snacks & nuts' },
    ],
  },
  {
    name: 'Cottage Cheese with Blueberries',
    type: 'snack', kcal: 185, proteinG: 22, fatG: 4, carbsG: 16,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Low-fat cottage cheese', quantity: 200, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Blueberries',            quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
    ],
  },
  {
    name: 'Apple with Almond Butter',
    type: 'snack', kcal: 250, proteinG: 5, fatG: 10, carbsG: 32,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Apple',         quantity: 1,  unit: 'medium', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Almond butter', quantity: 25, unit: 'g',      supermarketAisle: 'condiments & sauces' },
    ],
  },

  // -------------------------------------------------------------------------
  // PROTEIN SHAKES
  // -------------------------------------------------------------------------
  {
    name: 'Whey Protein Shake (water)',
    type: 'snack', kcal: 130, proteinG: 25, fatG: 2, carbsG: 4,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',  supermarketAisle: 'supplements' },
      { ingredientName: 'Water',               quantity: 300, unit: 'ml', supermarketAisle: 'n/a' },
    ],
  },
  {
    name: 'Whey Protein Shake with Milk',
    type: 'snack', kcal: 290, proteinG: 33, fatG: 8, carbsG: 18,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',  supermarketAisle: 'supplements' },
      { ingredientName: 'Whole milk',          quantity: 300, unit: 'ml', supermarketAisle: 'dairy & eggs' },
    ],
  },
  {
    name: 'Banana Protein Shake',
    type: 'snack', kcal: 380, proteinG: 36, fatG: 6, carbsG: 52,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',     supermarketAisle: 'supplements' },
      { ingredientName: 'Whole milk',          quantity: 250, unit: 'ml',    supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Banana',              quantity: 1,   unit: 'medium', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Oats',               quantity: 40,  unit: 'g',     supermarketAisle: 'cereals & breakfast' },
    ],
  },

  // -------------------------------------------------------------------------
  // SUPPLEMENTS
  // -------------------------------------------------------------------------
  {
    name: 'Creatine Monohydrate (5 g)',
    type: 'supplement', kcal: 0, proteinG: 0, fatG: 0, carbsG: 0,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Creatine monohydrate', quantity: 5, unit: 'g', supermarketAisle: 'supplements' },
    ],
  },
]

// ---------------------------------------------------------------------------
// SEED RUNNER
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Create .env.local with your Turso credentials.')
  }

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('🌱 Seeding database...')

    // Clear existing seed data (safe to re-run)
    await prisma.mealIngredient.deleteMany()
    await prisma.mealPlan.deleteMany()
    await prisma.meal.deleteMany()
    await prisma.templateExercise.deleteMany()
    await prisma.workoutTemplate.deleteMany()
    await prisma.exercise.deleteMany()

    // Exercises
    await prisma.exercise.createMany({ data: exerciseData })
    const dbExercises = await prisma.exercise.findMany()
    const byName = (name: string) => {
      const ex = dbExercises.find(e => e.name === name)
      if (!ex) throw new Error(`Exercise not found: ${name}`)
      return ex
    }
    console.log(`  ✓ ${dbExercises.length} exercises`)

    // Templates + template exercises
    for (const template of templateData) {
      await prisma.workoutTemplate.create({
        data: {
          name: template.name,
          isActive: true,
          templateExercises: {
            create: template.exercises.map((ex, i) => ({
              exerciseId: byName(ex.name).id,
              order: i + 1,
              targetSets: ex.sets,
            })),
          },
        },
      })
    }
    console.log(`  ✓ ${templateData.length} workout templates`)

    // Meals + ingredients
    for (const meal of mealData) {
      const { ingredients, ...mealFields } = meal
      await prisma.meal.create({
        data: {
          ...mealFields,
          ingredients: { create: ingredients },
        },
      })
    }
    console.log(`  ✓ ${mealData.length} meals (breakfasts, dinners, snacks, shakes, creatine)`)

    console.log('✅ Seed complete.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
