import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

export interface PresetItem {
  slot?: string;
  product_id: string;
  name: string;
  amount: number;
  daytime: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface Variant {
  product_id: string;
  name: string;
  amount: number;
}

export interface Preset {
  label: string;
  description: string;
  items: PresetItem[];
  variants?: Record<string, Record<string, Variant>>;
}

export const presetItemSchema = z.object({
  slot: z.string().optional().describe("Slot name for variant overrides"),
  product_id: z.string().describe("Yazio product ID"),
  name: z.string().describe("Display name"),
  amount: z.number().positive().describe("Amount in grams"),
  daytime: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Meal slot"),
});

export const variantSchema = z.object({
  product_id: z.string().describe("Yazio product ID"),
  name: z.string().describe("Display name"),
  amount: z.number().positive().describe("Amount in grams"),
});

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(PROJECT_ROOT, "data");
const PRESETS_PATH = join(DATA_DIR, "presets.json");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function loadPresets(): Record<string, Preset> {
  ensureDataDir();
  if (!existsSync(PRESETS_PATH)) return {};
  return JSON.parse(readFileSync(PRESETS_PATH, "utf-8"));
}

export function savePresets(presets: Record<string, Preset>): void {
  ensureDataDir();
  writeFileSync(PRESETS_PATH, JSON.stringify(presets, null, 2));
}
