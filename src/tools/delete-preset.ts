import { loadPresets, savePresets } from "../presets.js";

export async function deletePreset(key: string) {
  const presets = loadPresets();

  if (!presets[key]) {
    const available = Object.keys(presets).join(", ");
    throw new Error(`Preset "${key}" not found. Available: ${available}`);
  }

  const label = presets[key].label;
  delete presets[key];
  savePresets(presets);

  return { deleted: key, label };
}
