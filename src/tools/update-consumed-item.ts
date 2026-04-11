import { randomUUID } from "crypto";
import { getClient, todayISO } from "../yazio-client.js";

export async function updateConsumedItem(
  foodName: string,
  newQuantityGrams: number,
  date?: string,
  meal?: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

  // Find matching item by name (fetch product details for each)
  let matched: (typeof consumed.products)[number] | null = null;
  let matchedName = "";

  for (const item of consumed.products) {
    if (meal && item.daytime !== meal) continue;
    const product = await client.products.get(item.product_id);
    const name = product?.name ?? "";
    if (name.toLowerCase().includes(foodName.toLowerCase())) {
      matched = item;
      matchedName = name;
      break;
    }
  }

  if (!matched) {
    return {
      success: false,
      error: `No item matching "${foodName}" found${meal ? ` in ${meal}` : ""} on ${targetDate}.`,
    };
  }

  // Remove the old entry
  await client.user.removeConsumedItem(matched.id);

  // Re-add with new quantity
  await client.user.addConsumedItem({
    id: randomUUID(),
    product_id: matched.product_id,
    date: targetDate,
    daytime: matched.daytime,
    amount: newQuantityGrams,
    serving: null,
    serving_quantity: null,
  });

  return {
    success: true,
    food: matchedName,
    meal: matched.daytime,
    date: targetDate,
    old_quantity_g: matched.amount,
    new_quantity_g: newQuantityGrams,
  };
}
