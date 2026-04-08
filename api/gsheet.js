export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const GSHEET_URL = process.env.GSHEET_URL;
  if (!GSHEET_URL) return res.status(500).json({ ok: false, error: "GSHEET_URL not configured" });

  try {
    const d = encodeURIComponent(JSON.stringify(req.body));
    const url = `${GSHEET_URL}?d=${d}`;
    const response = await fetch(url, { redirect: "follow" });
    const text = await response.text();
    console.log("[GSheet proxy] status:", response.status, "body:", text.slice(0, 300));
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(200).json({ ok: false, error: "응답 파싱 실패", body: text.slice(0, 200) });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
