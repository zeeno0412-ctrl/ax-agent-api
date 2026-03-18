import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import AuthStateSync from "./auth/AuthStateSync.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RestrictedPage from "./pages/RestrictedPage.jsx";

function LoadingScreen({ title, description }) {
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
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
          {title}
        </h1>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#64748B" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function hasAuthenticatedAccount(instance, accounts) {
  return Boolean(instance.getActiveAccount() ?? accounts[0]);
}

function HomeRoute() {
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  if (inProgress !== InteractionStatus.None) {
    return (
      <LoadingScreen
        title="인증 정보를 확인하는 중"
        description="Microsoft 로그인 상태를 읽고 메인 화면으로 이동하고 있습니다."
      />
    );
  }

  if (!isAuthenticated && !hasAuthenticatedAccount(instance, accounts)) {
    return <Navigate to="/login" replace />;
  }

  return <App />;
}

function LoginRoute() {
  const { accounts, inProgress, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  if (inProgress !== InteractionStatus.None) {
    return (
      <LoadingScreen
        title="로그인 결과를 처리하는 중"
        description="리다이렉트 응답을 처리한 뒤 자동으로 다음 화면으로 이동합니다."
      />
    );
  }

  if (isAuthenticated || hasAuthenticatedAccount(instance, accounts)) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

export default function RootApp() {
  return (
    <>
      <AuthStateSync />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/restricted" element={<RestrictedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
