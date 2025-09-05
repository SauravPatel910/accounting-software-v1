import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authApi, type User } from "../services/api";

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, company?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth-token");
    if (token) {
      // Try to get current user info
      authApi
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setSession({ token });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem("auth-token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name?: string, company?: string) => {
    try {
      const response = await authApi.register({
        name: name || email.split("@")[0],
        email,
        password,
        company,
      });

      setUser(response.user);
      setSession({ token: response.token });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      setUser(response.user);
      setSession({ token: response.token });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async () => {
    // TODO: Implement password reset
    return { error: new Error("Password reset not implemented yet") };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
