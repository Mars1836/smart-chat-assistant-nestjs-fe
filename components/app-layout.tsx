"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  Bot,
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";
import { useWorkspace } from "@/lib/stores/workspace-store";

interface AppLayoutProps {
  children: React.ReactNode;
  activeModule: "chat" | "calendar" | "documents" | "team" | "chatbots" | "settings";
}

export function AppLayout({ children, activeModule }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const {
    selectedWorkspace,
    workspaces,
    selectWorkspace,
    loadWorkspaces,
    isLoading,
  } = useWorkspace();

  const handleLogout = () => {
    logout();
  };

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to workspace selection if no workspace is selected
  useEffect(() => {
    // Only redirect if:
    // 1. Not currently loading
    // 2. No workspace is selected
    // 3. Not already on the workspace selection page
    if (!isLoading && !selectedWorkspace && pathname !== "/workspace") {
      router.push("/workspace");
    }
  }, [isLoading, selectedWorkspace, pathname, router]);

  // Don't render layout if redirecting (no workspace selected and not on workspace page)
  if (!isLoading && !selectedWorkspace && pathname !== "/workspace") {
    return null;
  }

  const modules = [
    { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      href: "/calendar",
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      href: "/documents",
    },
    { id: "team", label: "Team", icon: Users, href: "/team" },
    {
      id: "chatbots",
      label: "Chatbots",
      icon: Bot,
      href: "/chatbots",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/chat" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                W
              </span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg text-sidebar-foreground">
                WorkMind
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <Link
                key={module.id}
                href={module.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{module.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-center"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-muted border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <span className="text-sm font-medium">
                    {selectedWorkspace?.name || "No workspace"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => selectWorkspace(workspace)}
                    className={
                      selectedWorkspace?.id === workspace.id
                        ? "bg-primary/10"
                        : ""
                    }
                  >
                    {workspace.name}
                    {selectedWorkspace?.id === workspace.id && (
                      <span className="ml-2 text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/workspace")}
                >
                  Create workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full w-10 h-10 bg-primary/10"
                >
                  <span className="text-sm font-bold text-primary">JD</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
