import { useUserStore } from "../stores/useUserStore";

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

export default function RestrictedPage() {
  const ipaddr = useUserStore((state) => state.ipaddr);

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
            background: "linear-gradient(135deg, #DC2626, #EF4444)",
            boxShadow: "0 16px 40px rgba(239,68,68,0.25)",
            color: "white",
            fontSize: 28,
          }}
        >
          🔒
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
            접속 환경 제한
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            AX스쿼드 에이전트는
            <br />
            사내망에서만 접속 가능합니다.
          </p>
        </div>

        {ipaddr && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 16,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#991B1B",
                lineHeight: 1.6,
              }}
            >
              현재 접속 IP:{" "}
              <strong style={{ fontWeight: 700 }}>{ipaddr}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
