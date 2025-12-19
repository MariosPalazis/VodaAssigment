import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store/store";
import {
  loginApi,
  registerApi,
  type LoginRequest,
  type RegisterRequest,
  type AuthResponseRaw,
} from "../../api/auth";

export interface AuthUser {
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<AuthResponseRaw, LoginRequest>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await loginApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Login failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const registerThunk = createAsyncThunk<AuthResponseRaw, RegisterRequest>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await registerApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Registration failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => {
      state.loading = true;
      state.error = null;
    };
    const fulfilled = (state: AuthState, action: PayloadAction<AuthResponseRaw>) => {
      state.loading = false;
      state.error = null;
      state.token = action.payload.token;
      state.user = { name: action.payload.info.name };
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify({ name: action.payload.info.name }));
    };
    const rejected = (state: AuthState, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload || "Something went wrong.";
    };

    builder
      .addCase(loginThunk.pending, pending)
      .addCase(loginThunk.fulfilled, fulfilled)
      .addCase(loginThunk.rejected, rejected)
      .addCase(registerThunk.pending, pending)
      .addCase(registerThunk.fulfilled, fulfilled)
      .addCase(registerThunk.rejected, rejected);
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
