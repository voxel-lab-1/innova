export default async function handler(req, res) {
  if (req.url === "/api/health" || req.url === "/api/ping" || req.url === "/health") {
    return res.status(200).json({ status: "OK", timestamp: Date.now() });
  }
  try {
    const { default: app } = await import("../server/server.js");
    return app(req, res);
  } catch (err) {
    console.error("Vercel Initialization Error:", err);
    return res.status(500).json({ 
      error: "Error de inicialización del servidor", 
      details: err.message || String(err),
      stack: err.stack || "" 
    });
  }
}
