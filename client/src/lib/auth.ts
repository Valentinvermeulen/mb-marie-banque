import type { User } from "../../../shared/schema";

const AUTH_KEY = "cic_auth_user";

export function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.setItem('lastUser', JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

export function getCurrentUser(): User | null {
  return getStoredUser();
}
