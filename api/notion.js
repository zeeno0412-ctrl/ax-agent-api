export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    const { receiptId, answers, verdict, firstMsg } = req.body
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    const NOTION_DB_ID = process.env.NOTION_DB_ID
    if (!NOTION_TOKEN || !NOTION_DB_ID) {
      return res.status(200).json({ ok: false, error: "환경변수 없음" })
    }
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          "과제명":       { title:     [{ text: { content: (firstMsg || "").slice(0, 100) } }] },
          "접수번호":     { rich_text: [{ text: { content: receiptId || "" } }] },
          "판정":         { select:    { name: verdict || "MAYBE" } },
          "신청자":       { rich_text: [{ text: { content: answers?.name    || "-" } }] },
          "팀명":         { rich_text: [{ text: { content: answers?.team    || "-" } }] },
          "대상":         { rich_text: [{ text: { content: answers?.who     || "-" } }] },
          "니즈":         { rich_text: [{ text: { content: answers?.need    || "-" } }] },
          "인사이트":     { rich_text: [{ text: { content: answers?.insight || "-" } }] },
          "현재상황":     { rich_text: [{ text: { content: answers?.current || "-" } }] },
          "기대효과":     { rich_text: [{ text: { content: answers?.effect  || "-" } }] },
          "데이터산출물": { rich_text: [{ text: { content: answers?.data    || "-" } }] },
          "접수일시":     { date:      { start: new Date().toISOString() } },
        }
      })
    })
    const data = await notionRes.json()
    if (!notionRes.ok) {
      return res.status(200).json({ ok: false, error: data.message })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message })
  }
}
