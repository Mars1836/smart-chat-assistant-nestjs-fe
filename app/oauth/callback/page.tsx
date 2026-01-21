"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (error) {
      toast.error("Kết nối thất bại", {
        description: decodeURIComponent(error),
      });
      
      // Countdown to redirect
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/plugins");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // If no error, redirect immediately (unexpected state)
      router.push("/plugins");
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [error, router]);

  const handleReturn = () => {
    router.push("/plugins");
  };

  if (!error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Kết nối thất bại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            {decodeURIComponent(error)}
          </p>
          
          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
            Tự động quay lại sau {countdown}s...
          </div>

          <Button onClick={handleReturn} className="w-full">
            Quay lại trang Plugins
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
