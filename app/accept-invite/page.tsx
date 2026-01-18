"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { workspaceInvitationsApi } from "@/lib/api/workspace-invitations/workspace-invitations-api";
import { useAuth } from "@/lib/stores/auth-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type PageStatus = "loading" | "processing" | "success" | "error";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  
  const hasProcessed = useRef(false);
  
  const token = searchParams.get("token");

  // Check authentication and redirect if needed
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      // Build redirect URL with token
      const currentUrl = `/accept-invite?token=${token}`;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
      router.replace(loginUrl);
      return;
    }

    // User is authenticated, proceed with token validation
    if (!token) {
      setStatus("error");
      setError("Token không hợp lệ. Vui lòng kiểm tra lại link trong email.");
      return;
    }

    setStatus("processing");
  }, [isAuthenticated, isAuthLoading, token, router]);

  // Auto-accept invitation when authenticated and has valid token
  useEffect(() => {
    if (status !== "processing" || hasProcessed.current) return;

    const acceptInvitation = async () => {
      if (!token) return;
      
      hasProcessed.current = true;

      try {
        const response = await workspaceInvitationsApi.accept({ token });
        
        setWorkspaceName(response.workspace.name);
        setWorkspaceId(response.workspace.id);
        setStatus("success");
        toast.success(`Chao mung ban den voi ${response.workspace.name}!`);
        
        // Redirect to workspace after a short delay
        setTimeout(() => {
          router.push(`/workspace/${response.workspace.id}`);
        }, 1500);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message;
        
        if (err?.response?.status === 400) {
          setError("Email cua ban khong khop voi loi moi nay.");
        } else if (err?.response?.status === 404) {
          setError("Loi moi khong ton tai hoac da bi xoa.");
        } else if (err?.response?.status === 409) {
          setError("Ban da chap nhan loi moi nay roi hoac da la thanh vien cua workspace.");
        } else if (err?.response?.status === 410) {
          setError("Loi moi da het han. Vui long yeu cau gui lai loi moi moi.");
        } else {
          setError(errorMessage || "Co loi xay ra khi chap nhan loi moi.");
        }
        
        setStatus("error");
        console.error("Error accepting invitation:", err);
      }
    };

    acceptInvitation();
  }, [status, token, router]);

  // Loading state - checking authentication
  if (isAuthLoading || status === "loading") {
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
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Dang kiem tra...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">
              {status === "success" && "Thanh cong!"}
              {status === "processing" && "Dang xu ly..."}
              {status === "error" && "Khong the chap nhan loi moi"}
            </CardTitle>
            <CardDescription>
              {status === "success" && `Ban da tham gia workspace "${workspaceName}"`}
              {status === "processing" && "Dang xu ly loi moi cua ban..."}
              {status === "error" && "Da xay ra loi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "processing" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Dang xu ly...</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="text-center text-green-600 text-sm p-3 bg-green-50 rounded-md">
                  Dang chuyen huong den workspace...
                </div>
                <Button
                  onClick={() => router.push(`/workspace/${workspaceId}`)}
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                >
                  Di den Workspace ngay
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
                <Button
                  onClick={() => router.push("/")}
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                >
                  Ve trang chu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
