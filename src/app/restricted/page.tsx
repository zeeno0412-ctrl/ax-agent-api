"use client";

import AuthStateSync from "@/auth/AuthStateSync";
import RestrictedPage from "@/views/RestrictedPage";

export default function RestrictedPageRoute() {
  return (
    <>
      <AuthStateSync />
      <RestrictedPage />
    </>
  );
}
