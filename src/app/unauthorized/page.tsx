"use client";

import AuthStateSync from "@/auth/AuthStateSync";
import UnauthorizedPage from "@/views/UnauthorizedPage";

export default function UnauthorizedPageRoute() {
  return (
    <>
      <AuthStateSync />
      <UnauthorizedPage />
    </>
  );
}
