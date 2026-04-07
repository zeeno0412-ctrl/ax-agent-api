const EXTERNAL_API_URL = "https://ix.ax.gsretail.com/axsquad-agent/api/v2/messages";

function getAuthHeaders() {
  const token = sessionStorage.getItem("accessToken");
  const headers = { "Content-Type": "application/json", "anthropic-version": "2023-06-01" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function callAXAgentAPI(prompt, maxTokens = 2000) {
  const response = await fetch(EXTERNAL_API_URL, {
    targetAddressSpace: "local",
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    const isHtml = raw.trim().startsWith("<")
    throw new Error(isHtml ? `인증이 만료되었습니다. 다시 로그인해주세요. (${response.status})` : raw)
  }
  
  const data = JSON.parse(raw);
  return data.content?.[0]?.text || "";
}

export async function evaluateWithAI(summary) {
  const prompt = `당신은 AX스쿼드(AI/DX 과제 담당팀)의 과제 접수 심사자입니다.
아래 접수 내용을 보고 판정, PoV를 JSON으로만 응답하세요.

[접수 내용]
${summary}

[지원 영역]
- 생성형 AI 도입 (챗봇, 문서 자동화, RAG 등)
- 업무 자동화 (RPA, 데이터 파이프라인, 리포트 자동화 등)
- AX 역량 강화 (AI 교육, 내재화, 문화 확산 등)

[판정 기준]
- GO: 문제 명확, AX 지원 가능, 기대효과 구체적
- MAYBE: 방향은 맞으나 정보 부족하거나 범위 불명확
- NO: AX 지원 범위 밖이거나 기술적 구현 불가
- HOLD: 시기상조이거나 현재 우선순위 낮음

[PoV 작성 규칙]
PoV는 아래 형식으로 한 문장으로 작성:
"[대상]는 [현재상황]에 [니즈/어려움]이 있다. 왜냐하면 [인사이트]하기 때문이다."

접수 내용에 등장하는 이해관계자(현업 담당자, 운영팀, 법무팀 등)를 파악하여
각 관점에서 PoV를 2~3개 작성하세요. 관점이 명확히 다를 때만 여러 개, 비슷하면 1~2개로 줄여도 됩니다.

반드시 아래 JSON만 응답 (다른 텍스트 없이):
{"verdict":"GO","reason":"판정 이유 한 문장","pov_candidates":[{"perspective":"OFC 관점","pov":"..."},{"perspective":"법무팀 관점","pov":"..."}]}`;

  try {
    const text = await callAXAgentAPI(prompt, 1200);
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    return {
      verdict: "MAYBE",
      reason: e instanceof Error ? e.message : "AI 평가 중 오류가 발생했습니다.",
      pov_candidates: [{ perspective: "기본 관점", pov: "" }]
    };
  }
}

export async function parseAnswersWithAI(text) {
  const prompt = `아래 텍스트에서 과제 접수에 필요한 정보를 추출해주세요.
각 항목이 텍스트에 명확히 언급되어 있으면 해당 내용을, 불명확하거나 없으면 빈 문자열("")로 반환하세요.

[텍스트]
${text}

[항목 설명]
- who: 이 문제를 주로 겪는 역할/팀
- need: 그들이 가장 원하는 것
- insight: 왜 이 문제가 해결이 안 되는지
- current: 현재 어떻게 대응하고 있는지
- effect: 해결되면 어떤 변화가 기대되는지
- data: 필요한 데이터 또는 원하는 산출물 형태

반드시 아래 JSON만 응답 (다른 텍스트 없이):
{"who":"","need":"","insight":"","current":"","effect":"","data":""}`;
  try {
    const result = await callAXAgentAPI(prompt, 800);
    return JSON.parse(result.replace(/```json|```/g, "").trim());
  } catch (e) {
    return { who: "", need: "", insight: "", current: "", effect: "", data: "" };
  }
}

export async function deepenWithAI(step, answers, pov) {
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
`;

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
  };

  const prompt = prompts[step];
  if (!prompt) throw new Error("Invalid step");

  return await callAXAgentAPI(prompt, 2000);
}
