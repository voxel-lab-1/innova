export default function handler(req, res) {
  res.status(200).json({ status: "OK", message: "Vercel API environment is 100% working!" });
}
