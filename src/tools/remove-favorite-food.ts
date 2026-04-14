import { loadFavorites, saveFavorites } from "../favorites.js";

export async function removeFavoriteFood(product_id: string) {
  const favorites = loadFavorites();
  const index = favorites.findIndex((f) => f.product_id === product_id);

  if (index === -1) {
    throw new Error(`Food with product_id "${product_id}" is not a favorite.`);
  }

  const removed = favorites.splice(index, 1)[0];
  saveFavorites(favorites);

  return { removed: removed.name, product_id };
}
