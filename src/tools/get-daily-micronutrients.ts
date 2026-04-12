import { getClient, todayISO } from "../yazio-client.js";

// API returns values in kg-equivalent (proportion of 1 per 100g).
// We need to convert to human-readable units.
// factor = multiplier to go from API value to display unit.
const NUTRIENTS: {
  key: string;
  label: string;
  unit: string;
  factor: number;
  category: "mineral" | "vitamin" | "other";
}[] = [
  // Minerals (API values in g per g → display in mg: ×1000)
  { key: "mineral.calcium", label: "Calcium", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.chlorine", label: "Chlorine", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.copper", label: "Copper", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.fluorine", label: "Fluorine", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.iodine", label: "Iodine", unit: "µg", factor: 1_000_000, category: "mineral" },
  { key: "mineral.iron", label: "Iron", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.magnesium", label: "Magnesium", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.manganese", label: "Manganese", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.phosphorus", label: "Phosphorus", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.potassium", label: "Potassium", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.selenium", label: "Selenium", unit: "µg", factor: 1_000_000, category: "mineral" },
  { key: "mineral.sulfur", label: "Sulfur", unit: "mg", factor: 1_000, category: "mineral" },
  { key: "mineral.zinc", label: "Zinc", unit: "mg", factor: 1_000, category: "mineral" },

  // Vitamins (API values in g per g → display varies)
  { key: "vitamin.a", label: "Vitamin A", unit: "µg", factor: 1_000_000, category: "vitamin" },
  { key: "vitamin.b1", label: "Vitamin B1", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.b2", label: "Vitamin B2 (Riboflavin)", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.b3", label: "Vitamin B3 (Niacin)", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.b5", label: "Vitamin B5", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.b6", label: "Vitamin B6", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.b7", label: "Vitamin B7 (Biotin)", unit: "µg", factor: 1_000_000, category: "vitamin" },
  { key: "vitamin.b11", label: "Vitamin B11 (Folate)", unit: "µg", factor: 1_000_000, category: "vitamin" },
  { key: "vitamin.b12", label: "Vitamin B12", unit: "µg", factor: 1_000_000, category: "vitamin" },
  { key: "vitamin.c", label: "Vitamin C", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.d", label: "Vitamin D", unit: "µg", factor: 1_000_000, category: "vitamin" },
  { key: "vitamin.e", label: "Vitamin E", unit: "mg", factor: 1_000, category: "vitamin" },
  { key: "vitamin.k", label: "Vitamin K", unit: "µg", factor: 1_000_000, category: "vitamin" },

  // Other
  { key: "nutrient.dietaryfiber", label: "Dietary Fiber", unit: "g", factor: 1, category: "other" },
  { key: "nutrient.sugar", label: "Sugar", unit: "g", factor: 1, category: "other" },
];

export async function getDailyMicronutrients(date?: string) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

  const totals: Record<string, number> = {};
  for (const n of NUTRIENTS) {
    totals[n.key] = 0;
  }

  await Promise.all(
    consumed.products.map(async (item) => {
      const product = await client.products.get(item.product_id);
      if (!product) return;

      const scale = item.amount ?? 0;
      for (const n of NUTRIENTS) {
        const value = (product.nutrients as Record<string, number>)[n.key];
        if (value != null) {
          totals[n.key] += value * scale;
        }
      }
    })
  );

  const minerals: Record<string, string> = {};
  const vitamins: Record<string, string> = {};
  const other: Record<string, string> = {};

  for (const n of NUTRIENTS) {
    const converted = totals[n.key] * n.factor;
    const rounded = Math.round(converted * 10) / 10;
    const formatted = `${rounded} ${n.unit}`;

    if (n.category === "mineral") minerals[n.label] = formatted;
    else if (n.category === "vitamin") vitamins[n.label] = formatted;
    else other[n.label] = formatted;
  }

  return {
    date: targetDate,
    items_counted: consumed.products.length,
    vitamins,
    minerals,
    other,
  };
}
