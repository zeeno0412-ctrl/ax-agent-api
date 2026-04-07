export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const GSHEET_URL = process.env.GSHEET_URL;
  if (!GSHEET_URL) return res.status(500).json({ ok: false, error: "GSHEET_URL not configured" });

  try {
    const response = await fetch(GSHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      redirect: "follow",
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
