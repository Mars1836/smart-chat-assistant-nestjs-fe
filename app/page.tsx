"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  Calendar,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat if already authenticated
    if (!isLoading && isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGetStarted = () => {
    router.push("/auth/login");
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">WorkMind</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => router.push("/auth/login")}>
            Sign in
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push("/auth/signup")}
          >
            Get started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            AI-Powered Task Management
            <span className="block text-primary mt-2">for Modern Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your workflow with intelligent automation, seamless
            collaboration, and powerful AI assistance.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8"
              onClick={handleGetStarted}
            >
              Get started free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => router.push("/auth/login")}
            >
              Sign in
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Everything you need to stay productive
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-10 h-10 text-primary mb-4" />
              <CardTitle>AI Chat Assistant</CardTitle>
              <CardDescription>
                Get instant help with your tasks using advanced AI technology
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Smart Calendar</CardTitle>
              <CardDescription>
                Manage your schedule and never miss an important deadline
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Store, organize, and access all your files in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Work together seamlessly with your team members
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary/10 border-primary/20 max-w-3xl mx-auto">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of teams already using WorkMind to stay organized
              and efficient.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8"
              onClick={handleGetStarted}
            >
              Start for free today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <p>© 2025 WorkMind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
