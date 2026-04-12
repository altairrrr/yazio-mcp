import { getClient, todayISO } from "../yazio-client.js";

const MICRO_KEYS = [
  "mineral.calcium",
  "mineral.chlorine",
  "mineral.copper",
  "mineral.fluorine",
  "mineral.iron",
  "mineral.magnesium",
  "mineral.manganese",
  "mineral.phosphorus",
  "mineral.potassium",
  "mineral.sulfur",
  "mineral.zinc",
  "vitamin.a",
  "vitamin.b1",
  "vitamin.b12",
  "vitamin.b2",
  "vitamin.b6",
  "vitamin.d",
  "vitamin.e",
  "nutrient.dietaryfiber",
  "nutrient.sugar",
] as const;

type MicroKey = (typeof MICRO_KEYS)[number];

const LABELS: Record<MicroKey, { label: string; unit: string }> = {
  "mineral.calcium": { label: "Calcium", unit: "mg" },
  "mineral.chlorine": { label: "Chlorine", unit: "mg" },
  "mineral.copper": { label: "Copper", unit: "mg" },
  "mineral.fluorine": { label: "Fluorine", unit: "mg" },
  "mineral.iron": { label: "Iron", unit: "mg" },
  "mineral.magnesium": { label: "Magnesium", unit: "mg" },
  "mineral.manganese": { label: "Manganese", unit: "mg" },
  "mineral.phosphorus": { label: "Phosphorus", unit: "mg" },
  "mineral.potassium": { label: "Potassium", unit: "mg" },
  "mineral.sulfur": { label: "Sulfur", unit: "mg" },
  "mineral.zinc": { label: "Zinc", unit: "mg" },
  "vitamin.a": { label: "Vitamin A", unit: "µg" },
  "vitamin.b1": { label: "Vitamin B1", unit: "mg" },
  "vitamin.b12": { label: "Vitamin B12", unit: "µg" },
  "vitamin.b2": { label: "Vitamin B2", unit: "mg" },
  "vitamin.b6": { label: "Vitamin B6", unit: "mg" },
  "vitamin.d": { label: "Vitamin D", unit: "µg" },
  "vitamin.e": { label: "Vitamin E", unit: "mg" },
  "nutrient.dietaryfiber": { label: "Dietary Fiber", unit: "g" },
  "nutrient.sugar": { label: "Sugar", unit: "g" },
};

export async function getDailyMicronutrients(date?: string) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

  const totals: Record<MicroKey, number> = {} as Record<MicroKey, number>;
  for (const key of MICRO_KEYS) {
    totals[key] = 0;
  }

  await Promise.all(
    consumed.products.map(async (item) => {
      const product = await client.products.get(item.product_id);
      if (!product) return;

      const scale = (item.amount ?? 0) / 100;
      for (const key of MICRO_KEYS) {
        const value = product.nutrients[key];
        if (value != null) {
          totals[key] += value * scale;
        }
      }
    })
  );

  const minerals: Record<string, string> = {};
  const vitamins: Record<string, string> = {};
  const other: Record<string, string> = {};

  for (const key of MICRO_KEYS) {
    const { label, unit } = LABELS[key];
    const rounded = Math.round(totals[key] * 100) / 100;
    const formatted = `${rounded} ${unit}`;

    if (key.startsWith("mineral.")) {
      minerals[label] = formatted;
    } else if (key.startsWith("vitamin.")) {
      vitamins[label] = formatted;
    } else {
      other[label] = formatted;
    }
  }

  return {
    date: targetDate,
    items_counted: consumed.products.length,
    minerals,
    vitamins,
    other,
  };
}
