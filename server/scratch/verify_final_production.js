import https from "https";

https.get("https://innova1.vercel.app/api/patients", (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("HTTP status code:", res.statusCode);
    console.log("HTTP headers:", res.headers);
    console.log("Response body:", data);
  });
}).on("error", (err) => {
  console.error("HTTPS request error:", err);
});
