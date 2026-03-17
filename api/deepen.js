export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "*")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { step, answers, pov } = req.body
  // const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  // if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key 없음" })

  const context = `
[과제 정보]
- 신청자: ${answers?.name || "-"} (${answers?.team || "-"})
- 대상: ${answers?.who || "-"}
- 니즈: ${answers?.need || "-"}
- 인사이트: ${answers?.insight || "-"}
- 현재상황: ${answers?.current || "-"}
- 기대효과: ${answers?.effect || "-"}
- 데이터/산출물: ${answers?.data || "-"}
- PoV: ${pov || "-"}
`

  const prompts = {
    1: `당신은 AX스쿼드의 과제 심화 분석가입니다. 아래 과제를 1단계 분석해주세요.

${context}

[1단계: 분석]
- 이 과제의 강점과 취약점, 고려해야 할 점을 분석해주세요.
- 빠진 정보는 추측해서 채워주세요.
- 기존 솔루션 조합도 제시해주세요 (예: 구글폼+스프레드시트, Make+Notion 등).

응답 형식 (마크다운):
## 강점
(내용)

## 취약점
(내용)

## 고려사항
(내용)

## 기존 솔루션 조합 제안
(내용)

## 불확실성 지도
- 가장 덜 자신있는 부분:
- 지나치게 단순화했을 수 있는 부분:
- 의견을 바꿀 수 있는 추가 정보:`,

    2: `당신은 AX스쿼드의 과제 심화 분석가입니다. 아래 과제를 2단계 분석해주세요.

${context}

[2단계: 프로토타이핑 전략]
- 이 과제를 값싸게 검증하는 다양한 전략을 제시해주세요.
- 어떤 가설을 확인하기 위한 테스트인지 설명해주세요.
- 아래 기법들을 활용하세요: 종이 프로토타입, 기존 제품 조합(피기백), 사람이 기계 역할(Wizard of Oz), 역할극

응답 형식 (마크다운):
## 핵심 가설
(검증해야 할 가설 목록)

## 프로토타이핑 전략
### 전략 1: (이름)
(설명)

### 전략 2: (이름)
(설명)

### 전략 3: (이름)
(설명)

## 불확실성 지도
- 가장 덜 자신있는 부분:
- 지나치게 단순화했을 수 있는 부분:
- 의견을 바꿀 수 있는 추가 정보:`,

    3: `당신은 AX스쿼드의 과제 심화 분석가입니다. 아래 과제를 3단계 분석해주세요.

${context}

[3단계: 그로스 전략]
- 최초 홍보 계획 (어떻게 첫 사용자를 확보할지)
- 바이럴 루프 설계 (앱 내부 기능 또는 외부 운영으로)

응답 형식 (마크다운):
## 최초 홍보 계획
(내용)

## 바이럴 루프 설계
### 앱 내부 기능
(내용)

### 외부 운영
(내용)

## 불확실성 지도
- 가장 덜 자신있는 부분:
- 지나치게 단순화했을 수 있는 부분:
- 의견을 바꿀 수 있는 추가 정보:`,

    4: `당신은 AX스쿼드의 과제 심화 분석가입니다. 아래 과제를 4단계 분석해주세요.

${context}

[4단계: 이터레이션 설계]
이 과제를 3단계 이터레이션으로 구현한다면 어떻게 쪼갤지 설계해주세요.
각 단계별로: 입력 / 처리 / 출력 / 행동(필요시) / 검수 포함.

응답 형식 (마크다운):
## 1차 이터레이션 (MVP)
- **입력**: 
- **처리**: 
- **출력**: 
- **검수**: 

## 2차 이터레이션
- **입력**: 
- **처리**: 
- **출력**: 
- **행동**: 
- **검수**: 

## 3차 이터레이션
- **입력**: 
- **처리**: 
- **출력**: 
- **행동**: 
- **검수**: 

## 불확실성 지도
- 가장 덜 자신있는 부분:
- 지나치게 단순화했을 수 있는 부분:
- 의견을 바꿀 수 있는 추가 정보:`,

    5: `당신은 AX스쿼드의 과제 심화 분석가입니다. 아래 과제를 5단계 분석해주세요.

${context}

[5단계: PRD 설계]
MVP를 위한 PRD를 작성해주세요. Cursor, Lovable 같은 AI 코딩 에이전트가 개발할 것을 감안해서 작성해주세요.

응답 형식 (마크다운):
## 제품 개요
(내용)

## 핵심 기능 (MVP)
(내용)

## 사용자 흐름
(내용)

## 기술 스택 제안
(내용)

## 테스트 시나리오
(검수 항목 목록)

## 향후 이터레이션 (Future Work)
(2차, 3차 이터레이션 요약)

## 불확실성 지도
- 가장 덜 자신있는 부분:
- 지나치게 단순화했을 수 있는 부분:
- 의견을 바꿀 수 있는 추가 정보:`
  }

  const prompt = prompts[step]
  if (!prompt) return res.status(400).json({ error: "Invalid step" })

  try {
    const response = await fetch("https://ix.ax.gsretail.com/axsquad-agent/api/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    })

    const raw = await response.text()
    if (!response.ok) return res.status(500).json({ error: raw })
    const data = JSON.parse(raw)
    const text = data.content?.[0]?.text || ""
    return res.status(200).json({ result: text })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
