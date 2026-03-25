import { useState, useRef, useEffect } from "react"
import { evaluateWithAI, deepenWithAI } from "./utils/ai"
import { saveToNotion, queryNotion } from "./utils/notion"

function getSessionUser() {
  if (typeof window === "undefined") return { name: "", email: "" }
  const name = sessionStorage.getItem("name") || ""
  const email = sessionStorage.getItem("email") || ""
  return { name, email }
}

const SQUAD_MEMBERS = [
  { id: 1, name: "강민수", role: "생성형 AI",    emoji: "🤖", color: "#3B5BDB" },
  { id: 2, name: "이유미", role: "업무 자동화",  emoji: "⚙️", color: "#0CA678" },
  { id: 3, name: "서은영", role: "AX 역량 강화", emoji: "🚀", color: "#E67700" },
]

const INTERVIEW_QUESTIONS = [
  { id: "who",     label: "대상",          emoji: "👤", question: "이 문제를 주로 겪는 분이 어떤 역할/팀인지 알 수 있을까요?",     placeholder: "예) 마케팅팀 담당자들, CS 운영팀 전체..." },
  { id: "need",    label: "니즈",          emoji: "💬", question: "그분들이 가장 원하는 게 무엇인가요? 단 한 가지만 꼽는다면?",   placeholder: "예) 매주 수작업 리포트에서 해방되고 싶다..." },
  { id: "insight", label: "인사이트",      emoji: "💡", question: "왜 지금 이 문제가 해결이 안 되고 있다고 생각하시나요?",         placeholder: "예) 데이터가 여러 시스템에 흩어져 있어서..." },
  { id: "current", label: "현재 상황",     emoji: "📊", question: "현재는 이 문제를 어떻게 대응하고 계신가요?",                   placeholder: "예) 매주 월요일 아침 2시간씩 수작업으로 취합..." },
  { id: "effect",  label: "기대 효과",     emoji: "📈", question: "해결된다면 어떤 변화가 기대되시나요? (시간, 비용, 품질 등)",   placeholder: "예) 주당 5시간 절약, 오류율 감소..." },
  { id: "data",    label: "데이터/산출물", emoji: "🗂️", question: "필요한 데이터가 있다면 어디에 있나요? 원하는 산출물 형태는?", placeholder: "예) ERP 시스템 내 데이터, 자동 생성 엑셀 리포트..." },
]

function getSessionNameAndTeam() {
  const raw = (typeof window !== "undefined" && sessionStorage.getItem("name")) || ""
  const slashIdx = raw.indexOf("/")
  if (slashIdx === -1) return { name: raw, team: "" }
  return { name: raw.slice(0, slashIdx), team: raw.slice(slashIdx + 1) }
}

const VERDICT_CONFIG = {
  GO:    { label: "GO",    icon: "🟢", title: "접수 완료!",       desc: "잘 정의된 과제입니다. 현재 3-5월 스프린트 과제가 확정되어 있어, 내부 논의 후 담당자가 연락드릴 예정이에요.",             bg: "#F0FDF4", border: "#34D399", text: "#065F46", badge: "#D1FAE5|#065F46" },
  MAYBE: { label: "MAYBE", icon: "🟡", title: "보완이 필요해요",  desc: "현재 3-5월 과제가 확정되어 리소스가 부족한 상황이에요. 내용을 조금 더 구체화해주시면 다음 기간에 진행 가능한지 검토해드릴게요.",   bg: "#FFFBEB", border: "#FBBF24", text: "#92400E", badge: "#FEF3C7|#92400E" },
  NO:    { label: "NO",    icon: "🔴", title: "AX 영역 밖이에요", desc: "현재 3-5월 과제가 확정되어 리소스가 부족한 상황이에요. AX 지원 범위와 맞지 않지만, 다음 기간 재접수 시 재검토해드릴게요.",                   bg: "#FFF1F2", border: "#FB7185", text: "#9F1239", badge: "#FFE4E6|#9F1239" },
  HOLD:  { label: "HOLD",  icon: "⏸️", title: "보류",            desc: "현재 3-5월 과제가 확정되어 리소스가 부족한 상황이에요. 다음 기간에 진행 가능한지 내부 검토 후 안내드릴게요.", bg: "#F8FAFC", border: "#94A3B8", text: "#475569", badge: "#F1F5F9|#475569" },
}

const SPRINTS = [
  { label: "HBU) 카테고리 자동분류 운영", date: "2026.02", color: "#34D399" },
  { label: "HBU) 마이샵 사전심의",        date: "2026.03", color: "#60A5FA" },
  { label: "AX) AX PM 역량강화",          date: "2026.03", color: "#60A5FA" },
  { label: "전사) SLT 임원대상 교육",     date: "2026.04", color: "#CBD5E1" },
  { label: "PBU) 물류재고&MD",            date: "2026.04", color: "#CBD5E1" },
  { label: "AX) 샌드박스 구축",                        date: "2026.02", color: "#34D399" },
  { label: "HBU) 건강기능식품 속성 추출 및 심의봇 연동", date: "2026.02", color: "#34D399" },
  { label: "AX) GCP 데이터 이관",                      date: "2026.02", color: "#34D399" },
  { label: "PBU) 고객의 소리 해피콜 신분류 체계 검증",  date: "2026.03", color: "#60A5FA" },
  { label: "PBU) 트렌즈 기술 지원",                    date: "2026.03", color: "#60A5FA" },
  { label: "PBU) 고객의 소리 기반 통합 시스템",         date: "2026.04", color: "#CBD5E1" },
  { label: "AX) FDE 역량강화",                         date: "2026.07", color: "#CBD5E1" },
]

// ── Notion response parser ────────────────────────────────
function parseNotionPage(page) {
  const p = page.properties || {}
  const text = (prop) =>
    prop?.title?.[0]?.plain_text || prop?.rich_text?.[0]?.plain_text || ""
  const sel = (prop) => prop?.select?.name || ""

  const id = text(p["접수번호"])
  const title = text(p["과제명"])
  const verdict = sel(p["판정"]) || "MAYBE"
  return {
    id: id || page.id,
    title,
    verdict,
    answers: {
      name:    text(p["신청자"]),
      team:    text(p["팀명"]),
      who:     text(p["대상"]),
      need:    text(p["니즈"]),
      insight: text(p["인사이트"]),
      current: text(p["현재상황"]),
      effect:  text(p["기대효과"]),
      data:    text(p["데이터산출물"]),
    },
    pov:       text(p["PoV"]),
    reason:    "",
    firstMsg:  title,
    createdAt: p["접수일시"]?.date?.start || page.created_time,
  }
}

// ── utils ────────────────────────────────────────────────
function makeReceiptId() {
  return "AX-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100)
}
function formatDate(iso) {
  const d = new Date(iso)
  return `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}


// ── API calls ─────────────────────────────────────────────
async function evaluatePOVWithAI(answers) {
  const summaryLines = [
    `신청자 이름: ${answers.name || "미입력"}`,
    `팀명: ${answers.team || "미입력"}`,
    ...INTERVIEW_QUESTIONS.map(q => `${q.label}: ${answers[q.id] || "미입력"}`),
  ]
  const summary = summaryLines.join("\n")
  try {
    const data = await evaluateWithAI(summary)
    return { verdict: data.verdict || "MAYBE", reason: data.reason || "", pov: data.pov || "" }
  } catch (e) {
    console.error("AI Evaluation failed:", e)
    return { verdict: "MAYBE", reason: e instanceof Error ? e.message : "AI 평가 중 오류가 발생했습니다.", pov: "" }
  }
}


// ── components ───────────────────────────────────────────
function AgentAvatar({ size = "md" }) {
  const sz = { sm: [32, 16], md: [40, 20], lg: [64, 32] }[size]
  return (
    <div style={{ width: sz[0], height: sz[0], borderRadius: 12, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz[1], flexShrink: 0 }}>🤝</div>
  )
}

function ChatBubble({ from, children }) {
  const isAgent = from === "agent"
  return (
    <div className="animate-fade-in" style={{ display: "flex", gap: 12, flexDirection: isAgent ? "row" : "row-reverse" }}>
      {isAgent && <AgentAvatar />}
      <div style={{
        maxWidth: "78%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.6,
        ...(isAgent
          ? { background: "white", border: "1px solid #F1F5F9", color: "#334155", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", borderTopLeftRadius: 4 }
          : { background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "white", borderTopRightRadius: 4 })
      }}>{children}</div>
      {!isAgent && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>👤</div>
      )}
    </div>
  )
}

function ProgressBar({ total, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            height: 6, borderRadius: 3, transition: "all 0.3s",
            width: i <= current ? 20 : 8,
            background: i < current ? "#3B82F6" : i === current ? "#93C5FD" : "#E2E8F0"
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: "#94A3B8" }}>{current}/{total}</span>
    </div>
  )
}

function POVCard({ answers }) {
  return (
    <div style={{ background: "white", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden", width: "100%" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #F8FAFC", background: "linear-gradient(90deg,#EFF6FF,#F0FDF4)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>📋 POV 요약</p>
      </div>
      {INTERVIEW_QUESTIONS.map((q, i) => (
        <div key={q.id} style={{ padding: "10px 16px", display: "flex", gap: 12, borderBottom: i < INTERVIEW_QUESTIONS.length - 1 ? "1px solid #F8FAFC" : "none" }}>
          <span style={{ fontSize: 14, marginTop: 2, flexShrink: 0 }}>{q.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginBottom: 2 }}>{q.label}</p>
            <p style={{ fontSize: 13, color: answers[q.id] ? "#334155" : "#CBD5E1", fontStyle: answers[q.id] ? "normal" : "italic", wordBreak: "break-word" }}>
              {answers[q.id] || "미입력"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}


const STEP_LABELS = ["분석", "프로토타이핑 전략", "그로스 전략", "이터레이션 설계", "PRD 설계"]

function renderMarkdown(text) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: "16px 0 6px" }}>{line.replace("## ", "")}</h3>
    if (line.startsWith("### ")) return <h4 key={i} style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: "12px 0 4px" }}>{line.replace("### ", "")}</h4>
    if (line.startsWith("- **")) return <p key={i} style={{ fontSize: 13, color: "#475569", margin: "3px 0", paddingLeft: 12 }} dangerouslySetInnerHTML={{__html: "• " + line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}} />
    if (line.startsWith("- ")) return <p key={i} style={{ fontSize: 13, color: "#475569", margin: "3px 0", paddingLeft: 12 }}>• {line.slice(2)}</p>
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: "4px 0" }}>{line.replace(/\*\*/g, "")}</p>
    if (line.trim() === "") return <div key={i} style={{ height: 4 }} />
    return <p key={i} style={{ fontSize: 13, color: "#475569", margin: "3px 0", lineHeight: 1.6 }} dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}} />
  })
}

function DeepenModal({ answers, pov, receiptId, onClose }) {
  const [step, setStep] = useState(1)
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStep(1)
  }, [])

  async function loadStep(s) {
    if (results[s]) { setStep(s); return }
    // 캐시 확인
    const cacheKey = "deepen_" + receiptId + "_" + s
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setResults(prev => ({ ...prev, [s]: cached })); setStep(s); return }
    } catch(e) {}
    setLoading(true)
    try {
      const result = await deepenWithAI(s, answers, pov)
      setResults(prev => ({ ...prev, [s]: result }))
      setStep(s)
      // 캐시 저장
      try { localStorage.setItem(cacheKey, result) } catch(e) {}
    } catch (e) {
      setResults(prev => ({ ...prev, [s]: "오류: " + e.message }))
      setStep(s)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="animate-fade-in" style={{ position: "relative", background: "white", borderRadius: 20, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: 0 }}>💡 아이디어 심화 분석</p>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>5단계로 과제를 깊게 파고들어요</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 20 }}>✕</button>
        </div>

        {/* 스텝 탭 */}
        <div style={{ display: "flex", padding: "8px 20px", gap: 6, borderBottom: "1px solid #F1F5F9", flexShrink: 0, overflowX: "auto" }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1
            const isDone = !!results[s]
            const isCurrent = step === s
            return (
              <button key={s} onClick={() => loadStep(s)}
                style={{ padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  background: isCurrent ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : isDone ? "#F0FDF4" : "#F8FAFC",
                  color: isCurrent ? "white" : isDone ? "#065F46" : "#94A3B8" }}>
                {isDone && !isCurrent ? "✓ " : ""}{s}. {label}
              </button>
            )
          })}
        </div>

        {/* 콘텐츠 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", animation: `bounce-dot 1s infinite ${d}s` }} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: "#94A3B8" }}>{step}단계 분석 중...</p>
            </div>
          ) : results[step] ? (
            <div>{renderMarkdown(results[step])}</div>
          ) : null}
        </div>

        {/* 푸터 */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{step} / 5 단계</p>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 && (
              <button onClick={() => loadStep(step - 1)}
                style={{ padding: "8px 16px", borderRadius: 12, background: "#F1F5F9", color: "#475569", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                ← 이전
              </button>
            )}
            {step < 5 && (
              <button onClick={() => loadStep(step + 1)} disabled={loading}
                style={{ padding: "8px 20px", borderRadius: 12, background: loading ? "#E2E8F0" : "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                다음 →
              </button>
            )}
            {step === 5 && (
              <button onClick={onClose}
                style={{ padding: "8px 20px", borderRadius: 12, background: "linear-gradient(135deg,#0CA678,#34D399)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                완료 ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VerdictCard({ verdict, receiptId, reason, pov, notionSaved }) {
  const cfg = VERDICT_CONFIG[verdict]
  if (!cfg) return null
  const [badgeBg, badgeText] = cfg.badge.split("|")
  const saving = notionSaved === null || notionSaved === undefined
  return (
    <div style={{ borderRadius: 16, padding: 16, width: "100%", background: cfg.bg, border: `2px solid ${cfg.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{cfg.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: cfg.text }}>{cfg.title}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: badgeBg, color: badgeText }}>{cfg.label}</span>
      </div>
      <p style={{ fontSize: 13, color: cfg.text, marginBottom: 4 }}>{cfg.desc}</p>
      {reason && <p style={{ fontSize: 11, color: "#64748B", fontStyle: "italic", marginBottom: 8, background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 12px" }}>💬 {reason}</p>}
      {pov && <p style={{ fontSize: 12, color: "#1D4ED8", marginBottom: 12, background: "#EFF6FF", borderRadius: 8, padding: "8px 12px", lineHeight: 1.6 }}>📌 <strong>PoV</strong><br/>{pov}</p>}
      {receiptId && <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>접수번호: <strong style={{ color: "#475569" }}>{receiptId}</strong></p>}
      <div style={{
        fontSize: 11, borderRadius: 8, padding: "6px 12px",
        background: saving ? "#F1F5F9" : notionSaved?.ok ? "#EFF6FF" : "#FFFBEB",
        color: saving ? "#94A3B8" : notionSaved?.ok ? "#1D4ED8" : "#92400E",
        display: "flex", flexDirection: "column", gap: 2
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>{saving ? "⏳" : notionSaved?.ok ? "📋" : "⚠️"}</span>
          <span>{saving ? "Notion DB 저장 중..." : notionSaved?.ok ? "Notion DB 저장 완료" : "Notion 저장 실패"}</span>
        </div>
        {notionSaved?.error && (
          <div style={{ fontSize: 10, color: "#B45309", background: "#FEF3C7", borderRadius: 4, padding: "3px 6px", marginTop: 2, wordBreak: "break-all" }}>
            {notionSaved.error}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryItem({ r, onClick }) {
  const cfg = VERDICT_CONFIG[r.verdict]
  return (
    <div onClick={onClick} style={{ padding: 8, borderRadius: 10, cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#F1F5F9" }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 11 }}>{cfg?.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg?.text }}>{r.verdict}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{formatDate(r.createdAt)}</span>
      </div>
      <p style={{ fontSize: 11, color: "#475569", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{r.title}</p>
      <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{r.id}</p>
    </div>
  )
}

function ReceiptModal({ receipt, onClose }) {
  const [showDeepen, setShowDeepen] = useState(false)

  const cfg = VERDICT_CONFIG[receipt.verdict]
  const [badgeBg, badgeText] = cfg.badge.split("|")
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
      <div className="animate-fade-in" style={{ position: "relative", background: "white", borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.25)", width: "100%", maxWidth: 448, maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ position: "sticky", top: 0, background: "white", padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{receipt.id}</p>
            <p style={{ fontWeight: 600, color: "#1E293B", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, margin: 0 }}>{receipt.title}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: badgeBg, color: badgeText }}>{cfg?.icon} {receipt.verdict}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 18, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(receipt.createdAt).toLocaleString("ko-KR")}</p>
          {receipt.reason && (
            <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", marginBottom: 4 }}>AI 판정 사유</p>
              <p style={{ fontSize: 11, color: "#1D4ED8" }}>{receipt.reason}</p>
            </div>
          )}
          <div style={{ background: "white", border: "1px solid #F1F5F9", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #F8FAFC", background: "linear-gradient(90deg,#EFF6FF,#F0FDF4)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>📋 POV</p>
            </div>
            {INTERVIEW_QUESTIONS.map((q, i) => (
              <div key={q.id} style={{ padding: "10px 16px", display: "flex", gap: 12, borderBottom: i < INTERVIEW_QUESTIONS.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                <span style={{ fontSize: 13, marginTop: 2, flexShrink: 0 }}>{q.emoji}</span>
                <div>
                  <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, marginBottom: 2 }}>{q.label}</p>
                  <p style={{ fontSize: 11, color: receipt.answers?.[q.id] ? "#334155" : "#CBD5E1", fontStyle: receipt.answers?.[q.id] ? "normal" : "italic", wordBreak: "break-word" }}>
                    {receipt.answers?.[q.id] || "미입력"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowDeepen(true)} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#A78BFA)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>💡 아이디어 심화하기</button>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "#F1F5F9", color: "#475569", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>닫기</button>
          </div>
          {showDeepen && <DeepenModal answers={receipt.answers} pov={receipt.pov || ""} receiptId={receipt.id} onClose={() => setShowDeepen(false)} />}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function AXAgentChat() {
  const [stage, setStage]                     = useState("welcome")
  const [messages, setMessages]               = useState([])
  const [currentQ, setCurrentQ]               = useState(0)
  const [answers, setAnswers]                 = useState({})
  const [firstMsg, setFirstMsg]               = useState("")
  const [input, setInput]                     = useState("")
  const [isTyping, setIsTyping]               = useState(false)
  const [receipts, setReceipts]               = useState([])
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [sidebarTab, setSidebarTab]           = useState("history")
  const [notionSaved, setNotionSaved]         = useState(undefined)
  const [showDeepen, setShowDeepen]           = useState(false)
  const [deepenData, setDeepenData]           = useState(null)
  const [sessionUser, setSessionUser]         = useState(() => getSessionUser())
  const bottomRef    = useRef(null)
  const isSubmit     = useRef(false)
  const verdictRef   = useRef(null)
  const receiptIdRef = useRef(null)
  const reasonRef    = useRef("")
  const povRef       = useRef("")

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isTyping, stage])

  function refreshReceipts() {
    return queryNotion().then(result => {
      if (result.ok && result.data?.results) {
        setReceipts(result.data.results.map(parseNotionPage))
      }
    })
  }

  useEffect(() => { refreshReceipts() }, [])

  // notionSaved 바뀌면 마지막 VerdictCard 업데이트
  useEffect(() => {
    if (notionSaved === undefined) return
    setMessages(prev => {
      const copy = [...prev]
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].isVerdict) {
          copy[i] = { ...copy[i], content: <VerdictCard verdict={verdictRef.current} receiptId={receiptIdRef.current} reason={reasonRef.current} pov={povRef.current} notionSaved={notionSaved} /> }
          break
        }
      }
      return copy
    })
  }, [notionSaved])

  function addMsg(from, content, extra = {}) {
    setMessages(prev => [...prev, { from, content, id: Date.now() + Math.random(), ...extra }])
    setIsTyping(false)
  }
  function agentSay(content, delay = 600) {
    setIsTyping(true)
    setTimeout(() => addMsg("agent", content), delay)
  }

  function startIntro() {
    setStage("intro")
    agentSay(<span>안녕하세요! 👋 저는 <strong>AX스쿼드 과제접수 에이전트</strong>입니다.<br /><br />생성형 AI, 업무 자동화, AX 역량 강화 아이디어를 대화로 접수해드려요.</span>)
    setTimeout(() => {
      agentSay(<span>지금 업무에서 어떤 <strong>불편함이나 해결하고 싶은 문제</strong>가 있으신가요?<br /><span style={{ color: "#94A3B8", fontSize: 12 }}>예) 매주 엑셀 리포트를 수작업으로 만드는데 너무 오래 걸려요</span></span>, 1400)
      setStage("interview-init")
    }, 800)
  }

  function handleInitAnswer() {
    if (!input.trim()) return
    const text = input.trim(); setFirstMsg(text); setInput("")
    addMsg("user", text)
    setTimeout(() => {
      agentSay(<span>좋아요! 몇 가지 질문을 드릴게요.<br /><span style={{ color: "#94A3B8", fontSize: 12 }}>({INTERVIEW_QUESTIONS.length}개 질문, 5분 이내)</span></span>)
      setTimeout(() => {
        setStage("interview")
        agentSay(<span><span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>질문 1/{INTERVIEW_QUESTIONS.length}</span><br />{INTERVIEW_QUESTIONS[0].emoji} <strong>{INTERVIEW_QUESTIONS[0].label}</strong><br />{INTERVIEW_QUESTIONS[0].question}</span>, 1000)
      }, 1200)
    }, 400)
  }

  function handleInterviewAnswer() {
    if (!input.trim()) return
    const text = input.trim()
    const qId = INTERVIEW_QUESTIONS[currentQ].id
    const newAnswers = { ...answers, [qId]: text }
    setAnswers(newAnswers); setInput("")
    addMsg("user", text)
    const next = currentQ + 1
    if (next < INTERVIEW_QUESTIONS.length) {
      setCurrentQ(next)
      setTimeout(() => agentSay(
        <span><span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>질문 {next+1}/{INTERVIEW_QUESTIONS.length}</span><br />{INTERVIEW_QUESTIONS[next].emoji} <strong>{INTERVIEW_QUESTIONS[next].label}</strong><br />{INTERVIEW_QUESTIONS[next].question}</span>
      ), 400)
    } else {
      setTimeout(() => {
        agentSay(<span>수고하셨어요! 내용을 정리했어요. 확인해주세요. ✏️</span>)
        setTimeout(() => { setStage("pov-confirm"); addMsg("agent", <POVCard answers={newAnswers} />) }, 1000)
      }, 400)
    }
  }

  async function confirmPOV() {
    addMsg("user", "맞아요, 접수해주세요!")
    const rId = makeReceiptId()
    const { name: sessName, team: sessTeam } = getSessionNameAndTeam()
    const applicantName = sessName ? `[${sessName}] ` : ""
    const title = applicantName + (firstMsg.length > 18 ? firstMsg.slice(0, 18) + "…" : firstMsg)
    receiptIdRef.current = rId
    agentSay(<span>AI로 과제를 평가하고 있어요... ✨</span>)

    const modifiedAnswers = { name: sessName, team: sessTeam, ...answers }
    const { verdict: v, reason, pov } = await evaluatePOVWithAI(modifiedAnswers)
    verdictRef.current = v; reasonRef.current = reason; povRef.current = pov
    setNotionSaved(null)

    setTimeout(() => {
      setStage("verdict")
      addMsg("agent", <VerdictCard verdict={v} receiptId={rId} reason={reason} pov={pov} notionSaved={null} />, { isVerdict: true })
      // Notion 저장 (기존 notion.js 엔드포인트)
      saveToNotion({ receiptId: rId, answers: modifiedAnswers, verdict: v, firstMsg, pov }).then(result => {
        setNotionSaved(result)
        refreshReceipts()
      })
      setDeepenData({ answers: modifiedAnswers, pov, receiptId: rId })

      if (v === "GO") {
        setTimeout(() => {
          agentSay(
            <span>🎉 접수가 완료되었어요!<br /><br />
              <strong>{sessName || "신청자"}</strong>님 ({sessTeam || "소속팀 미입력"})<br />
              접수번호: <strong>{rId}</strong><br /><br />
              <span style={{ color: "#475569" }}>AX스쿼드 담당자 분이 직접 연락드릴 예정이에요. 😊</span>
            </span>
          )
          setTimeout(() => setStage("done"), 1200)
        }, 800)
      } else {
        setTimeout(() => setStage("done"), 1200)
      }
    }, 400)
  }

  function handleSend() {
    if (isSubmit.current) return
    isSubmit.current = true
    setTimeout(() => { isSubmit.current = false }, 800)
    if (stage === "interview-init") return handleInitAnswer()
    if (stage === "interview") return handleInterviewAnswer()
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault(); handleSend()
    }
  }

  function reset() {
    setStage("welcome"); setMessages([]); setCurrentQ(0); setAnswers({})
    setFirstMsg(""); setInput(""); setNotionSaved(undefined)
    verdictRef.current = null; receiptIdRef.current = null; reasonRef.current = ""
  }

  function handleLogout() {
    sessionStorage.clear()
    window.location.reload()
  }

  const showInput = stage === "interview-init" || stage === "interview"

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif", overflow: "hidden" }}>

      {/* ── 사이드바 ── */}
      <div style={{ width: 240, background: "white", borderRight: "1px solid #F1F5F9", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤝</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", margin: 0 }}>AX 에이전트</p>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>과제 접수 도우미</p>
          </div>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <button onClick={reset} style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span>✚</span> 새 과제 접수
          </button>
        </div>

        <div style={{ padding: "4px 16px 8px" }}>
          <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>지원 영역</p>
          {SQUAD_MEMBERS.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", margin: 0 }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 16px", display: "flex", gap: 4, borderBottom: "1px solid #F1F5F9" }}>
          {[["history","접수 히스토리"],["sprint","스프린트"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setSidebarTab(tab)} style={{
              flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
              background: "none", borderBottom: sidebarTab === tab ? "2px solid #3B82F6" : "2px solid transparent",
              color: sidebarTab === tab ? "#3B82F6" : "#94A3B8"
            }}>{label}</button>
          ))}
        </div>


        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
          {sidebarTab === "history" ? (
            receipts.length === 0
              ? <p style={{ fontSize: 11, color: "#CBD5E1", padding: "8px 0" }}>접수 내역이 없습니다</p>
              : receipts.map(r => <HistoryItem key={r.id} r={r} onClick={() => setSelectedReceipt(r)} />)
          ) : (
            <div style={{ paddingTop: 4 }}>
              {SPRINTS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 4px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", margin: 0, lineHeight: 1.4 }}>{s.label}</p>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", margin: 0 }}>{sessionUser.name || "사용자"}</p>
              <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sessionUser.email || ""}</p>
            </div>
            <button onClick={handleLogout} style={{ padding: "4px 10px", borderRadius: 8, background: "#F1F5F9", color: "#64748B", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.color = "#EF4444" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = "#64748B" }}>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* ── 메인 채팅 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "white", borderBottom: "1px solid #F1F5F9", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <AgentAvatar size="sm" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", margin: 0 }}>AX스쿼드 에이전트</p>
            <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>과제 접수 도우미</p>
          </div>
          {stage === "interview" && (
            <div style={{ marginLeft: "auto" }}>
              <ProgressBar total={INTERVIEW_QUESTIONS.length} current={currentQ} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {stage === "welcome" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 8px 32px rgba(59,130,246,0.3)" }}>🤝</div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", margin: "0 0 8px" }}>AX스쿼드 에이전트</h1>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>AI/DX 아이디어가 있으신가요?<br />대화로 과제를 접수해드려요. 인터뷰 없이 5분 이내 완료.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, width: "100%", maxWidth: 360 }}>
                {SQUAD_MEMBERS.map(m => (
                  <div key={m.id} style={{ background: "white", borderRadius: 16, padding: 16, border: "1px solid #F1F5F9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", textAlign: "center" }}>
                    <span style={{ fontSize: 24, display: "block", marginBottom: 4 }}>{m.emoji}</span>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#334155", margin: 0 }}>{m.role}</p>
                  </div>
                ))}
              </div>
              <button onClick={startIntro} style={{ padding: "12px 32px", borderRadius: 16, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "white", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
                과제 접수 시작하기 →
              </button>
            </div>
          )}

          {stage !== "welcome" && messages.map(msg => (
            <ChatBubble key={msg.id} from={msg.from}>{msg.content}</ChatBubble>
          ))}

          {isTyping && (
            <div style={{ display: "flex", gap: 12 }}>
              <AgentAvatar />
              <div style={{ background: "white", border: "1px solid #F1F5F9", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1", animation: `bounce-dot 1s infinite ${d}s` }} />
                ))}
              </div>
            </div>
          )}

          {stage === "pov-confirm" && !isTyping && (
            <div style={{ display: "flex", gap: 8, paddingLeft: 52 }}>
              <button onClick={confirmPOV} style={{ padding: "8px 16px", borderRadius: 12, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                ✅ 맞아요, 접수해주세요
              </button>
              <button onClick={() => { setStage("interview"); setCurrentQ(0); agentSay("다시 처음부터 시작할게요!") }}
                style={{ padding: "8px 16px", borderRadius: 12, background: "#F1F5F9", color: "#475569", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                ✏️ 수정할게요
              </button>
            </div>
          )}

          {stage === "done" && !isTyping && (
            <div style={{ paddingLeft: 52 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {deepenData && (
                  <button onClick={() => setShowDeepen(true)} style={{ padding: "8px 16px", borderRadius: 12, background: "linear-gradient(135deg,#7C3AED,#A78BFA)", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                    💡 아이디어 심화하기
                  </button>
                )}
                <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 12, background: "#F1F5F9", color: "#475569", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  새 과제 접수하기
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {showInput && (
          <div style={{ background: "white", borderTop: "1px solid #F1F5F9", padding: "16px 24px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                placeholder={stage === "interview" ? INTERVIEW_QUESTIONS[currentQ]?.placeholder : "문제를 설명해주세요..."}
                style={{ flex: 1, resize: "none", borderRadius: 16, border: "1px solid #E2E8F0", background: "#F8FAFC", padding: "12px 16px", fontSize: 13, color: "#334155", outline: "none", minHeight: 48, maxHeight: 120, fontFamily: "inherit" }}
              />
              <button onClick={handleSend} disabled={!input.trim()}
                style={{ width: 48, height: 48, borderRadius: 16, background: input.trim() ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "#E2E8F0", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>Enter로 전송 · Shift+Enter 줄바꿈</p>
          </div>
        )}
      </div>

      {selectedReceipt && <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
      {showDeepen && deepenData && <DeepenModal answers={deepenData.answers} pov={deepenData.pov} receiptId={deepenData.receiptId} onClose={() => setShowDeepen(false)} />}
    </div>
  )
}
