import { randomUUID } from "crypto";
import { getYazioToken, todayISO } from "../yazio-client.js";

const API_BASE = "https://yzapi.yazio.com/v15";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export async function logQuickEntry(
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  meal: Meal,
  date?: string
) {
  const token = await getYazioToken();
  const targetDate = date || todayISO();

  const body = {
    products: [],
    recipe_portions: [],
    simple_products: [
      {
        id: randomUUID(),
        date: targetDate,
        daytime: meal,
        name,
        nutrients: {
          "energy.energy": calories,
          "nutrient.protein": protein,
          "nutrient.carb": carbs,
          "nutrient.fat": fat,
        },
      },
    ],
  };

  const res = await fetch(`${API_BASE}/user/consumed-items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to log quick entry: ${res.status} ${res.statusText}`
    );
  }

  return {
    success: true,
    name,
    meal,
    date: targetDate,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
  };
}
