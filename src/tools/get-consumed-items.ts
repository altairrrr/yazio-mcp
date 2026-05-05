import { getClient, todayISO } from "../yazio-client.js";

type SimpleProduct = {
  id: string;
  date: string;
  daytime: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  nutrients: Record<string, number>;
};

type RecipePortion = {
  id: string;
  date: string;
  daytime: "breakfast" | "lunch" | "dinner" | "snack";
  type: "recipe_portion";
  recipe_id: string;
  portion_count: number;
};

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

  // recipe_portions have no inline nutrients — would need a separate recipe fetch
  const recipeItems = (consumed.recipe_portions as RecipePortion[]).map((item) => ({
    id: item.id,
    product_id: item.recipe_id,
    name: `Recipe (${item.recipe_id})`,
    meal: item.daytime,
    quantity_g: null as number | null,
    serving: `${item.portion_count} portion${item.portion_count !== 1 ? "s" : ""}`,
    calories: null as number | null,
    protein_g: null as number | null,
    carbs_g: null as number | null,
    fat_g: null as number | null,
  }));

  return {
    date: targetDate,
    items: [...productItems, ...simpleItems, ...recipeItems],
  };
}
