import { getClient, todayISO } from "../yazio-client.js";

export async function getDailySummary(date?: string) {
  const client = getClient();
  const targetDate = date || todayISO();

  const summary = await client.user.getDailySummary({ date: new Date(targetDate) });

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  for (const meal of ["breakfast", "lunch", "dinner", "snack"] as const) {
    const nutrients = summary.meals[meal].nutrients;
    totals.calories += nutrients["energy.energy"];
    totals.protein += nutrients["nutrient.protein"];
    totals.carbs += nutrients["nutrient.carb"];
    totals.fat += nutrients["nutrient.fat"];
  }

  return {
    date: targetDate,
    totals: {
      calories: Math.round(totals.calories * 10) / 10,
      protein_g: Math.round(totals.protein * 10) / 10,
      carbs_g: Math.round(totals.carbs * 10) / 10,
      fat_g: Math.round(totals.fat * 10) / 10,
    },
    goals: {
      calories: summary.goals["energy.energy"],
      protein_g: summary.goals["nutrient.protein"],
      carbs_g: summary.goals["nutrient.carb"],
      fat_g: summary.goals["nutrient.fat"],
    },
    by_meal: Object.fromEntries(
      (["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => [
        meal,
        {
          calories: summary.meals[meal].nutrients["energy.energy"],
          protein_g: summary.meals[meal].nutrients["nutrient.protein"],
          carbs_g: summary.meals[meal].nutrients["nutrient.carb"],
          fat_g: summary.meals[meal].nutrients["nutrient.fat"],
        },
      ])
    ),
  };
}
