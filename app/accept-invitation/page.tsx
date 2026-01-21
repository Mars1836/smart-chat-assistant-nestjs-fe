"use client";

import type React from "react";
import { Suspense, useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token khong hop le. Vui long kiem tra lai link trong email.");
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError("Token khong hop le");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await workspaceInvitationsApi.accept({ token });
      
      setSuccess(true);
      setWorkspaceName(response.workspace.name);
      toast.success(`Chao mung ban den voi ${response.workspace.name}!`);
      
      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push(`/workspace/${response.workspace.id}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      
      if (err?.response?.status === 400) {
        setError("Email cua ban khong khop voi loi moi nay");
      } else if (err?.response?.status === 404) {
        setError("Loi moi khong ton tai");
      } else if (err?.response?.status === 409) {
        setError("Ban da chap nhan loi moi nay roi hoac da la thanh vien cua workspace");
      } else if (err?.response?.status === 410) {
        setError("Loi moi da het han. Vui long yeu cau gui lai loi moi moi.");
      } else {
        setError(errorMessage || "Co loi xay ra khi chap nhan loi moi");
      }
      
      console.error("Error accepting invitation:", err);
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl">
              {success ? "Thanh cong!" : "Loi moi tham gia Workspace"}
            </CardTitle>
            <CardDescription>
              {success
                ? `Ban da tham gia workspace "${workspaceName}"`
                : "Chap nhan loi moi de tham gia workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="text-center text-green-600 text-sm p-3 bg-green-50 rounded-md">
                  Dang chuyen huong den workspace...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {!error && token && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    Nhan nut ben duoi de chap nhan loi moi tham gia workspace
                  </div>
                )}

                <Button
                  onClick={handleAcceptInvitation}
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                  disabled={isLoading || !token || !!error}
                >
                  {isLoading ? "Dang xu ly..." : "Chap nhan loi moi"}
                </Button>

                <div className="mt-6 text-center text-sm">
                  <button
                    onClick={() => router.push("/")}
                    className="text-primary hover:underline font-medium"
                  >
                    Quay ve trang chu
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
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
              <p className="text-muted-foreground">Dang tai...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
