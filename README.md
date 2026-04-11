# Yazio MCP Server

A local [Model Context Protocol](https://modelcontextprotocol.io/) server that wraps the [Yazio](https://www.yazio.com/) food tracking API. It lets Claude (or any MCP client) log food, read daily nutrition data, and manage your food diary through natural language.

## Setup

### 1. Install dependencies

```bash
git clone <this-repo>
cd yazio-mcp
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Edit `.env` with your Yazio email and password:

```
YAZIO_USERNAME=your-yazio-email@example.com
YAZIO_PASSWORD=your-yazio-password
```

> **Signed up with Apple or Google?** You can still use email/password auth. Log in at [yazio.com/app/account](https://www.yazio.com/fr/app/account) with your SSO provider to find the email address associated with your account, then use Yazio's "Forgot Password?" flow to set a password.

### 3. Add to Claude

**Claude Desktop** — open Settings → Developer → Edit Config:

```json
{
  "mcpServers": {
    "yazio": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/yazio-mcp",
      "env": {
        "YAZIO_USERNAME": "your-yazio-email@example.com",
        "YAZIO_PASSWORD": "your-yazio-password"
      }
    }
  }
}
```

**Claude Code** — add to `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "yazio": {
      "command": "node",
      "args": ["--env-file=/absolute/path/to/yazio-mcp/.env", "/absolute/path/to/yazio-mcp/node_modules/.bin/tsx", "/absolute/path/to/yazio-mcp/src/index.ts"],
      "cwd": "/absolute/path/to/yazio-mcp"
    }
  }
}
```

Replace `/absolute/path/to/yazio-mcp` with the actual path to this project.

## Tools

| Tool | Description |
|------|-------------|
| `get_daily_summary` | Total calories, protein, carbs, fat for a day (with goals and per-meal breakdown) |
| `get_consumed_items` | List of all logged food items with name, quantity, calories, macros, and meal type |
| `log_food` | Search for a food in the Yazio database, pick the best match, and log it |
| `log_preset_meal` | Log a pre-saved meal with optional variants (see [Preset meals](#preset-meals)) |
| `log_quick_entry` | Log a dish by name + macros directly (for restaurant meals, takeout, etc.) |
| `update_consumed_item` | Update the quantity of an already-logged item |
| `remove_consumed_item` | Remove an item from the diary |
| `get_nutrition_week` | 7-day summary with daily totals and weekly averages |

### Preset meals

The server includes a preset system for meals you eat regularly. Presets are defined in `src/presets.ts` — edit this file to add your own meals. Each preset can have **variants** for items that change (e.g. different protein sources or yogurt brands).

See [MEALS.md](MEALS.md) for the current preset configuration and how variants work.

## Example prompts

Once connected, try asking Claude:

- "How many calories have I eaten today?"
- "What did I have for lunch?"
- "Log 200g of chicken breast for dinner"
- "Show me my nutrition for the past week"
- "Am I on track to hit my protein goal today?"
- "Log my usual breakfast"
- "Log my dinner with salmon instead"
- "Change the rice to 150g"
- "Remove the kiwi from dinner"
- "I had a bibimbap from a restaurant — about 1000 kcal, 45g protein, 120g carbs, 35g fat — log it for lunch"

## How it works

- **Auth**: reads credentials from environment variables, authenticates via the [yazio](https://www.npmjs.com/package/yazio) npm package
- **Token caching**: the auth token is cached in `.yazio-token.json` to avoid re-authenticating on every call. This file is auto-generated and can be safely deleted.
- **Quick entries**: restaurant meals and estimated macros are logged as "simple products" via the Yazio API, so they show up in the app just like manual entries
- **Presets**: pre-configured in `src/presets.ts` with product IDs from the Yazio database. Fork and customize for your own meals.

## File structure

```
yazio-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── yazio-client.ts       # Yazio API wrapper with token caching
│   ├── presets.ts            # Preset meal definitions (customize this!)
│   └── tools/
│       ├── get-daily-summary.ts
│       ├── get-consumed-items.ts
│       ├── log-food.ts
│       ├── log-preset-meal.ts
│       ├── log-quick-entry.ts
│       ├── update-consumed-item.ts
│       ├── remove-consumed-item.ts
│       └── get-nutrition-week.ts
├── MEALS.md              # Preset meals reference
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC
