import { loadPresets, savePresets, type PresetItem, type Variant } from "../presets.js";

export async function updatePreset(
  key: string,
  label?: string,
  description?: string,
  items?: PresetItem[],
  variants?: Record<string, Record<string, Variant>>
) {
  const presets = loadPresets();

  if (!presets[key]) {
    const available = Object.keys(presets).join(", ");
    throw new Error(`Preset "${key}" not found. Available: ${available}`);
  }

  if (label != null) presets[key].label = label;
  if (description != null) presets[key].description = description;
  if (items != null) presets[key].items = items;
  if (variants != null) presets[key].variants = variants;

  savePresets(presets);

  return { updated: key, preset: presets[key] };
}
