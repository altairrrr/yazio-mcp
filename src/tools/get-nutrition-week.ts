import { getClient } from "../yazio-client.js";

export async function getNutritionWeek() {
  const client = getClient();

  const inputs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { d, dateStr: `${yyyy}-${mm}-${dd}` };
  });

  const days = await Promise.all(
    inputs.map(async ({ d, dateStr }) => {
      const summary = await client.user.getDailySummary({ date: d });

      let calories = 0,
        protein = 0,
        carbs = 0,
        fat = 0;

      for (const meal of ["breakfast", "lunch", "dinner", "snack"] as const) {
        const n = summary.meals[meal].nutrients;
        calories += n["energy.energy"];
        protein += n["nutrient.protein"];
        carbs += n["nutrient.carb"];
        fat += n["nutrient.fat"];
      }

      return {
        date: dateStr,
        calories: Math.round(calories * 10) / 10,
        protein_g: Math.round(protein * 10) / 10,
        carbs_g: Math.round(carbs * 10) / 10,
        fat_g: Math.round(fat * 10) / 10,
      };
    })
  );

  const avg = {
    calories: Math.round((days.reduce((s, d) => s + d.calories, 0) / 7) * 10) / 10,
    protein_g: Math.round((days.reduce((s, d) => s + d.protein_g, 0) / 7) * 10) / 10,
    carbs_g: Math.round((days.reduce((s, d) => s + d.carbs_g, 0) / 7) * 10) / 10,
    fat_g: Math.round((days.reduce((s, d) => s + d.fat_g, 0) / 7) * 10) / 10,
  };

  return { days, average: avg };
}
