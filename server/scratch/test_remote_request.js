import https from "https";

const payload = JSON.stringify({
  email: "admin",
  password: "innova2026"
});

const req = https.request({
  hostname: "innova1.vercel.app",
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": payload.length
  }
}, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("Status code:", res.statusCode);
    console.log("Response headers:", res.headers);
    console.log("Response body:", data);
  });
});

req.on("error", (err) => {
  console.error("Request error:", err);
});

req.write(payload);
req.end();
