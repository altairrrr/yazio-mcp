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
      calories: r.nutrients["energy.energy"],
      protein_g: r.nutrients["nutrient.protein"],
      carbs_g: r.nutrients["nutrient.carb"],
      fat_g: r.nutrients["nutrient.fat"],
    },
  }));

  return { query, results: items };
}
