import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDailySummary } from "./tools/get-daily-summary.js";
import { getConsumedItems } from "./tools/get-consumed-items.js";
import { logFood } from "./tools/log-food.js";
import { getNutritionWeek } from "./tools/get-nutrition-week.js";
import { logPresetMeal } from "./tools/log-preset-meal.js";
import { logQuickEntry } from "./tools/log-quick-entry.js";
import { updateConsumedItem } from "./tools/update-consumed-item.js";
import { removeConsumedItem } from "./tools/remove-consumed-item.js";
import { getDailyMicronutrients } from "./tools/get-daily-micronutrients.js";
import { listPresets } from "./tools/list-presets.js";
import { getPreset } from "./tools/get-preset.js";
import { createPreset } from "./tools/create-preset.js";
import { updatePreset } from "./tools/update-preset.js";
import { deletePreset } from "./tools/delete-preset.js";
import { listFavoriteFoods } from "./tools/list-favorite-foods.js";
import { addFavoriteFood } from "./tools/add-favorite-food.js";
import { removeFavoriteFood } from "./tools/remove-favorite-food.js";
import { searchFood } from "./tools/search-food.js";
import { presetItemSchema, variantSchema } from "./presets.js";

function buildServer() {
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
    locale: z
      .string()
      .optional()
      .describe("Locale for search results (e.g. 'fr', 'en', 'de'). Defaults to all languages."),
  },
  async ({ food_name, quantity_grams, meal, date, locale }) => {
    try {
      const result = await logFood(food_name, quantity_grams, meal, date, locale);
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

server.tool(
  "log_preset_meal",
  `Log a pre-saved preset meal to the Yazio diary. ALWAYS use this tool when the user says things like "mon petit-déj habituel", "my usual breakfast", "comme d'hab", "le déjeuner type", "ajoute mon dîner", "log my usual lunch", etc. Call list_presets first to see available presets and their variants. Do NOT ask the user what they ate — just use the matching preset directly.`,
  {
    preset: z
      .string()
      .describe("Key of the preset meal to log (e.g. 'petit_dej', 'dejeuner', 'diner', 'snack')"),
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

server.tool(
  "get_daily_micronutrients",
  "Get a detailed breakdown of micronutrients (vitamins, minerals, fiber, sugar) consumed for a given day. Fetches each product's full nutritional data and aggregates totals. Requires Yazio Pro. Defaults to today if no date is provided.",
  {
    date: z
      .string()
      .optional()
      .describe("Date in ISO format (YYYY-MM-DD). Defaults to today."),
  },
  async ({ date }) => {
    try {
      const result = await getDailyMicronutrients(date);
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
  "search_food",
  "Search the Yazio food database by name. Returns matching products with their Yazio product IDs, macros per 100g, and match score. Use this to find exact product IDs before adding foods to favorites or presets.",
  {
    query: z.string().describe("Search query (e.g. 'poulet', 'banane', 'skyr')"),
    limit: z.number().positive().optional().describe("Max number of results to return (default 10)"),
    locale: z.string().optional().describe("Locale for search results (e.g. 'fr', 'en', 'de'). Defaults to all languages."),
  },
  async ({ query, limit, locale }) => {
    try {
      const result = await searchFood(query, limit, locale);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// --- Preset CRUD ---

server.tool(
  "list_presets",
  "List all saved meal presets with their keys, labels, descriptions, and available variants. Use this to discover what presets exist before logging or modifying them.",
  {},
  async () => {
    try {
      const result = await listPresets();
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
  "get_preset",
  "Get the full details of a specific preset meal, including all items with their Yazio product IDs, amounts, and variant options.",
  {
    key: z.string().describe("The preset key (e.g. 'petit_dej', 'dejeuner')"),
  },
  async ({ key }) => {
    try {
      const result = await getPreset(key);
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
  "create_preset",
  "Create a new meal preset. Each preset is a reusable meal template with a list of food items (with exact Yazio product IDs) and optional variants.",
  {
    key: z.string().describe("Unique key for the preset (e.g. 'petit_dej_leger')"),
    label: z.string().describe("Display name (e.g. 'Petit-déjeuner léger')"),
    description: z.string().describe("Short description of the meal contents"),
    items: z.array(presetItemSchema).describe("List of food items in this preset"),
    variants: z
      .record(z.string(), z.record(z.string(), variantSchema))
      .optional()
      .describe("Optional variants keyed by slot name, then by choice name"),
  },
  async ({ key, label, description, items, variants }) => {
    try {
      const result = await createPreset(key, label, description, items, variants);
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
  "update_preset",
  "Update an existing meal preset. You can modify its label, description, items, or variants. Only provided fields are updated.",
  {
    key: z.string().describe("The preset key to update"),
    label: z.string().optional().describe("New display name"),
    description: z.string().optional().describe("New description"),
    items: z.array(presetItemSchema).optional().describe("New list of food items (replaces all items)"),
    variants: z
      .record(z.string(), z.record(z.string(), variantSchema))
      .optional()
      .describe("New variants (replaces all variants)"),
  },
  async ({ key, label, description, items, variants }) => {
    try {
      const result = await updatePreset(key, label, description, items, variants);
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
  "delete_preset",
  "Delete a meal preset by its key.",
  {
    key: z.string().describe("The preset key to delete"),
  },
  async ({ key }) => {
    try {
      const result = await deletePreset(key);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

// --- Favorite Foods ---

server.tool(
  "list_favorite_foods",
  "List all favorite foods saved by the user. Each favorite has a Yazio product ID, default amount, default meal, and tags (e.g. 'protein', 'carb', 'fruit', 'fat'). Use this to suggest foods when building or modifying presets, or to help the user make nutritional choices.",
  {
    tag: z.string().optional().describe("Filter favorites by tag (e.g. 'protein', 'fruit')"),
  },
  async ({ tag }) => {
    try {
      const result = await listFavoriteFoods(tag);
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
  "add_favorite_food",
  "Add a food to the user's favorites list. Stores the exact Yazio product ID so it can be reliably reused in presets or logged directly. Tags help categorize the food (e.g. 'protein', 'carb', 'vegetable', 'fruit', 'fat', 'dairy').",
  {
    product_id: z.string().describe("Yazio product ID"),
    name: z.string().describe("Display name of the food"),
    default_amount: z.number().positive().describe("Default amount in grams"),
    default_meal: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Default meal slot"),
    tags: z.array(z.string()).describe("Tags for categorization (e.g. ['protein', 'meat'])"),
  },
  async ({ product_id, name, default_amount, default_meal, tags }) => {
    try {
      const result = await addFavoriteFood(product_id, name, default_amount, default_meal, tags);
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
  "remove_favorite_food",
  "Remove a food from the user's favorites list by its Yazio product ID.",
  {
    product_id: z.string().describe("Yazio product ID to remove"),
  },
  async ({ product_id }) => {
    try {
      const result = await removeFavoriteFood(product_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }
);

  return server;
}

async function main() {
  const transportType = process.env.MCP_TRANSPORT ?? "stdio";

  if (transportType === "streamable-http") {
    const { createServer } = await import("node:http");
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const port = parseInt(process.env.MCP_PORT ?? "8000");

    createServer(async (req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
      }
      if (req.method === "DELETE") { res.writeHead(200); res.end(); return; }
      if (req.url !== "/mcp" || req.method !== "POST") {
        res.writeHead(404); res.end("Not found"); return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      const server = buildServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    }).listen(port, "0.0.0.0", () => {
      process.stderr.write(`Yazio MCP server running on port ${port}\n`);
    });

  } else {
    const server = buildServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
