import { loadPresets } from "../presets.js";

export async function listPresets() {
  const presets = loadPresets();
  const entries = Object.entries(presets).map(([key, preset]) => ({
    key,
    label: preset.label,
    description: preset.description,
    items_count: preset.items.length,
    variants: preset.variants
      ? Object.entries(preset.variants).map(([slot, choices]) => ({
          slot,
          options: Object.keys(choices),
        }))
      : [],
  }));

  return { presets: entries };
}
