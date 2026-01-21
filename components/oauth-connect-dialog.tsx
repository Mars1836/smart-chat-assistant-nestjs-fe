"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Shield,
} from "lucide-react";
import { workspaceToolsApi, type Plugin } from "@/lib/api";

interface OAuthConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  plugin: Plugin;
  onConnected: () => void;
}

export function OAuthConnectDialog({
  open,
  onOpenChange,
  workspaceId,
  plugin,
  onConnected,
}: OAuthConnectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
      setPolling(false);
    }
  }, [open]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      setPolling(false);
    };
  }, []);

  const handleStartOAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get OAuth URL
      const { url } = await workspaceToolsApi.getOAuthUrl(
        workspaceId,
        plugin.id
      );

      // 2. Open Popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        `oauth_${plugin.id}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        setError("Pop-up was blocked. Please allow pop-ups for this site.");
        setLoading(false);
        return;
      }

      // 3. Start Polling
      setPolling(true);
      const pollInterval = setInterval(async () => {
        if (popup.closed) {
          clearInterval(pollInterval);
          setPolling(false);
          setLoading(false);
          // Check one last time in case user finished flow and closed popup manually
          checkStatus(true); 
          return;
        }

        const success = await checkStatus();
        if (success) {
          clearInterval(pollInterval);
          popup.close();
          setPolling(false);
          setLoading(false);
          onConnected();
          toast.success(`Successfully connected to ${plugin.display_name}`);
        }
      }, 2000);

    } catch (err: any) {
      console.error("Error starting OAuth:", err);
      setError(
        err?.response?.data?.message || "Failed to start authentication flow"
      );
      setLoading(false);
    }
  };

  const checkStatus = async (finalCheck = false) => {
    try {
      const status = await workspaceToolsApi.getOAuthStatus(
        workspaceId,
        plugin.id
      );

      return status.connected;
    } catch (err) {
      console.error("Error checking status:", err);
      return false;
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    try {
      setLoading(true);
      await workspaceToolsApi.disconnectOAuth(workspaceId, plugin.id);
      toast.success("Account disconnected");
      onConnected(); // Reload parent
    } catch (err: any) {
      console.error("Error disconnecting:", err);
      toast.error("Failed to disconnect", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const isConnected = plugin.user_auth_status?.connected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isConnected ? `Manage ${plugin.display_name}` : `Connect ${plugin.display_name}`}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? "You are currently connected to this service."
              : `Connect your ${plugin.display_name} account to enable this plugin's features.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col items-center text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium text-green-900">Connected Successfully</p>
                <p className="text-sm text-green-700">
                  {plugin.user_auth_status?.profile?.email}
                </p>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Connected on {new Date(plugin.user_auth_status?.connected_at || "").toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5" />
                  <p>
                    You will be redirected to <strong>{plugin.display_name}</strong> to authorize access.
                  </p>
                </div>
                {plugin.auth_config?.oauth?.scopes && (
                  <div className="pl-6 text-muted-foreground text-xs">
                    Permissions requested:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {plugin.auth_config.oauth.scopes.map((scope) => (
                        <li key={scope}>{scope}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
          {isConnected ? (
            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Disconnect Account
            </Button>
          ) : (
            <Button 
              onClick={handleStartOAuth} 
              disabled={loading || polling}
              className="bg-primary hover:bg-primary/90"
            >
              {(loading || polling) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {polling ? "Waiting for auth..." : "Connecting..."}
                </>
              ) : (
                <>
                  Connect {plugin.display_name}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
