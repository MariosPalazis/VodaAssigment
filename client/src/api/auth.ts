import { api } from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// This matches your backend response:
export interface AuthResponseRaw {
  token: string;
  info: {
    name: string;
  };
}

// We'll map this to an internal shape in authSlice
export async function loginApi(payload: LoginRequest): Promise<AuthResponseRaw> {
  const res = await api.post<AuthResponseRaw>("/authentication/login", payload);
  return res.data;
}

export async function registerApi(
  payload: RegisterRequest
): Promise<AuthResponseRaw> {
  const res = await api.post<AuthResponseRaw>("/authentication/register", payload);
  return res.data;
}
