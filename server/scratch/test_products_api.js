const fs = require("fs");
const path = require("path");

function getProducts() {
  try {
    let productsPath = path.join(process.cwd(), "recommendedProducts.json");
    console.log("Checking path 1:", productsPath, fs.existsSync(productsPath));
    if (!fs.existsSync(productsPath)) {
      productsPath = path.join(process.cwd(), "server", "recommendedProducts.json");
      console.log("Checking path 2 (fallback):", productsPath, fs.existsSync(productsPath));
    }
    if (!fs.existsSync(productsPath)) {
      console.log("File not found anywhere!");
      return [];
    }

    const rawData = fs.readFileSync(productsPath, "utf-8");
    const products = JSON.parse(rawData);
    console.log("Successfully read products:", products.length);
    return products;
  } catch (error) {
    console.error("Error reading products:", error);
    return [];
  }
}

getProducts();
