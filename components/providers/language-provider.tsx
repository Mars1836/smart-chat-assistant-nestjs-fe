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
    "auth.signup.failed": "Đăng ký thất bại. Vui lòng thử lại.",

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

    "landing.signIn": "Đăng nhập",
    "landing.getStarted": "Bắt đầu",
    "landing.heroTitle": "Quản lý công việc bằng AI",
    "landing.heroHighlight": "cho đội nhóm hiện đại",
    "landing.heroDescription":
      "Tối ưu quy trình làm việc với tự động hóa thông minh, cộng tác liền mạch và trợ lý AI mạnh mẽ.",
    "landing.getStartedFree": "Bắt đầu miễn phí",
    "landing.featuresTitle": "Mọi thứ bạn cần để làm việc hiệu quả",
    "landing.feature.chat.title": "Trợ lý chat AI",
    "landing.feature.chat.description":
      "Nhận hỗ trợ tức thì cho công việc của bạn với công nghệ AI tiên tiến",
    "landing.feature.calendar.title": "Lịch thông minh",
    "landing.feature.calendar.description":
      "Quản lý lịch trình và không bỏ lỡ các hạn chót quan trọng",
    "landing.feature.docs.title": "Quản lý tài liệu",
    "landing.feature.docs.description":
      "Lưu trữ, sắp xếp và truy cập toàn bộ tài liệu ở một nơi",
    "landing.feature.team.title": "Cộng tác nhóm",
    "landing.feature.team.description":
      "Làm việc cùng đồng đội một cách liền mạch và hiệu quả",
    "landing.ctaTitle": "Sẵn sàng tăng năng suất làm việc?",
    "landing.ctaDescription":
      "Tham gia cùng hàng nghìn đội nhóm đang dùng WorkMind để giữ công việc ngăn nắp và hiệu quả.",
    "landing.ctaButton": "Bắt đầu miễn phí hôm nay",
    "landing.footer": "© 2025 WorkMind. Đã đăng ký bản quyền.",

    "pricing.title": "Bảng giá token",
    "pricing.description":
      "Giá tham khảo theo model (mỗi 1K token). Input / Output.",
    "pricing.empty": "Chưa có dữ liệu bảng giá.",
    "pricing.modelsByProvider": "Các model thuộc {provider}",
    "pricing.inputPrice": "Giá input (/1K token)",
    "pricing.outputPrice": "Giá output (/1K token)",

    "billing.title": "Lịch sử giao dịch & Token",
    "billing.description":
      "Giao dịch ví workspace và lịch sử sử dụng token (chỉ Owner & Admin).",
    "billing.ownerOnly": "Chỉ Owner và Admin workspace mới xem được trang này.",
    "billing.forbidden":
      "Bạn không có quyền xem lịch sử giao dịch (403). Chỉ Owner và Admin workspace mới được cấp quyền.",
    "billing.transactions": "Giao dịch",
    "billing.transactionTypes": "Nạp tiền, dùng token, hoàn tiền, điều chỉnh",
    "billing.typePlaceholder": "Loại giao dịch",
    "billing.all": "Tất cả",
    "billing.type.topup": "Nạp tiền",
    "billing.type.usage": "Dùng token",
    "billing.type.refund": "Hoàn tiền",
    "billing.type.adjustment": "Điều chỉnh",
    "billing.time": "Thời gian",
    "billing.member": "Thành viên",
    "billing.type": "Loại",
    "billing.credit": "Credit",
    "billing.descriptionCol": "Mô tả",
    "billing.inputTokens": "Input tokens",
    "billing.outputTokens": "Output tokens",
    "billing.noTransactions": "Chưa có giao dịch nào",
    "billing.guest": "Khách",
    "billing.pageInfo": "Trang {page} / {totalPages} (tổng {total} giao dịch)",
    "billing.previous": "Trước",
    "billing.next": "Sau",
    "billing.loadError": "Không tải được lịch sử giao dịch",

    "settings.noWorkspace": "Không có workspace nào được chọn.",
    "settings.title": "Cài đặt workspace",
    "settings.description": "Quản lý cấu hình workspace của bạn",
    "settings.general": "Chung",
    "settings.generalDescription": "Cập nhật thông tin workspace",
    "settings.workspaceName": "Tên workspace",
    "settings.workspaceNameRequired": "Tên workspace là bắt buộc",
    "settings.workspaceUpdated": "Đã cập nhật workspace",
    "settings.workspaceUpdateFailed": "Không thể cập nhật workspace",
    "settings.descriptionLabel": "Mô tả",
    "settings.saveChanges": "Lưu thay đổi",
    "settings.billingCredits": "Thanh toán & Credits",
    "settings.billingDescription": "Nạp credit cho workspace này qua VietQR",
    "settings.currentBalance": "Số dư hiện tại",
    "settings.noWalletData": "Không có dữ liệu ví",
    "settings.walletStatus": "Trạng thái ví",
    "settings.viewTransactions": "Xem lịch sử giao dịch & token",
    "settings.topupAmount": "Chọn số tiền nạp (VND)",
    "settings.customAmount": "Hoặc nhập số tiền khác",
    "settings.customAmountPlaceholder": "Ví dụ: 150000",
    "settings.vndHint": "Đơn vị VND. Khuyến nghị >= 50.000đ.",
    "settings.createQr": "Tạo QR nạp tiền",
    "settings.createQrSuccess": "Đã tạo QR nạp tiền",
    "settings.createQrFailed": "Không tạo được QR nạp tiền",
    "settings.invalidAmount": "Vui lòng nhập số tiền hợp lệ (VND)",
    "settings.topupSuccessDescription": "Số dư mới: {balance} CREDITS",
    "settings.paymentReceived": "Đã nhận thanh toán, số dư đã được cập nhật.",
    "settings.qrAlt": "QR nạp tiền",
    "settings.amount": "Số tiền",
    "settings.bank": "Ngân hàng",
    "settings.transferReference": "Nội dung chuyển khoản / mã tham chiếu",
    "settings.transferHint":
      "Vui lòng giữ nguyên mã tham chiếu {reference} để hệ thống có thể đối soát giao dịch chính xác.",
    "settings.dangerZone": "Vùng nguy hiểm",
    "settings.dangerZoneDescription":
      "Các thao tác không thể hoàn tác cho workspace này",
    "settings.deleteWorkspace": "Xóa workspace",
    "settings.deleteWorkspaceDescription":
      "Xóa vĩnh viễn workspace này và toàn bộ dữ liệu liên quan.",
    "settings.deleteSuccess": "Đã xóa workspace",
    "settings.deleteFailed": "Không thể xóa workspace",
    "settings.deleteConfirmTitle": "Bạn có chắc chắn không?",
    "settings.deleteConfirmDescription":
      "Hành động này không thể hoàn tác. Workspace {name} và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn.",
    "settings.typeDeleteConfirm": "Gõ delete để xác nhận:",
    "settings.cancel": "Hủy",
    "settings.deleting": "Đang xóa...",

    "profile.loadFailed": "Không tải được hồ sơ",
    "profile.saveSuccess": "Đã lưu thay đổi",
    "profile.emailUsed": "Email đã được người dùng khác sử dụng",
    "profile.saveFailed": "Không thể lưu thay đổi",
    "profile.title": "Cài đặt người dùng",
    "profile.description": "Quản lý hồ sơ và tùy chọn của bạn",
    "profile.infoTitle": "Thông tin cá nhân",
    "profile.infoDescription": "Cập nhật thông tin cá nhân",
    "profile.changeAvatar": "Đổi ảnh đại diện",
    "profile.fullName": "Họ và tên",
    "profile.edit": "Chỉnh sửa hồ sơ",
    "profile.preferences": "Tùy chọn",
    "profile.preferencesDescription": "Tùy chỉnh trải nghiệm của bạn",
    "profile.theme": "Giao diện",
    "profile.theme.light": "Sáng",
    "profile.theme.dark": "Tối",
    "profile.notifications": "Thông báo",
    "profile.security": "Bảo mật",
    "profile.changePassword": "Đổi mật khẩu",

    "knowledge.loadFailed": "Không thể tải knowledge base",
    "knowledge.createSuccess": "Tạo knowledge base thành công",
    "knowledge.createFailed": "Không thể tạo knowledge base",
    "knowledge.deleteConfirm":
      "Bạn có chắc muốn xóa knowledge base này không? Tất cả tài liệu sẽ bị xóa.",
    "knowledge.deleteSuccess": "Đã xóa knowledge base thành công",
    "knowledge.deleteFailed": "Không thể xóa knowledge base",
    "knowledge.title": "Knowledge Bases",
    "knowledge.description":
      "Quản lý tài liệu và nguồn tri thức ngoài của bạn",
    "knowledge.new": "Knowledge Base mới",
    "knowledge.search": "Tìm kiếm knowledge base...",
    "knowledge.emptyTitle": "Không tìm thấy knowledge base nào",
    "knowledge.emptyDescription": "Tạo knowledge base đầu tiên để bắt đầu",
    "knowledge.create": "Tạo Knowledge Base",

    "plugins.description": "Quản lý các plugin cho workspace của bạn",
    "plugins.import": "Import Plugin",
    "plugins.createTool": "Tạo Tool",
    "plugins.search": "Tìm kiếm plugin...",
    "plugins.category": "Danh mục",
    "plugins.allTypes": "Tất cả loại",
    "plugins.builtin": "Có sẵn",
    "plugins.custom": "Tùy chỉnh",
    "plugins.community": "Cộng đồng",
    "plugins.sort": "Sắp xếp",
    "plugins.sortBy": "Sắp xếp theo",
    "plugins.sort.name": "Tên",
    "plugins.sort.category": "Danh mục",
    "plugins.sort.createdAt": "Ngày tạo",
    "plugins.order": "Thứ tự",
    "plugins.order.asc": "Tăng dần",
    "plugins.order.desc": "Giảm dần",
    "plugins.workspaceTab": "Workspace",
    "plugins.allTab": "Tất cả plugin",
    "plugins.emptyAll": "Không tìm thấy plugin nào.",
    "plugins.emptyWorkspace": "Chưa có plugin nào trong workspace.",
    "plugins.emptyWorkspaceHint":
      "Chuyển sang tab \"Tất cả plugin\" để thêm plugin.",
    "plugins.userAuth": "Xác thực người dùng",
    "plugins.adminConfig": "Cấu hình admin",
    "plugins.added": "Đã thêm",
    "plugins.add": "Thêm",
    "plugins.connectedAs": "Đã kết nối với {email}",
    "plugins.disconnect": "Ngắt kết nối",
    "plugins.notConnected": "Chưa kết nối",
    "plugins.connectAccount": "Kết nối tài khoản",
    "plugins.apiKeyConfigured": "Đã cấu hình API Key",
    "plugins.editKey": "Sửa Key",
    "plugins.apiKeyMissing": "Chưa cấu hình API Key",
    "plugins.setApiKey": "Thiết lập API Key",
    "plugins.viewActions": "Xem actions",
    "plugins.manageActions": "Quản lý actions",
    "plugins.removeFromWorkspace": "Gỡ khỏi workspace",
    "plugins.deletePermanently": "Xóa vĩnh viễn",
    "plugins.connectedSuccess": "Kết nối thành công",
    "plugins.loadFailed": "Không thể tải danh sách plugin",
    "plugins.addSuccess": "Đã thêm {name} vào workspace",
    "plugins.addFailed": "Không thể thêm plugin",
    "plugins.enableSuccess": "Đã bật {name}",
    "plugins.disableSuccess": "Đã tắt {name}",
    "plugins.updateFailed": "Không thể cập nhật plugin",
    "plugins.removeSuccess": "Đã xóa {name} khỏi workspace",
    "plugins.removeFailed": "Không thể xóa plugin",
    "plugins.deleteConfirm":
      "Bạn có chắc muốn xoá vĩnh viễn plugin \"{name}\"?\n\nHành động này không thể hoàn tác.",
    "plugins.deleteSuccess": "Đã xoá vĩnh viễn plugin {name}",
    "plugins.deleteForbidden": "Bạn không có quyền xoá plugin này",
    "plugins.deleteInUse": "Plugin đang được sử dụng ở workspace khác",
    "plugins.deleteFailed": "Không thể xoá plugin",

    "team.title": "Nhóm",
    "team.inviteMember": "Mời thành viên",
    "team.activeMembers": "Thành viên đang hoạt động ({count})",
    "team.noMembers": "Không có thành viên nào.",
    "team.active": "Đang hoạt động",
    "team.changeRole": "Đổi vai trò",
    "team.managePermissions": "Quản lý quyền",
    "team.remove": "Gỡ",
    "team.pendingInvitations": "Lời mời đang chờ ({count})",
    "team.invitedBy": "Được mời bởi {name}",
    "team.pending": "Đang chờ",
    "team.resendInvite": "Gửi lại lời mời",
    "team.cancelInvite": "Huỷ lời mời",
    "team.cancelInviteConfirm": "Bạn có chắc muốn huỷ lời mời này không?",
    "team.settings": "Cài đặt nhóm",
    "team.saveChanges": "Lưu thay đổi",
    "team.workspaceName": "Tên workspace",
    "team.workspaceDescription": "Mô tả workspace",
    "team.loadFailed": "Không thể tải dữ liệu nhóm",
    "team.resendSuccess": "Email đã được gửi lại",
    "team.resendFailed": "Không thể gửi lại lời mời",
    "team.cancelSuccess": "Đã huỷ lời mời",
    "team.cancelFailed": "Không thể huỷ lời mời",
    "team.removeNotImplemented": "Chức năng gỡ thành viên chưa được triển khai",
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
    "auth.signup.failed": "Registration failed. Please try again.",

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

    "landing.signIn": "Sign in",
    "landing.getStarted": "Get started",
    "landing.heroTitle": "AI-Powered Task Management",
    "landing.heroHighlight": "for Modern Teams",
    "landing.heroDescription":
      "Streamline your workflow with intelligent automation, seamless collaboration, and powerful AI assistance.",
    "landing.getStartedFree": "Get started free",
    "landing.featuresTitle": "Everything you need to stay productive",
    "landing.feature.chat.title": "AI Chat Assistant",
    "landing.feature.chat.description":
      "Get instant help with your tasks using advanced AI technology",
    "landing.feature.calendar.title": "Smart Calendar",
    "landing.feature.calendar.description":
      "Manage your schedule and never miss an important deadline",
    "landing.feature.docs.title": "Document Management",
    "landing.feature.docs.description":
      "Store, organize, and access all your files in one place",
    "landing.feature.team.title": "Team Collaboration",
    "landing.feature.team.description":
      "Work together seamlessly with your team members",
    "landing.ctaTitle": "Ready to boost your productivity?",
    "landing.ctaDescription":
      "Join thousands of teams already using WorkMind to stay organized and efficient.",
    "landing.ctaButton": "Start for free today",
    "landing.footer": "© 2025 WorkMind. All rights reserved.",

    "pricing.title": "Token Pricing",
    "pricing.description":
      "Reference pricing by model (per 1K tokens). Input / Output.",
    "pricing.empty": "No pricing data available.",
    "pricing.modelsByProvider": "Models from {provider}",
    "pricing.inputPrice": "Input price (/1K token)",
    "pricing.outputPrice": "Output price (/1K token)",

    "billing.title": "Transaction & Token History",
    "billing.description":
      "Workspace wallet transactions and token usage history (Owner & Admin only).",
    "billing.ownerOnly": "Only workspace Owners and Admins can view this page.",
    "billing.forbidden":
      "You do not have permission to view transaction history (403). Only workspace Owners and Admins are allowed.",
    "billing.transactions": "Transactions",
    "billing.transactionTypes": "Top-up, token usage, refund, adjustment",
    "billing.typePlaceholder": "Transaction type",
    "billing.all": "All",
    "billing.type.topup": "Top-up",
    "billing.type.usage": "Token usage",
    "billing.type.refund": "Refund",
    "billing.type.adjustment": "Adjustment",
    "billing.time": "Time",
    "billing.member": "Member",
    "billing.type": "Type",
    "billing.credit": "Credit",
    "billing.descriptionCol": "Description",
    "billing.inputTokens": "Input tokens",
    "billing.outputTokens": "Output tokens",
    "billing.noTransactions": "No transactions found",
    "billing.guest": "Guest",
    "billing.pageInfo":
      "Page {page} / {totalPages} (total {total} transactions)",
    "billing.previous": "Previous",
    "billing.next": "Next",
    "billing.loadError": "Failed to load transaction history",

    "settings.noWorkspace": "No workspace selected.",
    "settings.title": "Workspace Settings",
    "settings.description": "Manage your workspace configuration",
    "settings.general": "General",
    "settings.generalDescription": "Update your workspace details",
    "settings.workspaceName": "Workspace Name",
    "settings.workspaceNameRequired": "Workspace name is required",
    "settings.workspaceUpdated": "Workspace updated successfully",
    "settings.workspaceUpdateFailed": "Failed to update workspace",
    "settings.descriptionLabel": "Description",
    "settings.saveChanges": "Save Changes",
    "settings.billingCredits": "Billing & Credits",
    "settings.billingDescription": "Top up credits for this workspace via VietQR",
    "settings.currentBalance": "Current balance",
    "settings.noWalletData": "No wallet data",
    "settings.walletStatus": "Wallet status",
    "settings.viewTransactions": "View transaction & token history",
    "settings.topupAmount": "Select top-up amount (VND)",
    "settings.customAmount": "Or enter a different amount",
    "settings.customAmountPlaceholder": "Example: 150000",
    "settings.vndHint": "Unit is VND. Recommended >= 50,000đ.",
    "settings.createQr": "Create top-up QR",
    "settings.createQrSuccess": "Top-up QR created",
    "settings.createQrFailed": "Failed to create top-up QR",
    "settings.invalidAmount": "Please enter a valid amount (VND)",
    "settings.topupSuccessDescription": "New balance: {balance} CREDITS",
    "settings.paymentReceived": "Payment received, balance has been updated.",
    "settings.qrAlt": "Top-up QR",
    "settings.amount": "Amount",
    "settings.bank": "Bank",
    "settings.transferReference": "Transfer note / reference",
    "settings.transferHint":
      "Please keep the reference {reference} unchanged so the system can reconcile the payment correctly.",
    "settings.dangerZone": "Danger Zone",
    "settings.dangerZoneDescription": "Irreversible actions for this workspace",
    "settings.deleteWorkspace": "Delete Workspace",
    "settings.deleteWorkspaceDescription":
      "Permanently remove this workspace and all its data.",
    "settings.deleteSuccess": "Workspace deleted successfully",
    "settings.deleteFailed": "Failed to delete workspace",
    "settings.deleteConfirmTitle": "Are you absolutely sure?",
    "settings.deleteConfirmDescription":
      "This action cannot be undone. Workspace {name} and all associated data will be permanently deleted.",
    "settings.typeDeleteConfirm": "Type delete to confirm:",
    "settings.cancel": "Cancel",
    "settings.deleting": "Deleting...",

    "profile.loadFailed": "Failed to load profile",
    "profile.saveSuccess": "Changes saved",
    "profile.emailUsed": "Email is already used by another user",
    "profile.saveFailed": "Failed to save changes",
    "profile.title": "User Settings",
    "profile.description": "Manage your profile and preferences",
    "profile.infoTitle": "Profile Information",
    "profile.infoDescription": "Update your personal details",
    "profile.changeAvatar": "Change Avatar",
    "profile.fullName": "Full Name",
    "profile.edit": "Edit Profile",
    "profile.preferences": "Preferences",
    "profile.preferencesDescription": "Customize your experience",
    "profile.theme": "Theme",
    "profile.theme.light": "Light",
    "profile.theme.dark": "Dark",
    "profile.notifications": "Notifications",
    "profile.security": "Security",
    "profile.changePassword": "Change Password",

    "knowledge.loadFailed": "Failed to load knowledge bases",
    "knowledge.createSuccess": "Knowledge base created successfully",
    "knowledge.createFailed": "Failed to create knowledge base",
    "knowledge.deleteConfirm":
      "Are you sure you want to delete this knowledge base? All documents will be deleted.",
    "knowledge.deleteSuccess": "Knowledge base deleted successfully",
    "knowledge.deleteFailed": "Failed to delete knowledge base",
    "knowledge.title": "Knowledge Bases",
    "knowledge.description":
      "Manage your documentation and external knowledge sources",
    "knowledge.new": "New Knowledge Base",
    "knowledge.search": "Search knowledge bases...",
    "knowledge.emptyTitle": "No knowledge bases found",
    "knowledge.emptyDescription":
      "Create your first knowledge base to get started",
    "knowledge.create": "Create Knowledge Base",

    "plugins.description": "Manage plugins for your workspace",
    "plugins.import": "Import Plugin",
    "plugins.createTool": "Create Tool",
    "plugins.search": "Search plugins...",
    "plugins.category": "Category",
    "plugins.allTypes": "All Types",
    "plugins.builtin": "Built-in",
    "plugins.custom": "Custom",
    "plugins.community": "Community",
    "plugins.sort": "Sort",
    "plugins.sortBy": "Sort By",
    "plugins.sort.name": "Name",
    "plugins.sort.category": "Category",
    "plugins.sort.createdAt": "Created Date",
    "plugins.order": "Order",
    "plugins.order.asc": "Ascending",
    "plugins.order.desc": "Descending",
    "plugins.workspaceTab": "Workspace",
    "plugins.allTab": "All Plugins",
    "plugins.emptyAll": "No plugins found.",
    "plugins.emptyWorkspace": "No plugins in this workspace yet.",
    "plugins.emptyWorkspaceHint":
      "Switch to the \"All Plugins\" tab to add plugins.",
    "plugins.userAuth": "User Auth",
    "plugins.adminConfig": "Admin Config",
    "plugins.added": "Added",
    "plugins.add": "Add",
    "plugins.connectedAs": "Connected as {email}",
    "plugins.disconnect": "Disconnect",
    "plugins.notConnected": "Not connected",
    "plugins.connectAccount": "Connect Account",
    "plugins.apiKeyConfigured": "API Key configured",
    "plugins.editKey": "Edit Key",
    "plugins.apiKeyMissing": "API Key not configured",
    "plugins.setApiKey": "Set API Key",
    "plugins.viewActions": "View Actions",
    "plugins.manageActions": "Manage Actions",
    "plugins.removeFromWorkspace": "Remove from Workspace",
    "plugins.deletePermanently": "Delete Permanently",
    "plugins.connectedSuccess": "Connected successfully",
    "plugins.loadFailed": "Failed to load plugins",
    "plugins.addSuccess": "Added {name} to workspace",
    "plugins.addFailed": "Failed to add plugin",
    "plugins.enableSuccess": "Enabled {name}",
    "plugins.disableSuccess": "Disabled {name}",
    "plugins.updateFailed": "Failed to update plugin",
    "plugins.removeSuccess": "Removed {name} from workspace",
    "plugins.removeFailed": "Failed to remove plugin",
    "plugins.deleteConfirm":
      "Are you sure you want to permanently delete plugin \"{name}\"?\n\nThis action cannot be undone.",
    "plugins.deleteSuccess": "Permanently deleted plugin {name}",
    "plugins.deleteForbidden":
      "You do not have permission to delete this plugin",
    "plugins.deleteInUse": "Plugin is currently used in another workspace",
    "plugins.deleteFailed": "Failed to delete plugin",

    "team.title": "Team",
    "team.inviteMember": "Invite member",
    "team.activeMembers": "Active Members ({count})",
    "team.noMembers": "No active members found.",
    "team.active": "Active",
    "team.changeRole": "Change role",
    "team.managePermissions": "Manage permissions",
    "team.remove": "Remove",
    "team.pendingInvitations": "Pending Invitations ({count})",
    "team.invitedBy": "Invited by {name}",
    "team.pending": "Pending",
    "team.resendInvite": "Resend invite",
    "team.cancelInvite": "Cancel invite",
    "team.cancelInviteConfirm":
      "Are you sure you want to cancel this invitation?",
    "team.settings": "Team settings",
    "team.saveChanges": "Save changes",
    "team.workspaceName": "Workspace name",
    "team.workspaceDescription": "Workspace description",
    "team.loadFailed": "Failed to load team data",
    "team.resendSuccess": "Invitation email resent",
    "team.resendFailed": "Failed to resend invitation",
    "team.cancelSuccess": "Invitation canceled",
    "team.cancelFailed": "Failed to cancel invitation",
    "team.removeNotImplemented": "Removing members is not implemented yet",
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

export function translateTemplate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}
