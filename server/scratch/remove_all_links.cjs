const fs = require("fs");
const path = require("path");

function removeAllLinks(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return;
  }
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const products = JSON.parse(rawData);
    
    let count = 0;
    const updatedProducts = products.map(p => {
      if (p.purchaseLink !== "") {
        p.purchaseLink = "";
        count++;
      }
      return p;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2), "utf-8");
    console.log(`Successfully updated ${filePath}. Cleared ${count} remaining links.`);
  } catch (err) {
    console.error("Error processing file:", filePath, err);
  }
}

// Update both copies
const rootPath = path.join(__dirname, "..", "..", "recommendedProducts.json");
const serverPath = path.join(__dirname, "..", "..", "server", "recommendedProducts.json");

removeAllLinks(rootPath);
removeAllLinks(serverPath);
