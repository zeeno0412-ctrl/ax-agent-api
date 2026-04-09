"use client";

import AuthStateSync from "@/auth/AuthStateSync";
import UnsupportedBrowserPage from "@/views/UnsupportedBrowserPage";

export default function UnsupportedBrowserPageRoute() {
  return (
    <>
      <AuthStateSync />
      <UnsupportedBrowserPage />
    </>
  );
}
