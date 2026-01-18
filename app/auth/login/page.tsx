"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/stores/auth-store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectUrl = searchParams.get("redirect");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, redirectUrl || undefined);
      // Navigate to redirect URL or workspace page on success (handled in auth store)
    } catch (err: any) {
      // Check for specific error messages from the API
      const errorMessage = err?.response?.data?.message;
      
      // If we have a 401 status or specific authentication error, show Vietnamese message
      if (err?.response?.status === 401 || errorMessage?.toLowerCase().includes('invalid') || errorMessage?.toLowerCase().includes('incorrect') || errorMessage?.toLowerCase().includes('wrong')) {
        setError("Sai tài khoản hoặc mật khẩu");
      } else if (errorMessage) {
        setError(errorMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Sai tài khoản hoặc mật khẩu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    router.push("/auth/signup");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">WorkMind</h1>
          <p className="text-muted-foreground">
            AI-powered task management for teams
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your WorkMind account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <button
                onClick={handleSignupClick}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
