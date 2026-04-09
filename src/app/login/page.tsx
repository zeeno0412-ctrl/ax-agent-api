"use client";

import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthStateSync from "@/auth/AuthStateSync";
import LoginPage from "@/views/LoginPage";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F8FAFC",
        fontFamily: "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 24,
          padding: 32,
          background: "white",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#3B82F6",
                opacity: 0.35 + index * 0.2,
              }}
            />
          ))}
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 20, color: "#0F172A" }}>
          로그인 결과를 처리하는 중
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#64748B" }}>
          리다이렉트 응답을 처리한 뒤 자동으로 다음 화면으로 이동합니다.
        </p>
      </div>
    </div>
  );
}

function LoginRoute() {
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const hasAccount = Boolean(instance.getActiveAccount() ?? accounts[0]);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    if (isAuthenticated || hasAccount) {
      router.replace("/");
    }
  }, [inProgress, isAuthenticated, hasAccount, router]);

  if (inProgress !== InteractionStatus.None) {
    return <LoadingScreen />;
  }

  if (isAuthenticated || hasAccount) {
    return <LoadingScreen />;
  }

  return <LoginPage />;
}

export default function LoginPageRoute() {
  return (
    <>
      <AuthStateSync />
      <LoginRoute />
    </>
  );
}
