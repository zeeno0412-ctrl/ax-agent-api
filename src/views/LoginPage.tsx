"use client";

import { useState } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { hasRequiredMsalEnv, loginRequest } from "@/auth/authConfig";

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 35%), linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)",
  fontFamily: "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "28px",
  padding: "32px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
  backdropFilter: "blur(12px)",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  textAlign: "center",
};

export default function LoginPage() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated) {
    return null;
  }

  const isBusy = inProgress !== InteractionStatus.None;
  const isDisabled = isBusy || !hasRequiredMsalEnv;

  async function handleLogin() {
    setErrorMessage("");

    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("MSAL loginRedirect failed:", error);
      setErrorMessage("로그인을 시작하지 못했습니다. Azure AD 환경 변수를 확인해주세요.");
    }
  }

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
            background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
            boxShadow: "0 16px 40px rgba(59,130,246,0.25)",
            color: "white",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          AX
        </div>

        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563EB",
            }}
          >
            Microsoft Entra ID
          </p>
          <h1
            style={{
              margin: "10px 0 8px",
              fontSize: 30,
              lineHeight: 1.2,
              color: "#0F172A",
            }}
          >
            AX스쿼드 에이전트
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            Microsoft 계정으로 로그인한 뒤
            <br />
            AX스쿼드 에이전트를 이용할 수 있습니다.
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isDisabled}
          style={{
            width: "100%",
            height: 52,
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: isDisabled ? "not-allowed" : "pointer",
            background: isDisabled
              ? "#CBD5E1"
              : "linear-gradient(135deg, #0F172A, #2563EB)",
            color: "white",
            boxShadow: isDisabled ? "none" : "0 18px 36px rgba(37,99,235,0.22)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          {isBusy ? "로그인 준비 중..." : "로그인"}
        </button>

        {!hasRequiredMsalEnv && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              color: "#9A3412",
              fontSize: 13,
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`, `NEXT_PUBLIC_AZURE_AD_TENANT_ID`,
            `NEXT_PUBLIC_AZURE_AD_REDIRECT_URI` 값을 설정해야 로그인할 수 있습니다.
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 13,
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
