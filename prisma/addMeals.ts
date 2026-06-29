/**
 * Adds new meals to the database WITHOUT wiping existing data.
 * Paste the AI-generated meal array into newMeals below, then run:
 *   npx tsx prisma/addMeals.ts
 */
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
// PASTE AI-GENERATED MEALS HERE
// ---------------------------------------------------------------------------

type Ingredient = {
  ingredientName: string
  quantity: number
  unit: string
  supermarketAisle: string
}

type NewMeal = {
  name: string
  type: 'breakfast' | 'dinner' | 'snack'
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  isAirFryer: boolean
  makesLeftovers: boolean
  ingredients: Ingredient[]
  instructions: string[]
}

const newMeals: NewMeal[] = [
  {
    name: 'Cottage Cheese & Spinach Egg Scramble',
    type: 'breakfast',
    kcal: 420, proteinG: 38, fatG: 28, carbsG: 8,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs', quantity: 3, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Cottage cheese (low-fat)', quantity: 150, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Baby spinach', quantity: 50, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil', quantity: 10, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Crack the eggs into a bowl and whisk with a pinch of salt and the smoked paprika.',
      'Heat the olive oil in a non-stick pan over medium heat.',
      'Add the baby spinach and stir until wilted, about 1 minute.',
      'Pour in the eggs and stir gently until almost set.',
      'Fold through the cottage cheese and cook for another 30 seconds until just warmed.',
      'Serve straight away.',
    ],
  },
  {
    name: 'Whey Protein Oat Pancakes',
    type: 'breakfast',
    kcal: 445, proteinG: 40, fatG: 11, carbsG: 41,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Oats', quantity: 50, unit: 'g', supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Whey protein powder', quantity: 30, unit: 'g', supermarketAisle: 'supplements' },
      { ingredientName: 'Eggs', quantity: 1, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Whole milk', quantity: 100, unit: 'ml', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Butter', quantity: 5, unit: 'g', supermarketAisle: 'dairy & eggs' },
    ],
    instructions: [
      'Blitz the oats to a rough flour in a blender or use fine oats.',
      'Add the whey, egg and milk and blend to a smooth batter.',
      'Heat a non-stick pan over medium heat and add the butter.',
      'Spoon in small rounds of batter and cook for 2 minutes until bubbles form on top.',
      'Flip and cook for a further 1 to 2 minutes until golden.',
      'Stack and serve warm.',
    ],
  },
  {
    name: 'Air Fryer Cheesy Veggie Egg Muffins',
    type: 'breakfast',
    kcal: 426, proteinG: 33, fatG: 30, carbsG: 5,
    isAirFryer: true, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs', quantity: 4, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Cheddar cheese', quantity: 30, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Red pepper', quantity: 50, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Baby spinach', quantity: 30, unit: 'g', supermarketAisle: 'fruit & veg' },
    ],
    instructions: [
      'Preheat the air fryer to 180C.',
      'Finely dice the red pepper and roughly chop the spinach.',
      'Whisk the eggs with a pinch of salt, then stir in the pepper, spinach and grated cheddar.',
      'Divide the mixture between silicone muffin moulds.',
      'Air fry at 180C for 10 to 12 minutes until set and golden on top.',
      'Cool for a minute, then turn out and serve.',
    ],
  },
  {
    name: 'Greek Yogurt Protein Oat Bowl',
    type: 'breakfast',
    kcal: 403, proteinG: 44, fatG: 5, carbsG: 46,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Greek yogurt (0% fat)', quantity: 200, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Oats', quantity: 55, unit: 'g', supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Whey protein powder', quantity: 20, unit: 'g', supermarketAisle: 'supplements' },
    ],
    instructions: [
      'Tip the oats into a bowl and just cover with boiling water.',
      'Stir and leave to soften for 3 to 4 minutes.',
      'Mix the whey protein into the Greek yogurt until smooth.',
      'Spoon the softened oats into a serving bowl.',
      'Top with the protein yogurt and stir through, or layer for a bit of texture.',
      'Serve straight away.',
    ],
  },
  {
    name: 'Egg & Tomato Shakshuka-Style Scramble',
    type: 'breakfast',
    kcal: 549, proteinG: 34, fatG: 35, carbsG: 12,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs', quantity: 4, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Chopped tomatoes (tinned)', quantity: 100, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Onion', quantity: 50, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Red pepper', quantity: 50, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Cheddar cheese', quantity: 30, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 10, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Cumin', quantity: 0.5, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Heat the olive oil in a non-stick pan over medium heat.',
      'Add the diced onion and red pepper and soften for 4 to 5 minutes.',
      'Stir in the chopped tomatoes, smoked paprika and cumin and simmer for 3 minutes.',
      'Whisk the eggs and pour into the pan, stirring gently to scramble through the sauce.',
      'When almost set, scatter over the grated cheddar.',
      'Cook for another 30 seconds until the cheese melts, then serve.',
    ],
  },
  {
    name: 'Air Fryer Courgette & Cheddar Frittata',
    type: 'breakfast',
    kcal: 504, proteinG: 35, fatG: 39, carbsG: 4,
    isAirFryer: true, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Eggs', quantity: 4, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Courgette', quantity: 80, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Cheddar cheese', quantity: 40, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 5, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic powder', quantity: 0.5, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 170C.',
      'Coarsely grate the courgette and squeeze out excess water.',
      'Whisk the eggs with the garlic powder, a pinch of salt, the courgette and grated cheddar.',
      'Brush a small heatproof dish with the olive oil and pour in the mixture.',
      'Air fry at 170C for 12 to 14 minutes until set and golden.',
      'Rest for a minute, then slice and serve.',
    ],
  },
  {
    name: 'Cottage Cheese Overnight Oats',
    type: 'breakfast',
    kcal: 423, proteinG: 40, fatG: 11, carbsG: 44,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Oats', quantity: 50, unit: 'g', supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Cottage cheese (low-fat)', quantity: 150, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Whole milk', quantity: 100, unit: 'ml', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Whey protein powder', quantity: 15, unit: 'g', supermarketAisle: 'supplements' },
    ],
    instructions: [
      'Add the oats, whey protein and milk to a jar or bowl and stir well.',
      'Spoon in the cottage cheese and mix through until combined.',
      'Cover and refrigerate overnight, or for at least 4 hours.',
      'In the morning, give it a good stir and loosen with a splash of milk if needed.',
      'Eat cold straight from the jar.',
    ],
  },
  {
    name: 'Air Fryer Sweet Potato & Egg Hash',
    type: 'breakfast',
    kcal: 523, proteinG: 30, fatG: 34, carbsG: 26,
    isAirFryer: true, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Sweet potato', quantity: 120, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Eggs', quantity: 3, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Cheddar cheese', quantity: 40, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 5, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 190C.',
      'Dice the sweet potato into 1cm cubes and toss with the olive oil and smoked paprika.',
      'Air fry at 190C for 12 minutes, shaking halfway, until tender and crisp.',
      'Whisk the eggs and pour over the hot sweet potato in a small heatproof dish.',
      'Scatter over the grated cheddar and air fry at 180C for a further 5 to 6 minutes until the eggs set.',
      'Serve straight from the dish.',
    ],
  },
  {
    name: 'Whey Protein Porridge',
    type: 'breakfast',
    kcal: 473, proteinG: 39, fatG: 15, carbsG: 48,
    isAirFryer: false, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Oats', quantity: 50, unit: 'g', supermarketAisle: 'cereals & breakfast' },
      { ingredientName: 'Whole milk', quantity: 250, unit: 'ml', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Whey protein powder', quantity: 30, unit: 'g', supermarketAisle: 'supplements' },
    ],
    instructions: [
      'Add the oats and milk to a small saucepan over medium heat.',
      'Cook, stirring often, for 4 to 5 minutes until thick and creamy.',
      'Remove from the heat and let it cool for a minute so the whey does not clump.',
      'Stir the whey protein through until fully dissolved.',
      'Loosen with a splash more milk if needed and serve warm.',
    ],
  },
  {
    name: 'Air Fryer Turkey & Egg Breakfast Cups',
    type: 'breakfast',
    kcal: 451, proteinG: 39, fatG: 30, carbsG: 6,
    isAirFryer: true, makesLeftovers: false,
    ingredients: [
      { ingredientName: 'Halal turkey mince', quantity: 60, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Eggs', quantity: 3, unit: 'whole', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Red pepper', quantity: 40, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion', quantity: 30, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Cheddar cheese', quantity: 20, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 5, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic powder', quantity: 0.5, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 180C.',
      'Brown the turkey mince with the olive oil, garlic powder and a pinch of salt in a pan for 4 minutes.',
      'Finely dice the red pepper and onion and stir through the turkey, then remove from the heat.',
      'Whisk the eggs and combine with the turkey mixture and grated cheddar.',
      'Divide between silicone muffin moulds.',
      'Air fry at 180C for 10 to 12 minutes until set, then turn out and serve.',
    ],
  },
  {
    name: 'Air Fryer Garlic Butter Chicken with Sweet Potato Mash & Broccoli',
    type: 'dinner',
    kcal: 751, proteinG: 69, fatG: 29, carbsG: 50,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast', quantity: 400, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Sweet potato', quantity: 400, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Broccoli', quantity: 300, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Butter', quantity: 30, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Garlic', quantity: 3, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil', quantity: 20, unit: 'ml', supermarketAisle: 'oils & vinegars' },
    ],
    instructions: [
      'Preheat the air fryer to 190C. Note this recipe makes 2 portions.',
      'Peel and cube the sweet potato, then boil for 12 to 15 minutes until soft.',
      'Rub the chicken breasts with the olive oil and a pinch of salt and air fry at 190C for 16 to 18 minutes, turning halfway, until cooked through.',
      'Steam or boil the broccoli for 4 to 5 minutes until just tender.',
      'Melt the butter with the crushed garlic and brush over the rested chicken.',
      'Mash the sweet potato and serve half the chicken, mash and broccoli now, saving the rest for tomorrow.',
    ],
  },
  {
    name: 'Halal Beef & Sweet Potato Cottage Pie',
    type: 'dinner',
    kcal: 839, proteinG: 58, fatG: 36, carbsG: 65,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal beef mince (lean)', quantity: 400, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Sweet potato', quantity: 500, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion', quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Chopped tomatoes (tinned)', quantity: 200, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Frozen peas', quantity: 100, unit: 'g', supermarketAisle: 'frozen' },
      { ingredientName: 'Cheddar cheese', quantity: 60, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Butter', quantity: 20, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Garlic', quantity: 2, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Chicken stock', quantity: 150, unit: 'ml', supermarketAisle: 'tins & jars' },
    ],
    instructions: [
      'Preheat the oven to 200C. Note this recipe makes 2 portions.',
      'Boil the peeled, cubed sweet potato for 12 to 15 minutes until soft, then mash with the butter.',
      'Brown the beef mince in a pan, then add the diced onion and garlic and cook for 4 minutes.',
      'Stir in the chopped tomatoes, peas and stock and simmer for 10 minutes until thickened.',
      'Spoon the mince into an ovenproof dish, top with the mash and scatter over the grated cheddar.',
      'Bake at 200C for 20 to 25 minutes until golden, then serve half and save half for tomorrow.',
    ],
  },
  {
    name: 'Air Fryer Cod with Garlic Rice & Courgette',
    type: 'dinner',
    kcal: 780, proteinG: 57, fatG: 26, carbsG: 77,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Cod fillet', quantity: 500, unit: 'g', supermarketAisle: 'fish counter' },
      { ingredientName: 'Basmati rice (dry)', quantity: 160, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Courgette', quantity: 300, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Frozen peas', quantity: 160, unit: 'g', supermarketAisle: 'frozen' },
      { ingredientName: 'Garlic', quantity: 3, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Lemon', quantity: 1, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil', quantity: 30, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Butter', quantity: 20, unit: 'g', supermarketAisle: 'dairy & eggs' },
    ],
    instructions: [
      'Preheat the air fryer to 190C. Note this recipe makes 2 portions.',
      'Rinse the rice and cook in boiling water for 10 to 12 minutes, adding the peas for the last 3 minutes, then drain.',
      'Rub the cod with half the olive oil, a pinch of salt and a squeeze of lemon.',
      'Air fry the cod at 190C for 9 to 11 minutes until it flakes easily.',
      'Toss the sliced courgette with the rest of the oil and air fry alongside or after for 8 minutes.',
      'Melt the butter with the crushed garlic and stir through the rice, then serve half now and save half for tomorrow.',
    ],
  },
  {
    name: 'Halal Turkey Meatballs in Tomato Sauce with Rice',
    type: 'dinner',
    kcal: 797, proteinG: 63, fatG: 27, carbsG: 70,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal turkey mince', quantity: 400, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Passata', quantity: 300, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Onion', quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic', quantity: 3, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Basmati rice (dry)', quantity: 150, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Cheddar cheese', quantity: 40, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 20, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Mixed herbs', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Note this recipe makes 2 portions. Mix the turkey mince with the mixed herbs and a pinch of salt and roll into meatballs.',
      'Heat the olive oil in a pan and brown the meatballs all over, then remove.',
      'Soften the diced onion and garlic in the same pan for 4 minutes.',
      'Pour in the passata, return the meatballs and simmer for 15 minutes until cooked through.',
      'Meanwhile cook the rice in boiling water for 10 to 12 minutes, then drain.',
      'Scatter the grated cheddar over the meatballs to melt, then serve half with rice now and save half for tomorrow.',
    ],
  },
  {
    name: 'Air Fryer Chicken Thigh & Veg Traybake with Rice',
    type: 'dinner',
    kcal: 726, proteinG: 53, fatG: 26, carbsG: 65,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken thighs (boneless)', quantity: 480, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Red pepper', quantity: 160, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Courgette', quantity: 160, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion', quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Basmati rice (dry)', quantity: 140, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Olive oil', quantity: 15, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika', quantity: 2, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Garlic powder', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 190C. Note this recipe makes 2 portions.',
      'Toss the chicken thighs and chopped veg with the olive oil, smoked paprika, garlic powder and a pinch of salt.',
      'Air fry at 190C for 16 to 18 minutes, shaking halfway, until the chicken is cooked through and the veg is charred.',
      'Meanwhile cook the rice in boiling water for 10 to 12 minutes, then drain.',
      'Check the chicken is piping hot in the centre.',
      'Serve half the traybake over rice now and save the rest for tomorrow.',
    ],
  },
  {
    name: 'Air Fryer Salmon with Sweet Potato Mash & Spinach',
    type: 'dinner',
    kcal: 694, proteinG: 54, fatG: 37, carbsG: 46,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Salmon fillet', quantity: 480, unit: 'g', supermarketAisle: 'fish counter' },
      { ingredientName: 'Sweet potato', quantity: 400, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Baby spinach', quantity: 200, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic', quantity: 2, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Lemon', quantity: 1, unit: 'whole', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Butter', quantity: 15, unit: 'g', supermarketAisle: 'dairy & eggs' },
    ],
    instructions: [
      'Preheat the air fryer to 190C. Note this recipe makes 2 portions.',
      'Boil the peeled, cubed sweet potato for 12 to 15 minutes until soft, then mash with the butter.',
      'Season the salmon with salt and a squeeze of lemon and air fry at 190C for 9 to 11 minutes.',
      'Wilt the spinach with the crushed garlic in a hot pan for 2 minutes.',
      'Check the salmon flakes easily in the centre.',
      'Serve half the salmon with mash and spinach now and save the rest for tomorrow.',
    ],
  },
  {
    name: 'Smoky Halal Beef & Pepper Rice Bowl',
    type: 'dinner',
    kcal: 750, proteinG: 55, fatG: 27, carbsG: 72,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal beef mince (lean)', quantity: 400, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Red pepper', quantity: 200, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion', quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Chopped tomatoes (tinned)', quantity: 200, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Basmati rice (dry)', quantity: 150, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Cheddar cheese', quantity: 40, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 20, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Cumin', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Smoked paprika', quantity: 2, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Note this recipe makes 2 portions. Heat the olive oil and brown the beef mince in a pan.',
      'Add the diced onion and red pepper and cook for 4 to 5 minutes until softened.',
      'Stir in the cumin and smoked paprika, then the chopped tomatoes, and simmer for 10 minutes.',
      'Meanwhile cook the rice in boiling water for 10 to 12 minutes, then drain.',
      'Spoon the beef over the rice and scatter over the grated cheddar.',
      'Serve half now and save half for tomorrow.',
    ],
  },
  {
    name: 'Air Fryer Chicken Breast with Sweet Potato Wedges & Peas',
    type: 'dinner',
    kcal: 764, proteinG: 69, fatG: 29, carbsG: 51,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken breast', quantity: 400, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Sweet potato', quantity: 400, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Frozen peas', quantity: 160, unit: 'g', supermarketAisle: 'frozen' },
      { ingredientName: 'Butter', quantity: 30, unit: 'g', supermarketAisle: 'dairy & eggs' },
      { ingredientName: 'Olive oil', quantity: 20, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Smoked paprika', quantity: 2, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 200C. Note this recipe makes 2 portions.',
      'Cut the sweet potato into wedges and toss with the olive oil and smoked paprika.',
      'Air fry the wedges at 200C for 18 to 20 minutes, shaking halfway.',
      'Season the chicken with salt and air fry at 190C for 16 to 18 minutes, turning halfway, until cooked through.',
      'Boil the peas for 3 minutes, then drain and toss with the butter.',
      'Serve half the chicken, wedges and peas now and save the rest for tomorrow.',
    ],
  },
  {
    name: 'Halal Chicken & Spinach Tomato Braise with Rice',
    type: 'dinner',
    kcal: 723, proteinG: 50, fatG: 24, carbsG: 72,
    isAirFryer: false, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal chicken thighs (boneless)', quantity: 440, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Chopped tomatoes (tinned)', quantity: 300, unit: 'g', supermarketAisle: 'tins & jars' },
      { ingredientName: 'Baby spinach', quantity: 200, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Onion', quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Garlic', quantity: 3, unit: 'cloves', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Basmati rice (dry)', quantity: 150, unit: 'g', supermarketAisle: 'pasta & rice' },
      { ingredientName: 'Cumin', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Smoked paprika', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Note this recipe makes 2 portions. Brown the diced chicken thighs in a dry pan over high heat for 4 minutes.',
      'Add the diced onion and garlic and cook for 3 minutes, then stir in the cumin and smoked paprika.',
      'Pour in the chopped tomatoes and simmer gently for 15 minutes until the chicken is tender.',
      'Stir through the spinach until wilted.',
      'Meanwhile cook the rice in boiling water for 10 to 12 minutes, then drain.',
      'Serve half the braise over rice now and save the rest for tomorrow.',
    ],
  },
  {
    name: 'Air Fryer Turkey Patties with Sweet Potato Wedges & Broccoli',
    type: 'dinner',
    kcal: 686, proteinG: 63, fatG: 21, carbsG: 62,
    isAirFryer: true, makesLeftovers: true,
    ingredients: [
      { ingredientName: 'Halal turkey mince', quantity: 440, unit: 'g', supermarketAisle: 'fresh meat & poultry' },
      { ingredientName: 'Sweet potato', quantity: 500, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Broccoli', quantity: 300, unit: 'g', supermarketAisle: 'fruit & veg' },
      { ingredientName: 'Olive oil', quantity: 20, unit: 'ml', supermarketAisle: 'oils & vinegars' },
      { ingredientName: 'Garlic powder', quantity: 1, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
      { ingredientName: 'Smoked paprika', quantity: 2, unit: 'tsp', supermarketAisle: 'condiments & sauces' },
    ],
    instructions: [
      'Preheat the air fryer to 200C. Note this recipe makes 2 portions.',
      'Cut the sweet potato into wedges, toss with half the olive oil and the smoked paprika, and air fry at 200C for 18 to 20 minutes.',
      'Mix the turkey mince with the garlic powder and a pinch of salt and shape into patties.',
      'Air fry the patties at 190C for 12 to 14 minutes, turning halfway, until cooked through.',
      'Steam or boil the broccoli for 4 to 5 minutes until just tender.',
      'Serve half the patties, wedges and broccoli now and save the rest for tomorrow.',
    ],
  },
]

// ---------------------------------------------------------------------------

async function main() {
  if (newMeals.length === 0) {
    console.log('No meals to add — paste your AI-generated meals into the newMeals array.')
    return
  }

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  const prisma = new PrismaClient({ adapter })

  try {
    for (const meal of newMeals) {
      const { ingredients, instructions, ...fields } = meal
      await prisma.meal.create({
        data: {
          ...fields,
          instructions: JSON.stringify(instructions),
          ingredients: { create: ingredients },
        },
      })
      console.log(`  ✓ ${meal.name}`)
    }
    console.log(`\nAdded ${newMeals.length} meals.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
