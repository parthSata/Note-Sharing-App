import { api } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthCredentials = {
  email: string;
  password: string;
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function saveAuthSession({ token, user }: AuthResponse) {
  const storage = getStorage();

  storage?.setItem("auth_token", token);
  storage?.setItem("auth_user", JSON.stringify(user));
}

function clearAuthSession() {
  const storage = getStorage();

  storage?.removeItem("auth_token");
  storage?.removeItem("auth_user");
}

export function useAuth() {
  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse, AuthCredentials>("/auth/login", {
      email,
      password,
    });

    saveAuthSession(response);

    return response.user;
  }

  async function register(email: string, password: string) {
    const response = await api.post<AuthResponse, AuthCredentials>("/auth/register", {
      email,
      password,
    });

    saveAuthSession(response);

    return response.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthSession();

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
  }

  function getUser() {
    const user = getStorage()?.getItem("auth_user");

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      clearAuthSession();
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getStorage()?.getItem("auth_token"));
  }

  return {
    login,
    register,
    logout,
    getUser,
    isLoggedIn,
  };
}
