import { getClient, todayISO } from "../yazio-client.js";

type SimpleProduct = {
  id: string;
  date: string;
  daytime: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  nutrients: Record<string, number>;
};

// recipe_portions is typed as unknown[] by the yazio package — cast via any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecipePortion = any;

function nutrientVal(n: Record<string, number>, key: string): number | null {
  return n[key] != null ? Math.round(n[key] * 10) / 10 : null;
}

export async function getConsumedItems(date?: string) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

  const productItems = await Promise.all(
    consumed.products.map(async (item) => {
      const product = await client.products.get(item.product_id);
      const scale = item.amount ?? 0;

      return {
        id: item.id,
        product_id: item.product_id,
        name: product?.name ?? item.product_id,
        meal: item.daytime,
        quantity_g: scale,
        serving: item.serving,
        calories: product
          ? Math.round(product.nutrients["energy.energy"] * scale * 10) / 10
          : null,
        protein_g: product
          ? Math.round(product.nutrients["nutrient.protein"] * scale * 10) / 10
          : null,
        carbs_g: product
          ? Math.round(product.nutrients["nutrient.carb"] * scale * 10) / 10
          : null,
        fat_g: product
          ? Math.round(product.nutrients["nutrient.fat"] * scale * 10) / 10
          : null,
      };
    })
  );

  // simple_products store nutrients as absolute values (no scaling needed)
  const simpleItems = (consumed.simple_products as SimpleProduct[]).map((item) => ({
    id: item.id,
    product_id: null as string | null,
    name: item.name,
    meal: item.daytime,
    quantity_g: null as number | null,
    serving: null as string | null,
    calories: nutrientVal(item.nutrients, "energy.energy"),
    protein_g: nutrientVal(item.nutrients, "nutrient.protein"),
    carbs_g: nutrientVal(item.nutrients, "nutrient.carb"),
    fat_g: nutrientVal(item.nutrients, "nutrient.fat"),
  }));

  const recipePortions = consumed.recipe_portions as RecipePortion[];
  // Log shape on first recipe so we can refine this mapping later
  if (recipePortions.length > 0) {
    process.stderr.write(
      `[yazio-mcp] recipe_portions[0] shape: ${JSON.stringify(recipePortions[0])}\n`
    );
  }
  const recipeItems = recipePortions.map((item: RecipePortion) => ({
    id: item.id ?? null,
    product_id: item.recipe_id ?? null,
    name: item.name ?? item.recipe_id ?? "Recipe",
    meal: item.daytime ?? null,
    quantity_g: item.amount ?? null,
    serving: null as string | null,
    calories: item.nutrients ? nutrientVal(item.nutrients, "energy.energy") : null,
    protein_g: item.nutrients ? nutrientVal(item.nutrients, "nutrient.protein") : null,
    carbs_g: item.nutrients ? nutrientVal(item.nutrients, "nutrient.carb") : null,
    fat_g: item.nutrients ? nutrientVal(item.nutrients, "nutrient.fat") : null,
  }));

  return {
    date: targetDate,
    items: [...productItems, ...simpleItems, ...recipeItems],
  };
}
