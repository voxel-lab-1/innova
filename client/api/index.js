import app from "../../server/server.js";

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Express Handler Error:", err);
    return res.status(500).json({ error: "Server handler error: " + (err.message || err) });
  }
}
