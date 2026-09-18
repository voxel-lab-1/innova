export default async function handler(req, res) {
  try {
    const { default: app } = await import("../server/server.js");
    return app(req, res);
  } catch (err) {
    console.error("Vercel Function Initialization Error:", err);
    return res.status(500).json({ error: "Server initialization error: " + (err.message || err) });
  }
}
