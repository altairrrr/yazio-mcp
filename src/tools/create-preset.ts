import { loadPresets, savePresets, type PresetItem, type Variant } from "../presets.js";

export async function createPreset(
  key: string,
  label: string,
  description: string,
  items: PresetItem[],
  variants?: Record<string, Record<string, Variant>>
) {
  const presets = loadPresets();

  if (presets[key]) {
    throw new Error(`Preset "${key}" already exists. Use update_preset to modify it.`);
  }

  presets[key] = { label, description, items, ...(variants && { variants }) };
  savePresets(presets);

  return { created: key, label, items_count: items.length };
}
