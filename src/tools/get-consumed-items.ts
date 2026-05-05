import { getClient, todayISO } from "../yazio-client.js";

export async function getConsumedItems(date?: string) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

  const items = await Promise.all(
    consumed.products.map(async (item) => {
      const product = await client.products.get(item.product_id);
      const amount = item.amount ?? 0;
      const scale = amount;

      return {
        product_id: item.product_id,
        name: product?.name ?? item.product_id,
        meal: item.daytime,
        quantity_g: amount,
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

  return { date: targetDate, items };
}
