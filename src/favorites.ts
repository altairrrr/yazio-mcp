import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export interface FavoriteFood {
  product_id: string;
  name: string;
  default_amount: number;
  default_meal: "breakfast" | "lunch" | "dinner" | "snack";
  tags: string[];
}

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(PROJECT_ROOT, "data");
const FAVORITES_PATH = join(DATA_DIR, "favorites.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function loadFavorites(): FavoriteFood[] {
  ensureDataDir();
  if (!existsSync(FAVORITES_PATH)) return [];
  return JSON.parse(readFileSync(FAVORITES_PATH, "utf-8"));
}

export function saveFavorites(favorites: FavoriteFood[]): void {
  ensureDataDir();
  writeFileSync(FAVORITES_PATH, JSON.stringify(favorites, null, 2));
}
