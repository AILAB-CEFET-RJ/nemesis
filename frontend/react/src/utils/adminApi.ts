import { getAuthHeaders } from "./auth";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export type AdminUser = {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
  roles: string[];
  permissions: string[];
};

export type AdminRole = {
  id: number;
  name: string;
};

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar usuários.");
  }
  return await response.json();
};

export const fetchAdminRoles = async (): Promise<AdminRole[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/roles`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) {
    throw new Error("Erro ao carregar roles.");
  }
  return await response.json();
};

export const createAdminUser = async (
  username: string,
  password: string,
  roles: string[]
) => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ username, password, roles }),
  });
  if (!response.ok) {
    throw new Error("Erro ao criar usuário.");
  }
  return await response.json();
};

export const updateAdminUserRoles = async (userId: number, roles: string[]) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/roles`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ roles }),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar roles.");
  }
  return await response.json();
};

export const updateAdminUser = async (
  userId: number,
  payload: { is_active?: boolean; password?: string }
) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar usuário.");
  }
  return await response.json();
};
