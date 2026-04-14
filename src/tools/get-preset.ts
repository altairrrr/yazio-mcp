import { loadPresets } from "../presets.js";

export async function getPreset(key: string) {
  const presets = loadPresets();
  const preset = presets[key];

  if (!preset) {
    const available = Object.keys(presets).join(", ");
    throw new Error(`Preset "${key}" not found. Available: ${available}`);
  }

  return { key, ...preset };
}
