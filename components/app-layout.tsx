"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Users,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  Bot,
  Plug,
  Book,
  CreditCard,
  Coins,
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { workspacesApi, type WorkspaceWallet } from "@/lib/api";

interface AppLayoutProps {
  children: React.ReactNode;
  activeModule: "chat" | "team" | "chatbots" | "settings" | "plugins" | "knowledge" | "billing" | "pricing";
}

export function AppLayout({ children, activeModule }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [wallet, setWallet] = useState<WorkspaceWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t, locale } = useLanguage();
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

  // Load wallet when workspace changes
  useEffect(() => {
    const loadWallet = async () => {
      if (!selectedWorkspace) {
        setWallet(null);
        return;
      }
      try {
        setWalletLoading(true);
        const data = await workspacesApi.getWallet(selectedWorkspace.id);
        setWallet(data);
      } catch (error) {
        // Silent fail – không chặn UI nếu ví lỗi
        setWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    loadWallet();
  }, [selectedWorkspace]);

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

  const canViewBilling =
    selectedWorkspace?.user_role === "Owner" ||
    selectedWorkspace?.user_role === "Admin";

  const modules = [
    { id: "chat", label: t("layout.chat"), icon: MessageSquare, href: "/chat" },
    { id: "team", label: t("layout.team"), icon: Users, href: "/team" },
    {
      id: "chatbots",
      label: t("layout.chatbots"),
      icon: Bot,
      href: "/chatbots",
    },
    {
      id: "plugins",
      label: t("layout.plugins"),
      icon: Plug,
      href: "/plugins",
    },
    {
      id: "knowledge",
      label: t("layout.knowledge"),
      icon: Book,
      href: "/knowledge",
    },
    ...(canViewBilling
      ? [
          {
            id: "billing" as const,
            label: t("layout.billing"),
            icon: CreditCard,
            href: "/billing",
          },
        ]
      : []),
    {
      id: "pricing",
      label: t("layout.pricing"),
      icon: Coins,
      href: "/pricing",
    },
    {
      id: "settings",
      label: t("layout.settings"),
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
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-muted border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />

            {/* Workspace Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <span className="text-sm font-medium">
                    {selectedWorkspace?.name || t("layout.noWorkspace")}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
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
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{workspace.name}</span>
                        {selectedWorkspace?.id === workspace.id && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {workspace.user_role}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/workspace")}
                >
                  {t("layout.createWorkspace")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Workspace Wallet */}
            {selectedWorkspace && (
              <div className="flex flex-col items-end text-xs min-w-[180px]">
                <span className="font-medium">
                  {t("layout.balance")}:{" "}
                  {walletLoading
                    ? t("layout.loadingBalance")
                    : wallet
                    ? `${new Intl.NumberFormat(
                        locale === "vi" ? "vi-VN" : "en-US",
                        {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                      ).format(wallet.balance)} ${wallet.currency}`
                    : t("layout.noWalletData")}
                </span>
                {wallet && wallet.status !== "active" && (
                  <span className="mt-0.5 text-destructive">
                    {t("layout.walletLocked")}
                  </span>
                )}
              </div>
            )}

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
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  {t("common.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  {t("layout.workspaceSettings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  {t("common.signOut")}
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
