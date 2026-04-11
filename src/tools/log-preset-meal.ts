import { randomUUID } from "crypto";
import { getClient, todayISO } from "../yazio-client.js";
import { presets } from "../presets.js";

export async function logPresetMeal(
  presetName: string,
  date?: string,
  variants?: Record<string, string>
) {
  const preset = presets[presetName];
  if (!preset) {
    const available = Object.entries(presets)
      .map(([key, p]) => `  - ${key}: ${p.description}`)
      .join("\n");
    return {
      success: false,
      error: `Unknown preset "${presetName}". Available presets:\n${available}`,
    };
  }

  // Validate requested variants
  if (variants && preset.variants) {
    for (const [slot, choice] of Object.entries(variants)) {
      const slotVariants = preset.variants[slot];
      if (!slotVariants) {
        const availableSlots = Object.keys(preset.variants).join(", ");
        return {
          success: false,
          error: `Unknown variant slot "${slot}". Available slots for ${presetName}: ${availableSlots}`,
        };
      }
      if (!slotVariants[choice]) {
        const availableChoices = Object.entries(slotVariants)
          .map(([k, v]) => `${k} (${v.name})`)
          .join(", ");
        return {
          success: false,
          error: `Unknown variant "${choice}" for slot "${slot}". Available: ${availableChoices}`,
        };
      }
    }
  }

  const client = getClient();
  const targetDate = date || todayISO();
  const logged: string[] = [];

  for (const item of preset.items) {
    let productId = item.product_id;
    let name = item.name;
    let amount = item.amount;

    // Apply variant if specified for this slot
    if (item.slot && variants?.[item.slot] && preset.variants?.[item.slot]) {
      const variant = preset.variants[item.slot][variants[item.slot]];
      productId = variant.product_id;
      name = variant.name;
      amount = variant.amount;
    }

    await client.user.addConsumedItem({
      id: randomUUID(),
      product_id: productId,
      date: targetDate,
      daytime: item.daytime,
      amount,
      serving: null,
      serving_quantity: null,
    });
    logged.push(`${name} (${amount}g)`);
  }

  return {
    success: true,
    preset: preset.label,
    date: targetDate,
    items_logged: logged,
  };
}
