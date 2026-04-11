import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDailySummary } from "./tools/get-daily-summary.js";
import { getConsumedItems } from "./tools/get-consumed-items.js";
import { logFood } from "./tools/log-food.js";
import { getNutritionWeek } from "./tools/get-nutrition-week.js";
import { logPresetMeal } from "./tools/log-preset-meal.js";
import { presets } from "./presets.js";
import { logQuickEntry } from "./tools/log-quick-entry.js";
import { updateConsumedItem } from "./tools/update-consumed-item.js";
import { removeConsumedItem } from "./tools/remove-consumed-item.js";

const server = new McpServer({
  name: "yazio-mcp",
  version: "1.0.0",
});

server.tool(
  "get_daily_summary",
  "Get total calories, protein, carbs, and fat for a given day, broken down by meal. Also returns daily goals. Defaults to today if no date is provided.",
  {
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
  },
  async ({ date }) => {
    try {
      const result = await getDailySummary(date);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_consumed_items",
  "Get a list of all food items logged for a given day, with name, quantity, calories, macros (protein/carbs/fat), and meal type. Defaults to today.",
  {
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
  },
  async ({ date }) => {
    try {
      const result = await getConsumedItems(date);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "log_food",
  "Search for a food in the Yazio database and log it to the user's diary. Searches by name, picks the best match, and logs the specified quantity. Returns the matched food name, macros, and a warning if the match confidence is low.",
  {
    food_name: z.string().describe("Name of the food to search for and log"),
    quantity_grams: z.number().positive().describe("Amount in grams to log"),
    meal: z
      .enum(["breakfast", "lunch", "dinner", "snack"])
      .describe("Meal to log the food under"),
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
  },
  async ({ food_name, quantity_grams, meal, date }) => {
    try {
      const result = await logFood(food_name, quantity_grams, meal, date);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_nutrition_week",
  "Get a 7-day nutrition summary (last 7 days including today) with daily calorie and macro totals, plus a weekly average.",
  {},
  async () => {
    try {
      const result = await getNutritionWeek();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

const presetKeys = Object.keys(presets) as [string, ...string[]];

const variantsDescription = Object.entries(presets)
  .filter(([, p]) => p.variants)
  .map(([key, p]) => {
    const slots = Object.entries(p.variants!).map(
      ([slot, choices]) =>
        `${key}.${slot}: ${Object.entries(choices).map(([k, v]) => `"${k}" (${v.name})`).join(", ")}`
    );
    return slots.join("; ");
  })
  .join(". ");

server.tool(
  "log_preset_meal",
  `Log the user's pre-saved typical meal to their Yazio diary. The user has pre-configured their usual daily meals as presets. ALWAYS use this tool when the user says things like "mon petit-déj habituel", "my usual breakfast", "comme d'hab", "le déjeuner type", "ajoute mon dîner", "log my usual lunch", etc. Do NOT ask the user what they ate — just use the matching preset directly.

Available presets: ${Object.entries(presets)
    .map(([key, p]) => `"${key}" (${p.label}: ${p.description})`)
    .join("; ")}.

Mapping: petit-déjeuner/breakfast → "petit_dej", déjeuner/lunch → "dejeuner", dîner/dinner → "diner", snack/goûter → "snack".

Some items have variants that can be swapped: ${variantsDescription}. If the user mentions a variant (e.g. "avec du saumon", "with greek yogurt", "galettes bjorg"), pass it in the variants parameter. Otherwise use defaults.`,
  {
    preset: z
      .enum(presetKeys)
      .describe("Name of the preset meal to log"),
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
    variants: z
      .record(z.string(), z.string())
      .optional()
      .describe('Optional variant overrides. Keys are slot names, values are variant choices. E.g. {"proteine": "saumon"} or {"yaourt": "grec"}'),
  },
  async ({ preset, date, variants }) => {
    try {
      const result = await logPresetMeal(preset, date, variants);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "log_quick_entry",
  "Log a food entry by name and macros directly (without searching the Yazio database). Use this for restaurant meals, takeout, or any dish where you have estimated calories and macros but no exact product match. The entry appears as a 'simple product' in the Yazio diary.",
  {
    name: z.string().describe("Name of the dish (e.g. 'Bibimbap boeuf haché Taobento')"),
    calories: z.number().nonnegative().describe("Total calories (kcal)"),
    protein: z.number().nonnegative().describe("Protein in grams"),
    carbs: z.number().nonnegative().describe("Carbohydrates in grams"),
    fat: z.number().nonnegative().describe("Fat in grams"),
    meal: z
      .enum(["breakfast", "lunch", "dinner", "snack"])
      .describe("Meal to log the entry under"),
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
  },
  async ({ name, calories, protein, carbs, fat, meal, date }) => {
    try {
      const result = await logQuickEntry(name, calories, protein, carbs, fat, meal, date);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "update_consumed_item",
  "Update the quantity of a food item already logged in the user's Yazio diary. Finds the item by name (partial match) and replaces it with the new quantity. Use when the user says things like 'change the salmon to 125g', 'update the rice to 150g', 'modify the quantity of...'.",
  {
    food_name: z.string().describe("Name (or partial name) of the food to update"),
    new_quantity_grams: z.number().positive().describe("New amount in grams"),
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
    meal: z
      .enum(["breakfast", "lunch", "dinner", "snack"])
      .optional()
      .describe("Restrict search to a specific meal. Optional."),
  },
  async ({ food_name, new_quantity_grams, date, meal }) => {
    try {
      const result = await updateConsumedItem(food_name, new_quantity_grams, date, meal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "remove_consumed_item",
  "Remove a food item from the user's Yazio diary. Finds the item by name (partial match) and deletes it. Use when the user says 'remove the...', 'delete the...', 'enlève le...', 'supprime le...'.",
  {
    food_name: z.string().describe("Name (or partial name) of the food to remove"),
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
    meal: z
      .enum(["breakfast", "lunch", "dinner", "snack"])
      .optional()
      .describe("Restrict search to a specific meal. Optional."),
  },
  async ({ food_name, date, meal }) => {
    try {
      const result = await removeConsumedItem(food_name, date, meal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
