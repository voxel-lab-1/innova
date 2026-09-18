import app from "../server/server.js";

export default function handler(req, res) {
  if (req.url === "/api/health" || req.url === "/api/ping" || req.url === "/health") {
    return res.status(200).json({ status: "OK", timestamp: Date.now() });
  }
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Express Handler Error:", err);
    return res.status(500).json({ error: "Server handler error: " + (err.message || err) });
  }
}
