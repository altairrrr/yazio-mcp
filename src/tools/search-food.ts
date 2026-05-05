import { getClient } from "../yazio-client.js";

export async function searchFood(query: string, limit?: number, locale?: string) {
  const client = getClient();
  const results = await client.products.search({
    query,
    ...(locale && { locales: [locale], countries: [locale.toUpperCase()] }),
  });

  const items = results.slice(0, limit ?? 10).map((r) => ({
    product_id: r.product_id,
    name: r.name,
    producer: r.producer || null,
    is_verified: r.is_verified,
    score: r.score,
    per_100g: {
      calories: Math.round(r.nutrients["energy.energy"] * 100 * 10) / 10,
      protein_g: Math.round(r.nutrients["nutrient.protein"] * 100 * 10) / 10,
      carbs_g: Math.round(r.nutrients["nutrient.carb"] * 100 * 10) / 10,
      fat_g: Math.round(r.nutrients["nutrient.fat"] * 100 * 10) / 10,
    },
  }));

  return { query, results: items };
}
