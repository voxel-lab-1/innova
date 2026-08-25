import http from "http";

http.get("http://localhost:3001/api/products/recommended", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      console.log("SUCCESS! Recommended products returned:", json.length);
      if (json.length > 0) {
        console.log("First product sample:", json[0]);
      }
    } catch (err) {
      console.error("Failed to parse JSON response:", err);
      console.log("Raw response data:", data);
    }
  });
}).on("error", (err) => {
  console.error("HTTP request error:", err);
});
