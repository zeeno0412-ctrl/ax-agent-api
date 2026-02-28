export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { summary } = req.body
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) return res.status(200).json({ verdict: "MAYBE", member: "서은영", reason: "API key 없음" })

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: `당신은 AX스쿼드 과제 접수 심사자입니다. JSON만 응답하세요.\n\n[접수내용]\n${summary}\n\n[지원영역]\n- 생성형 AI → 강민수\n- 업무 자동화 → 이유미\n- AX 역량 강화 → 서은영\n\n[판정기준]\n- GO: 문제명확, 지원가능, 효과구체적\n- MAYBE: 정보부족\n- NO: 지원범위밖\n- HOLD: 시기상조\n\n반드시 아래 JSON만 응답:\n{"verdict":"GO","member":"강민수","reason":"이유"}`}]
      })
    })

    const raw = await response.text()
    if (!response.ok) return res.status(200).json({ verdict: "MAYBE", member: "서은영", reason: `API 오류: ${raw}` })

    const data = JSON.parse(raw)
    const text = data.content?.[0]?.text || ""
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim())
    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(200).json({ verdict: "MAYBE", member: "서은영", reason: e.message })
  }
}
