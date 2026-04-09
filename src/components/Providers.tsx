"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EventType, type EventMessage, type AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/auth/msalInstance";
import { loginRequest } from "@/auth/authConfig";
import { useUserStore } from "@/stores/useUserStore";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractIpaddr(accessToken: string): string {
  if (!accessToken) return "";
  const payload = decodeJwtPayload(accessToken);
  return (payload?.ipaddr as string) || "";
}

async function persistAuthenticatedSession(
  account: { username?: string; name?: string },
  idToken = "",
  accessToken = "",
) {
  let resolvedIdToken = idToken;
  let resolvedAccessToken = accessToken;

  if (!resolvedAccessToken) {
    try {
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account as Parameters<typeof msalInstance.acquireTokenSilent>[0]["account"],
      });
      resolvedAccessToken = response.accessToken || "";
      if (!resolvedIdToken) {
        resolvedIdToken = response.idToken || "";
      }
    } catch {
      // silent token acquisition failed
    }
  }

  const email = account?.username || "";
  const name = account?.name || "";
  const ipaddr = extractIpaddr(resolvedAccessToken);

  useUserStore
    .getState()
    .login(email, name, resolvedIdToken, resolvedAccessToken, ipaddr);
}

export default function Providers({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await msalInstance.initialize();

        const response = await msalInstance.handleRedirectPromise();
        if (response?.account) {
          msalInstance.setActiveAccount(response.account);
          await persistAuthenticatedSession(
            response.account,
            response.idToken || "",
            response.accessToken || "",
          );
        }

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const activeAccount = accounts[0];
          msalInstance.setActiveAccount(activeAccount);

          const sessionState = useUserStore.getState();
          if (!sessionState.accessToken && activeAccount) {
            await persistAuthenticatedSession(activeAccount);
          }
        }

        msalInstance.addEventCallback((event: EventMessage) => {
          if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
            const payload = event.payload as AuthenticationResult;
            if (payload.account) {
              msalInstance.setActiveAccount(payload.account);
              void persistAuthenticatedSession(
                payload.account,
                payload.idToken || "",
                payload.accessToken || "",
              );
            }
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("MSAL initialization failed:", error);
      }
    }

    init();
  }, []);

  if (!isInitialized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#F8FAFC",
          fontFamily:
            "'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",
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
            인증 시스템 초기화 중
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: "#64748B",
            }}
          >
            Microsoft 로그인 정보를 확인하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}
