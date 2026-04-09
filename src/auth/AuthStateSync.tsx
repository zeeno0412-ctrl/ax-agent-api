"use client";

import { useEffect, useState } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore, ALLOWED_IPS } from "@/stores/useUserStore";
import { queryNotionUsers } from "@/utils/notion";

export default function AuthStateSync() {
  const { accounts, inProgress, instance } = useMsal();
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);
  const ipaddr = useUserStore((state) => state.ipaddr);
  const setUserAuthorized = useUserStore((state) => state.setUserAuthorized);
  const [allowedEmails, setAllowedEmails] = useState<string[] | null>(null);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;
    const isAllowedIp = ipaddr && ALLOWED_IPS.includes(ipaddr);
    if (!activeAccount || !isAllowedIp || allowedEmails !== null) return;

    queryNotionUsers().then((result) => {
      if (result.ok && result.data?.results) {
        const emails = result.data.results
          .map((p: Record<string, unknown>) => {
            const props = p.properties as Record<string, Record<string, unknown>> | undefined;
            const titleArr = props?.["허용 계정/그룹"]?.title as Array<{ plain_text: string }> | undefined;
            return titleArr?.[0]?.plain_text || "";
          })
          .filter(Boolean)
          .map((e: string) => e.toLowerCase());
        setAllowedEmails(emails);
      } else if (result.isFetchError) {
        router.replace("/unsupported-browser");
      } else {
        setAllowedEmails([]);
      }
    });
  }, [accounts, inProgress, instance, ipaddr, allowedEmails, router]);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;

    if (activeAccount) {
      const isAllowedIp = ipaddr && ALLOWED_IPS.includes(ipaddr);

      if (!isAllowedIp) {
        if (pathname !== "/restricted") {
          router.replace("/restricted");
        }
        return;
      }

      if (allowedEmails === null) return;

      const email = (sessionStorage.getItem("email") || "").toLowerCase();
      if (!allowedEmails.includes(email)) {
        setUserAuthorized(false);
        if (pathname !== "/unauthorized") {
          router.replace("/unauthorized");
        }
        return;
      }

      setUserAuthorized(true);
      if (["/login", "/restricted", "/unauthorized"].includes(pathname)) {
        router.replace("/");
      }
      return;
    }

    clearUser();

    if (pathname !== "/login") {
      router.replace("/login");
    }
  }, [
    accounts,
    clearUser,
    inProgress,
    instance,
    ipaddr,
    pathname,
    router,
    allowedEmails,
    setUserAuthorized,
  ]);

  return null;
}
