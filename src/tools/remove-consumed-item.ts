import { getClient, todayISO } from "../yazio-client.js";

export async function removeConsumedItem(
  foodName: string,
  date?: string,
  meal?: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const client = getClient();
  const targetDate = date || todayISO();

  const consumed = await client.user.getConsumedItems({
    date: new Date(targetDate),
  });

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

  await client.user.removeConsumedItem(matched.id);

  return {
    success: true,
    removed: matchedName,
    meal: matched.daytime,
    date: targetDate,
    quantity_g: matched.amount,
  };
}
