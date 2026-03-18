import { create } from "zustand";

function setSessionValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    sessionStorage.setItem(key, value);
    return;
  }

  sessionStorage.removeItem(key);
}

function removeSessionValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(key);
}

export const ALLOWED_IPS = ["27.122.140.161", "165.243.5.40"];

type UserState = {
  email: string | null;
  name: string | null;
  idToken: string | null;
  accessToken: string | null;
  ipaddr: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    name: string,
    idToken: string,
    accessToken: string,
    ipaddr: string,
  ) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  email: null,
  name: null,
  idToken: null,
  accessToken: null,
  ipaddr: null,
  isAuthenticated: false,

  login: (email, name, idToken, accessToken, ipaddr) => {
    setSessionValue("idToken", idToken);
    setSessionValue("accessToken", accessToken);
    setSessionValue("name", name);
    setSessionValue("email", email);
    setSessionValue("ipaddr", ipaddr);

    set({
      email: email || null,
      name: name || null,
      idToken: idToken || null,
      accessToken: accessToken || null,
      ipaddr: ipaddr || null,
      isAuthenticated: true,
    });
  },

  clearUser: () => {
    removeSessionValue("idToken");
    removeSessionValue("accessToken");
    removeSessionValue("name");
    removeSessionValue("email");
    removeSessionValue("ipaddr");

    set({
      email: null,
      name: null,
      idToken: null,
      accessToken: null,
      ipaddr: null,
      isAuthenticated: false,
    });
  },
}));
