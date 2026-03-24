const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(239,68,68,0.10), transparent 35%), linear-gradient(180deg, #F8FAFC 0%, #FEF2F2 100%)",
  fontFamily: "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "28px",
  padding: "40px 32px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  textAlign: "center",
};

const SUPPORTED_BROWSERS = [
  { name: "Edge", icon: "🌐", color: "#0078D4" },
  { name: "Chrome", icon: "", color: "#4285F4" },
  { name: "Safari", icon: "🧭", color: "#006CFF" },
];

export default function UnsupportedBrowserPage() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,rgba(220, 38, 38, 0.25),rgba(239, 68, 68, 0.25))",
            boxShadow: "0 16px 40px rgba(239,68,68,0.25)",
            color: "white",
            fontSize: 28,
          }}
        >
          🚫
        </div>

        <div>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1.3,
              color: "#0F172A",
            }}
          >
            지원되지 않는 브라우저
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            현재 사용 중인 브라우저에서는
            <br />
            AX스쿼드 에이전트를 이용할 수 없습니다.
          </p>
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderRadius: 16,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
          }}
        >
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              fontWeight: 700,
              color: "#1E40AF",
            }}
          >
            아래 브라우저를 사용해주세요
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            {SUPPORTED_BROWSERS.map((b) => (
              <div
                key={b.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "white",
                    border: "1px solid #DBEAFE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {b.icon}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.7,
            color: "#64748B",
          }}
        >
          문의:{" "}
          <a
            href="https://teams.microsoft.com/l/chat/0/0?users=kang.sa@gsretail.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#3B82F6",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Teams 문의
          </a>
        </p>
      </div>
    </div>
  );
}
