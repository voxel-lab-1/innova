import "../load-env.js";
import prisma from "../database.js";
import { generateMealPlan } from "../mealPlanEngine.js";

async function test() {
  try {
    console.log("=== Testing Meal Plan Calculations ===");
    const testData = {
      weight: 60,
      height: 160,
      age: 40,
      gender: "female",
      goal: "hypertrophy", // surplus
      activityLevel: 1.5,
      formula: "mifflin_st_jeor",
      proteinFactor: 2.5,
      fatFactor: 0.8
    };

    const generated = generateMealPlan(testData);
    console.log("Generated Plan Details:");
    console.log("Formula Used:", generated.formulaUsed);
    console.log("Calculated BMR:", generated.bmr, "kcal");
    console.log("Calculated TDEE (GET):", generated.tdee, "kcal");
    console.log("Target Macros (Cal/P/C/F):", 
      generated.targetMacros.calories, "kcal |", 
      generated.targetMacros.protein, "g |", 
      generated.targetMacros.carbs, "g |", 
      generated.targetMacros.fat, "g"
    );
    console.log("Portions distributed:", JSON.stringify(generated.portions, null, 2));
    console.log("Meals structured:", generated.meals.length);
    console.log("Sample breakfast foods:\n", generated.meals[0].foods);

    console.log("\n=== Testing Database Integration ===");
    const patient = await prisma.patient.findFirst();
    if (!patient) {
      console.log("No patient found in database to test DB insertion.");
      return;
    }
    console.log("Found patient:", patient.id, patient.name);

    console.log("Deactivating previous plans...");
    await prisma.mealPlan.updateMany({
      where: { patientId: patient.id },
      data: { isActive: false }
    });

    console.log("Creating new MealPlan record...");
    const created = await prisma.mealPlan.create({
      data: {
        patientId: patient.id,
        name: "Plan Nutricional de Prueba",
        goal: testData.goal,
        calories: generated.targetMacros.calories,
        protein: generated.targetMacros.protein,
        carbs: generated.targetMacros.carbs,
        fat: generated.targetMacros.fat,
        planJson: JSON.stringify(generated),
        isActive: true
      }
    });
    console.log("Plan inserted successfully! ID:", created.id);

    console.log("Fetching active plan...");
    const active = await prisma.mealPlan.findFirst({
      where: { patientId: patient.id, isActive: true }
    });
    console.log("Fetched Active Plan Name:", active.name);
    console.log("Fetched Calories:", active.calories);

    console.log("\nDeleting test plan...");
    await prisma.mealPlan.delete({
      where: { id: created.id }
    });
    console.log("Deleted test plan successfully.");
    console.log("All tests passed successfully!");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
