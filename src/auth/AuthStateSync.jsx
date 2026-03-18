import { useEffect } from "react";
import { InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore, ALLOWED_IPS } from "../stores/useUserStore";

export default function AuthStateSync() {
  const { accounts, inProgress, instance } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);
  const ipaddr = useUserStore((state) => state.ipaddr);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) {
      return;
    }

    const activeAccount = instance.getActiveAccount() ?? accounts[0] ?? null;

    if (activeAccount) {
      const isAllowedIp = ipaddr && ALLOWED_IPS.includes(ipaddr);

      if (!isAllowedIp) {
        if (location.pathname !== "/restricted") {
          navigate("/restricted", { replace: true });
        }
        return;
      }

      if (location.pathname === "/login" || location.pathname === "/restricted") {
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
  ]);

  return null;
}
