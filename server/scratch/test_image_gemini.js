import "../load-env.js";
import { analyzeCalories } from "../calorieEngine.js";
import path from "path";

async function testImage() {
  const imagePath = "C:/Users/velpe/.gemini/antigravity/brain/6c926c67-8b47-4863-a6bb-c3e8218ef082/fried_eggs_toast_1779473320381.png";
  console.log("Analyzing image at:", imagePath);
  try {
    const result = await analyzeCalories({
      imagePath,
      mimeType: "image/png",
      foodName: "",
      ingredients: "",
      preparation: ""
    });
    console.log("RESULT:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testImage();
