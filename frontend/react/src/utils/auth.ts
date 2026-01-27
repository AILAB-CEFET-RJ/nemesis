const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "authToken";

export type AuthUser = {
  id: number;
  username: string;
  permissions: string[];
};

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginRequest = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error("Credenciais inválidas.");
  }
  const data = await response.json();
  return data.access_token as string;
};

export const fetchMe = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Sessão inválida.");
  }
  return await response.json();
};
