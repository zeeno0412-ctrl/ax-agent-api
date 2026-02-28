export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { summary } = req.body
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key not configured" })

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
        messages: [{
          role: "user",
          content: `당신은 AX스쿼드(AI/DX 과제 담당팀)의 과제 접수 심사자입니다.
아래 접수 내용을 보고 판정과 담당자를 JSON으로만 응답하세요.

[접수 내용]
${summary}

[지원 영역]
- 생성형 AI 도입 (챗봇, 문서 자동화, RAG 등) → 강민수
- 업무 자동화 (RPA, 데이터 파이프라인, 리포트 자동화 등) → 이유미
- AX 역량 강화 (AI 교육, 내재화, 문화 확산 등) → 서은영

[판정 기준]
- GO: 문제 명확, AX 지원 가능, 기대효과 구체적
- MAYBE: 방향은 맞으나 정보 부족하거나 범위 불명확
- NO: AX 지원 범위 밖이거나 기술적 구현 불가
- HOLD: 시기상조이거나 현재 우선순위 낮음

반드시 아래 JSON만 응답 (다른 텍스트 없이):
{"verdict":"GO","member":"강민수","reason":"판정 이유 한 문장"}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ""
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim())
    return res.status(200).json(parsed)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
