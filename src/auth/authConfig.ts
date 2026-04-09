import { BrowserCacheLocation } from "@azure/msal-browser";
import type { Configuration, RedirectRequest } from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID ?? "";
const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID ?? "";
const configuredAuthority = process.env.NEXT_PUBLIC_AZURE_AD_AUTHORITY ?? "";
const authority =
  configuredAuthority ||
  (tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : "");
const redirectUri = process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI ?? "";
const fallbackRedirectUri =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const hasRequiredMsalEnv = Boolean(clientId && authority && redirectUri);
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "00000000-0000-0000-0000-000000000000",
    authority: authority || "https://login.microsoftonline.com/common",
    redirectUri: redirectUri || fallbackRedirectUri,
    postLogoutRedirectUri: redirectUri || fallbackRedirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage" as BrowserCacheLocation,
  },
};

export const loginRequest: RedirectRequest = {
  scopes: ["api://630155e4-c2b1-4f65-bf07-c902b4455ad5/access_as_user"],
};
