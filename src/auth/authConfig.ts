/// <reference types="vite/client" />

import { BrowserCacheLocation } from "@azure/msal-browser";
import type { Configuration, RedirectRequest } from "@azure/msal-browser";

const env = import.meta.env;

const clientId =
  env.VITE_AZURE_AD_CLIENT_ID ?? env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID ?? "";
const tenantId =
  env.VITE_AZURE_AD_TENANT_ID ?? env.NEXT_PUBLIC_AZURE_AD_TENANT_ID ?? "";
const configuredAuthority =
  env.VITE_AZURE_AD_AUTHORITY ?? env.NEXT_PUBLIC_AZURE_AD_AUTHORITY ?? "";
const authority =
  configuredAuthority ||
  (tenantId ? `https://login.microsoftonline.com/${tenantId}` : "");
const redirectUri =
  env.VITE_AZURE_AD_REDIRECT_URI ?? env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI ?? "";
const fallbackRedirectUri =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

export const hasRequiredMsalEnv = Boolean(clientId && authority && redirectUri);

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: authority || "https://login.microsoftonline.com/common",
    redirectUri: redirectUri || fallbackRedirectUri,
    postLogoutRedirectUri: redirectUri || fallbackRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "email"],
};
