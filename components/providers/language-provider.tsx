"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Locale = "vi" | "en";

type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  vi: {
    "common.loading": "Đang tải...",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.create": "Tạo",
    "common.search": "Tìm kiếm...",
    "common.profile": "Hồ sơ & tùy chọn",
    "common.signOut": "Đăng xuất",
    "common.settings": "Cài đặt",
    "common.language": "Ngôn ngữ",

    "layout.chat": "Chat",
    "layout.team": "Nhóm",
    "layout.chatbots": "Chatbots",
    "layout.plugins": "Plugins",
    "layout.knowledge": "Knowledge",
    "layout.billing": "Giao dịch",
    "layout.pricing": "Bảng giá",
    "layout.settings": "Cài đặt",
    "layout.noWorkspace": "Chưa có workspace",
    "layout.createWorkspace": "Tạo workspace",
    "layout.balance": "Số dư",
    "layout.loadingBalance": "Đang tải...",
    "layout.noWalletData": "Không có dữ liệu",
    "layout.walletLocked": "Ví đang bị tạm khóa",
    "layout.workspaceSettings": "Cài đặt workspace",

    "auth.tagline": "Quản lý công việc cho đội nhóm với AI",
    "auth.login.title": "Chào mừng trở lại",
    "auth.login.description": "Đăng nhập vào tài khoản WorkMind của bạn",
    "auth.login.email": "Email",
    "auth.login.password": "Mật khẩu",
    "auth.login.submit": "Đăng nhập",
    "auth.login.submitting": "Đang đăng nhập...",
    "auth.login.noAccount": "Chưa có tài khoản?",
    "auth.login.signUp": "Đăng ký",
    "auth.login.invalidCredentials": "Sai tài khoản hoặc mật khẩu",
    "auth.signup.title": "Bắt đầu",
    "auth.signup.description": "Tạo tài khoản WorkMind",
    "auth.signup.fullName": "Họ và tên",
    "auth.signup.confirmPassword": "Xác nhận mật khẩu",
    "auth.signup.submit": "Tạo tài khoản",
    "auth.signup.submitting": "Đang tạo tài khoản...",
    "auth.signup.hasAccount": "Đã có tài khoản?",
    "auth.signup.signIn": "Đăng nhập",
    "auth.signup.passwordMismatch": "Mật khẩu không khớp",
    "auth.signup.passwordMin": "Mật khẩu phải có ít nhất 8 ký tự",

    "workspace.title": "Chọn Workspace",
    "workspace.description":
      "Chọn workspace để bắt đầu hoặc tạo workspace mới",
    "workspace.current": "Workspace hiện tại",
    "workspace.createNew": "Tạo workspace mới",
    "workspace.namePlaceholder": "Tên workspace",
    "workspace.create": "Tạo workspace",
    "workspace.creating": "Đang tạo...",
    "workspace.cancel": "Hủy",
    "workspace.personal": "Cá nhân",
    "workspace.team": "Workspace nhóm",
    "workspace.errorCreate": "Không thể tạo workspace",
  },
  en: {
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.create": "Create",
    "common.search": "Search...",
    "common.profile": "Profile & Preferences",
    "common.signOut": "Sign out",
    "common.settings": "Settings",
    "common.language": "Language",

    "layout.chat": "Chat",
    "layout.team": "Team",
    "layout.chatbots": "Chatbots",
    "layout.plugins": "Plugins",
    "layout.knowledge": "Knowledge",
    "layout.billing": "Transactions",
    "layout.pricing": "Pricing",
    "layout.settings": "Settings",
    "layout.noWorkspace": "No workspace",
    "layout.createWorkspace": "Create workspace",
    "layout.balance": "Balance",
    "layout.loadingBalance": "Loading...",
    "layout.noWalletData": "No data",
    "layout.walletLocked": "Wallet is temporarily locked",
    "layout.workspaceSettings": "Workspace Settings",

    "auth.tagline": "AI-powered task management for teams",
    "auth.login.title": "Welcome back",
    "auth.login.description": "Sign in to your WorkMind account",
    "auth.login.email": "Email",
    "auth.login.password": "Password",
    "auth.login.submit": "Sign in",
    "auth.login.submitting": "Signing in...",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.signUp": "Sign up",
    "auth.login.invalidCredentials": "Incorrect email or password",
    "auth.signup.title": "Get started",
    "auth.signup.description": "Create your WorkMind account",
    "auth.signup.fullName": "Full name",
    "auth.signup.confirmPassword": "Confirm password",
    "auth.signup.submit": "Create account",
    "auth.signup.submitting": "Creating account...",
    "auth.signup.hasAccount": "Already have an account?",
    "auth.signup.signIn": "Sign in",
    "auth.signup.passwordMismatch": "Passwords do not match",
    "auth.signup.passwordMin": "Password must be at least 8 characters long",

    "workspace.title": "Select Workspace",
    "workspace.description":
      "Choose a workspace to get started or create a new one",
    "workspace.current": "Current workspace",
    "workspace.createNew": "Create new workspace",
    "workspace.namePlaceholder": "Workspace name",
    "workspace.create": "Create workspace",
    "workspace.creating": "Creating...",
    "workspace.cancel": "Cancel",
    "workspace.personal": "Personal",
    "workspace.team": "Team workspace",
    "workspace.errorCreate": "Failed to create workspace",
  },
};

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const STORAGE_KEY = "ui-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY) as Locale | null)
        : null;

    if (saved === "vi" || saved === "en") {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string, fallback?: string) =>
        dictionaries[locale][key] ?? fallback ?? key,
    }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
