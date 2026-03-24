import { useEffect, useState } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore, ALLOWED_IPS } from "../stores/useUserStore";
import { queryNotionUsers } from "../utils/notion";

export default function AuthStateSync() {
  const { accounts, inProgress, instance } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const ipaddr = useUserStore((state) => state.ipaddr);
  const setUserAuthorized = useUserStore((state) => state.setUserAuthorized);
  const [allowedEmails, setAllowedEmails] = useState(null);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;
    const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;
    const isAllowedIp = ipaddr && ALLOWED_IPS.includes(ipaddr);
    if (!activeAccount || !isAllowedIp || allowedEmails !== null) return;

    queryNotionUsers().then((result) => {
      if (result.ok && result.data?.results) {
        const emails = result.data.results
          .map((p) => p.properties?.["허용 계정/그룹"]?.title?.[0]?.plain_text || "")
          .filter(Boolean)
          .map((e) => e.toLowerCase());
        setAllowedEmails(emails);
      } else if (result.isFetchError) {
        navigate("/unsupported-browser", { replace: true });
      } else {
        setAllowedEmails([]);
      }
    });
  }, [accounts, inProgress, instance, ipaddr, allowedEmails]);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;

    if (activeAccount) {
      const isAllowedIp = ipaddr && ALLOWED_IPS.includes(ipaddr);

      if (!isAllowedIp) {
        if (location.pathname !== "/restricted") {
          navigate("/restricted", { replace: true });
        }
        return;
      }

      if (allowedEmails === null) return;

      const email = (sessionStorage.getItem("email") || "").toLowerCase();
      if (!allowedEmails.includes(email)) {
        setUserAuthorized(false);
        if (location.pathname !== "/unauthorized") {
          navigate("/unauthorized", { replace: true });
        }
        return;
      }

      setUserAuthorized(true);
      if (["/login", "/restricted", "/unauthorized"].includes(location.pathname)) {
        navigate("/", { replace: true });
      }
      return;
    }

    clearUser();

    if (location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [
    accounts,
    clearUser,
    inProgress,
    instance,
    ipaddr,
    location.pathname,
    navigate,
    allowedEmails,
  ]);

  return null;
}
