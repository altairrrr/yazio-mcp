import { getClient, getYazioToken, todayISO } from "../yazio-client.js";

const API_BASE = "https://yzapi.yazio.com/v15";

type RecipeData = {
  name?: string;
  nutrients?: Record<string, number>;
  // some endpoints nest nutrients per-portion under a different key
  [key: string]: unknown;
};

let _recipeShapeLogged = false;

async function fetchRecipe(recipeId: string): Promise<RecipeData | null> {
  const token = await getYazioToken();
  const headers = { Authorization: `Bearer ${token.access_token}` };

  for (const path of [`/user/recipes/${recipeId}`, `/recipes/${recipeId}`]) {
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (res.ok) {
      const data = await res.json() as RecipeData;
      if (!_recipeShapeLogged) {
        process.stderr.write(`[yazio-mcp] recipe shape (${path}): ${JSON.stringify(data)}\n`);
        _recipeShapeLogged = true;
      }
      return data;
    }
  }
  return null;
}

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

  const recipeItems = await Promise.all(
    (consumed.recipe_portions as RecipePortion[]).map(async (item) => {
      const recipe = await fetchRecipe(item.recipe_id);
      const n = recipe?.nutrients ?? null;
      return {
        id: item.id,
        product_id: item.recipe_id,
        name: recipe?.name ?? `Recipe (${item.recipe_id})`,
        meal: item.daytime,
        quantity_g: null as number | null,
        serving: `${item.portion_count} portion${item.portion_count !== 1 ? "s" : ""}`,
        calories: n ? nutrientVal(n, "energy.energy") : null,
        protein_g: n ? nutrientVal(n, "nutrient.protein") : null,
        carbs_g: n ? nutrientVal(n, "nutrient.carb") : null,
        fat_g: n ? nutrientVal(n, "nutrient.fat") : null,
      };
    })
  );

  return {
    date: targetDate,
    items: [...productItems, ...simpleItems, ...recipeItems],
  };
}
