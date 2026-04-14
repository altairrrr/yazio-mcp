import { loadFavorites } from "../favorites.js";

export async function listFavoriteFoods(tag?: string) {
  let favorites = loadFavorites();

  if (tag) {
    favorites = favorites.filter((f) => f.tags.includes(tag));
  }

  return { favorites, count: favorites.length };
}
