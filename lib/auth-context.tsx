"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Helper functions for localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem("eve-user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("eve-user");
    return null;
  }
};

const setStoredUser = (user: User, token: string) => {
  localStorage.setItem("eve-user", JSON.stringify(user));
  localStorage.setItem("token", token);
};

const removeStoredUser = () => {
  localStorage.removeItem("eve-user");
  localStorage.removeItem("token");
};

// إنشاء الكونتكست
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: () => { },
});

// كومبوننت المزود (Provider)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // التحقق من وجود يوزر محفوظ بعد التأكد من التصفح على client
  useEffect(() => {
    if (!mounted) return;
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);
    setIsLoading(false);
  }, [mounted]);

  // تسجيل الدخول
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        toast({ title: "Login Failed", description: "Invalid email or password", variant: "destructive" });
        return false;
      }

      const responseData: { user: User; token: string } = await response.json();
      setUser(responseData.user);
      setStoredUser(responseData.user, responseData.token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({ title: "Login Error", description: "Something went wrong", variant: "destructive" });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeStoredUser();
    router.push("/");
  }, [router]);

  if (!mounted) {
    // ✅ منع مشاكل SSR/Hydration
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// هوك استخدام الكونتكست
export function useAuth() {
  return useContext(AuthContext);
}

// HOC لحماية الصفحات
export function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/"); // ممكن تحط redirect للصفحة المطلوبة بعد login
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl animate-pulse">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}
