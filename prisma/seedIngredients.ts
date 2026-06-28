import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(root, '.env.local') })
dotenv.config({ path: path.join(root, '.env') })

import { createClient } from '@libsql/client'

type Ingredient = {
  ingredientName: string
  quantity: number
  unit: string
  supermarketAisle: string
}

const ingredientsByMeal: Record<string, Ingredient[]> = {
  'Greek Yogurt Parfait with Berries & Granola': [
    { ingredientName: 'Greek yogurt (0% fat)',  quantity: 300, unit: 'g',      supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Mixed berries (frozen)', quantity: 100, unit: 'g',      supermarketAisle: 'frozen' },
    { ingredientName: 'Granola',                quantity: 60,  unit: 'g',      supermarketAisle: 'cereals & breakfast' },
    { ingredientName: 'Honey',                  quantity: 1,   unit: 'tsp',    supermarketAisle: 'condiments & sauces' },
  ],
  'Scrambled Eggs on Sourdough': [
    { ingredientName: 'Eggs',           quantity: 3, unit: 'whole',  supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Sourdough bread', quantity: 2, unit: 'slices', supermarketAisle: 'bakery' },
    { ingredientName: 'Butter',         quantity: 5, unit: 'g',      supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Salt & pepper',  quantity: 1, unit: 'pinch',  supermarketAisle: 'condiments & sauces' },
  ],
  'Chicken & Egg Omelette': [
    { ingredientName: 'Eggs',                          quantity: 3,   unit: 'whole', supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Halal chicken breast (cooked)', quantity: 100, unit: 'g',     supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Baby spinach',                  quantity: 30,  unit: 'g',     supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',                     quantity: 5,   unit: 'ml',    supermarketAisle: 'oils & vinegars' },
  ],
  'Protein Overnight Oats with Banana': [
    { ingredientName: 'Oats',                quantity: 80,  unit: 'g',      supermarketAisle: 'cereals & breakfast' },
    { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',      supermarketAisle: 'supplements' },
    { ingredientName: 'Whole milk',          quantity: 250, unit: 'ml',     supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Banana',              quantity: 1,   unit: 'medium', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Chia seeds',          quantity: 10,  unit: 'g',      supermarketAisle: 'health foods' },
  ],
  'Egg & Halal Turkey Sausage Muffins': [
    { ingredientName: 'Eggs',                 quantity: 4,   unit: 'whole', supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Halal turkey sausage', quantity: 100, unit: 'g',     supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Cheddar cheese',       quantity: 20,  unit: 'g',     supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Red pepper',           quantity: 50,  unit: 'g',     supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil spray',      quantity: 2,   unit: 'g',     supermarketAisle: 'oils & vinegars' },
  ],
  'Smoked Salmon Bagel with Cream Cheese': [
    { ingredientName: 'Plain bagel',   quantity: 1,   unit: 'whole', supermarketAisle: 'bakery' },
    { ingredientName: 'Smoked salmon', quantity: 100, unit: 'g',     supermarketAisle: 'fish counter' },
    { ingredientName: 'Cream cheese',  quantity: 30,  unit: 'g',     supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Cucumber',      quantity: 50,  unit: 'g',     supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Capers',        quantity: 10,  unit: 'g',     supermarketAisle: 'condiments & sauces' },
  ],
  'Air Fryer Salmon with Basmati Rice & Broccoli': [
    { ingredientName: 'Salmon fillet',        quantity: 200, unit: 'g',      supermarketAisle: 'fish counter' },
    { ingredientName: 'Basmati rice (dry)',   quantity: 150, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Broccoli',             quantity: 200, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',            quantity: 10,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Lemon',                quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Garlic',               quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Soy sauce',            quantity: 15,  unit: 'ml',     supermarketAisle: 'condiments & sauces' },
  ],
  'Air Fryer Chicken Thighs with Sweet Potato & Green Beans': [
    { ingredientName: 'Halal chicken thighs (skin-on)', quantity: 250, unit: 'g',  supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Sweet potato',                   quantity: 300, unit: 'g',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Green beans',                    quantity: 150, unit: 'g',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',                      quantity: 15,  unit: 'ml', supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Garlic powder',                  quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Smoked paprika',                 quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Mixed herbs',                    quantity: 2,   unit: 'g',  supermarketAisle: 'condiments & sauces' },
  ],
  'Halal Chicken & Rice Bowl': [
    { ingredientName: 'Halal chicken breast', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Basmati rice (dry)',   quantity: 150, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Frozen peas',          quantity: 100, unit: 'g',      supermarketAisle: 'frozen' },
    { ingredientName: 'Chicken stock',        quantity: 200, unit: 'ml',     supermarketAisle: 'tins & jars' },
    { ingredientName: 'Garlic',               quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',            quantity: 10,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Cumin',                quantity: 2,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
  ],
  'Air Fryer Beef Kofta with Couscous & Salad': [
    { ingredientName: 'Halal beef mince (lean)', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Couscous (dry)',           quantity: 120, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Mixed salad leaves',       quantity: 80,  unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Onion',                    quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Cumin',                    quantity: 3,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Ground coriander',         quantity: 3,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Olive oil',                quantity: 10,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Lemon',                    quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
  ],
  'Salmon & Potato Tray Bake with Asparagus': [
    { ingredientName: 'Salmon fillet', quantity: 180, unit: 'g',      supermarketAisle: 'fish counter' },
    { ingredientName: 'New potatoes',  quantity: 300, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Asparagus',     quantity: 150, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',     quantity: 20,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Lemon',         quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Garlic',        quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Fresh dill',    quantity: 5,   unit: 'g',      supermarketAisle: 'fruit & veg' },
  ],
  'Air Fryer Chicken Breast with Pasta & Tomato Sauce': [
    { ingredientName: 'Halal chicken breast', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Penne pasta (dry)',    quantity: 150, unit: 'g',      supermarketAisle: 'pasta & rice' },
    { ingredientName: 'Passata',             quantity: 200, unit: 'g',      supermarketAisle: 'tins & jars' },
    { ingredientName: 'Garlic',              quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',           quantity: 10,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Fresh basil',         quantity: 5,   unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Parmesan',            quantity: 20,  unit: 'g',      supermarketAisle: 'dairy & eggs' },
  ],
  'Halal Beef Bolognese with Spaghetti': [
    { ingredientName: 'Halal beef mince (lean)', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Spaghetti (dry)',         quantity: 150, unit: 'g',      supermarketAisle: 'pasta & rice' },
    { ingredientName: 'Passata',                quantity: 200, unit: 'g',      supermarketAisle: 'tins & jars' },
    { ingredientName: 'Onion',                  quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Garlic',                 quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',              quantity: 10,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Mixed Italian herbs',    quantity: 3,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
  ],
  'Air Fryer Chicken Shawarma Bowl with Rice': [
    { ingredientName: 'Halal chicken thighs (boneless)', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Basmati rice (dry)',              quantity: 150, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Plain yogurt',                    quantity: 60,  unit: 'g',      supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Garlic',                          quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Cumin',                           quantity: 3,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Turmeric',                        quantity: 2,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Smoked paprika',                  quantity: 3,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Lemon',                           quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
  ],
  'Chicken & Vegetable Stir Fry with Brown Rice': [
    { ingredientName: 'Halal chicken breast', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Brown rice (dry)',     quantity: 150, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Mixed stir fry veg',  quantity: 200, unit: 'g',      supermarketAisle: 'frozen' },
    { ingredientName: 'Soy sauce',           quantity: 30,  unit: 'ml',     supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Sesame oil',          quantity: 5,   unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Garlic',              quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Fresh ginger',        quantity: 5,   unit: 'g',      supermarketAisle: 'fruit & veg' },
  ],
  'Air Fryer Salmon with Quinoa & Roasted Veg': [
    { ingredientName: 'Salmon fillet', quantity: 180, unit: 'g',      supermarketAisle: 'fish counter' },
    { ingredientName: 'Quinoa (dry)',  quantity: 120, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Courgette',    quantity: 150, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Red pepper',   quantity: 150, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',    quantity: 15,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Lemon',        quantity: 0.5, unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Garlic',       quantity: 2,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
  ],
  'Air Fryer Lamb Chops with Roasted Potatoes': [
    { ingredientName: 'Halal lamb chops', quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Potatoes',         quantity: 350, unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Olive oil',        quantity: 20,  unit: 'ml',     supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Garlic',           quantity: 3,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Fresh rosemary',   quantity: 5,   unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Mint sauce',       quantity: 30,  unit: 'g',      supermarketAisle: 'condiments & sauces' },
  ],
  'Turkey Mince Chilli with Brown Rice': [
    { ingredientName: 'Halal turkey mince',        quantity: 250, unit: 'g',     supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Brown rice (dry)',           quantity: 150, unit: 'g',     supermarketAisle: 'world foods' },
    { ingredientName: 'Kidney beans (tinned)',      quantity: 200, unit: 'g',     supermarketAisle: 'tins & jars' },
    { ingredientName: 'Chopped tomatoes (tinned)',  quantity: 200, unit: 'g',     supermarketAisle: 'tins & jars' },
    { ingredientName: 'Onion',                     quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Chilli powder',             quantity: 3,   unit: 'g',     supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Cumin',                     quantity: 2,   unit: 'g',     supermarketAisle: 'condiments & sauces' },
  ],
  'Air Fryer Cod & Sweet Potato Wedges with Peas': [
    { ingredientName: 'Cod fillet',     quantity: 200, unit: 'g',     supermarketAisle: 'fish counter' },
    { ingredientName: 'Sweet potato',   quantity: 350, unit: 'g',     supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Frozen peas',    quantity: 150, unit: 'g',     supermarketAisle: 'frozen' },
    { ingredientName: 'Olive oil',      quantity: 10,  unit: 'ml',    supermarketAisle: 'oils & vinegars' },
    { ingredientName: 'Smoked paprika', quantity: 2,   unit: 'g',     supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Garlic powder',  quantity: 2,   unit: 'g',     supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Lemon',          quantity: 0.5, unit: 'whole', supermarketAisle: 'fruit & veg' },
  ],
  'Halal Chicken Curry with Basmati Rice': [
    { ingredientName: 'Halal chicken breast',      quantity: 250, unit: 'g',      supermarketAisle: 'fresh meat & poultry' },
    { ingredientName: 'Basmati rice (dry)',         quantity: 150, unit: 'g',      supermarketAisle: 'world foods' },
    { ingredientName: 'Chopped tomatoes (tinned)',  quantity: 200, unit: 'g',      supermarketAisle: 'tins & jars' },
    { ingredientName: 'Onion',                     quantity: 1,   unit: 'whole',  supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Garlic',                    quantity: 3,   unit: 'cloves', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Fresh ginger',              quantity: 10,  unit: 'g',      supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Curry powder',              quantity: 5,   unit: 'g',      supermarketAisle: 'condiments & sauces' },
    { ingredientName: 'Coconut milk',              quantity: 100, unit: 'ml',     supermarketAisle: 'world foods' },
  ],
  'Rice Cakes with Peanut Butter': [
    { ingredientName: 'Rice cakes',             quantity: 4,  unit: 'whole', supermarketAisle: 'cereals & breakfast' },
    { ingredientName: 'Peanut butter (smooth)', quantity: 30, unit: 'g',     supermarketAisle: 'condiments & sauces' },
  ],
  'Almonds': [
    { ingredientName: 'Almonds', quantity: 40, unit: 'g', supermarketAisle: 'snacks & nuts' },
  ],
  'Halal Beef Jerky': [
    { ingredientName: 'Halal beef jerky', quantity: 60, unit: 'g', supermarketAisle: 'snacks & nuts' },
  ],
  'Cottage Cheese with Blueberries': [
    { ingredientName: 'Low-fat cottage cheese', quantity: 200, unit: 'g', supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Blueberries',            quantity: 100, unit: 'g', supermarketAisle: 'fruit & veg' },
  ],
  'Apple with Almond Butter': [
    { ingredientName: 'Apple',         quantity: 1,  unit: 'medium', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Almond butter', quantity: 25, unit: 'g',      supermarketAisle: 'condiments & sauces' },
  ],
  'Whey Protein Shake (water)': [
    { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',  supermarketAisle: 'supplements' },
    { ingredientName: 'Water',               quantity: 300, unit: 'ml', supermarketAisle: 'n/a' },
  ],
  'Whey Protein Shake with Milk': [
    { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',  supermarketAisle: 'supplements' },
    { ingredientName: 'Whole milk',          quantity: 300, unit: 'ml', supermarketAisle: 'dairy & eggs' },
  ],
  'Banana Protein Shake': [
    { ingredientName: 'Whey protein powder', quantity: 30,  unit: 'g',      supermarketAisle: 'supplements' },
    { ingredientName: 'Whole milk',          quantity: 250, unit: 'ml',     supermarketAisle: 'dairy & eggs' },
    { ingredientName: 'Banana',              quantity: 1,   unit: 'medium', supermarketAisle: 'fruit & veg' },
    { ingredientName: 'Oats',               quantity: 40,  unit: 'g',      supermarketAisle: 'cereals & breakfast' },
  ],
  'Creatine Monohydrate (5 g)': [
    { ingredientName: 'Creatine monohydrate', quantity: 5, unit: 'g', supermarketAisle: 'supplements' },
  ],
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  console.log('Seeding meal ingredients into Turso...')

  // Fetch all meals
  const mealsResult = await client.execute('SELECT id, name FROM meals')
  const meals = mealsResult.rows as unknown as { id: number; name: string }[]
  console.log(`  Found ${meals.length} meals in DB`)

  // Clear any existing ingredients
  await client.execute('DELETE FROM meal_ingredients')
  console.log('  Cleared existing meal_ingredients')

  let totalIngredients = 0
  let matchedMeals = 0

  for (const meal of meals) {
    const ingredients = ingredientsByMeal[meal.name]
    if (!ingredients) {
      console.log(`  · No ingredients defined for: "${meal.name}" (skip)`)
      continue
    }
    for (const ing of ingredients) {
      await client.execute({
        sql: `INSERT INTO meal_ingredients (mealId, ingredientName, quantity, unit, supermarketAisle)
              VALUES (?, ?, ?, ?, ?)`,
        args: [meal.id, ing.ingredientName, ing.quantity, ing.unit, ing.supermarketAisle],
      })
    }
    console.log(`  ✓ ${meal.name} — ${ingredients.length} ingredients`)
    totalIngredients += ingredients.length
    matchedMeals++
  }

  // Verify
  const countResult = await client.execute('SELECT COUNT(*) as n FROM meal_ingredients')
  const count = Number((countResult.rows[0] as unknown as { n: number }).n)
  console.log(`\n✅ Done. ${matchedMeals} meals, ${totalIngredients} ingredients inserted. DB count: ${count}`)

  client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
