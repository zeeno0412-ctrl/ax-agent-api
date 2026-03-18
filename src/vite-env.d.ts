/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_AD_CLIENT_ID?: string;
  readonly VITE_AZURE_AD_AUTHORITY?: string;
  readonly VITE_AZURE_AD_TENANT_ID?: string;
  readonly VITE_AZURE_AD_REDIRECT_URI?: string;
  readonly NEXT_PUBLIC_AZURE_AD_CLIENT_ID?: string;
  readonly NEXT_PUBLIC_AZURE_AD_AUTHORITY?: string;
  readonly NEXT_PUBLIC_AZURE_AD_TENANT_ID?: string;
  readonly NEXT_PUBLIC_AZURE_AD_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}