import { useUserStore } from "../stores/useUserStore";

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(234,179,8,0.10), transparent 35%), linear-gradient(180deg, #F8FAFC 0%, #FEFCE8 100%)",
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

export default function UnauthorizedPage() {
  const email = useUserStore((state) => state.email);

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
            background: "linear-gradient(135deg, #CA8A04, #EAB308)",
            boxShadow: "0 16px 40px rgba(234,179,8,0.25)",
            color: "white",
            fontSize: 28,
          }}
        >
          ⚠️
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
            접근 권한 없음
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            AX스쿼드 에이전트 이용 권한이 없습니다.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: "#64748B",
            }}
          >
            이용권한 문의:{" "}
            <a
              href="https://teams.microsoft.com/l/chat/0/0?users=kang.sa@gsretail.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#CA8A04", fontWeight: 600, textDecoration: "underline" }}
            >
              Teams 채팅
            </a>
          </p>
        </div>

        {email && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 16,
              background: "#FEFCE8",
              border: "1px solid #FDE68A",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#854D0E",
                lineHeight: 1.6,
              }}
            >
              현재 로그인 계정:{" "}
              <strong style={{ fontWeight: 700 }}>{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
