"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginScreen from "@/components/login-screen";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
// sdffe
  useEffect(() => {
    if (mounted && isAuthenticated && !isLoading) {
      router.push("/home");
    }
  }, [isAuthenticated, isLoading, router, mounted]);

  // Don't render anything on the server to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:from-gray-900 dark:to-gray-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return <LoginScreen />;
}
