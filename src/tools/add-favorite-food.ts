import { loadFavorites, saveFavorites } from "../favorites.js";

export async function addFavoriteFood(
  product_id: string,
  name: string,
  default_amount: number,
  default_meal: "breakfast" | "lunch" | "dinner" | "snack",
  tags: string[]
) {
  const favorites = loadFavorites();

  if (favorites.some((f) => f.product_id === product_id)) {
    throw new Error(`Food with product_id "${product_id}" is already a favorite.`);
  }

  favorites.push({ product_id, name, default_amount, default_meal, tags });
  saveFavorites(favorites);

  return { added: name, product_id, tags };
}
