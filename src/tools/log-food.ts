import { randomUUID } from "crypto";
import { getClient, todayISO } from "../yazio-client.js";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export async function logFood(
  foodName: string,
  quantityGrams: number,
  meal: Meal,
  date?: string
) {
  const client = getClient();
  const targetDate = date || todayISO();

  const results = await client.products.search({ query: foodName });

  if (results.length === 0) {
    return {
      success: false,
      error: `No food found matching "${foodName}". Try a different search term.`,
    };
  }

  const best = results[0];
  const score = best.score;
  const scale = quantityGrams / 100;

  const macros = {
    calories: Math.round(best.nutrients["energy.energy"] * scale * 10) / 10,
    protein_g:
      Math.round(best.nutrients["nutrient.protein"] * scale * 10) / 10,
    carbs_g: Math.round(best.nutrients["nutrient.carb"] * scale * 10) / 10,
    fat_g: Math.round(best.nutrients["nutrient.fat"] * scale * 10) / 10,
  };

  await client.user.addConsumedItem({
    id: randomUUID(),
    product_id: best.product_id,
    date: targetDate,
    daytime: meal,
    amount: quantityGrams,
    serving: null,
    serving_quantity: null,
  });

  return {
    success: true,
    product_id: best.product_id,
    matched_food: best.name,
    producer: best.producer || undefined,
    is_verified: best.is_verified,
    quantity_g: quantityGrams,
    meal,
    date: targetDate,
    macros,
    ...(score < 1
      ? {
          warning:
            "Low confidence match. The logged food may not be exactly what you intended. Check the matched_food name.",
        }
      : {}),
  };
}
