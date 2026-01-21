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
import { Input } from "@/components/ui/input";
import { Loader2, Key, CheckCircle2 } from "lucide-react";
import { workspaceToolsApi, type Plugin } from "@/lib/api";

interface ApiKeyConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  plugin: Plugin;
  onConfigured: () => void;
}

export function ApiKeyConfigDialog({
  open,
  onOpenChange,
  workspaceId,
  plugin,
  onConfigured,
}: ApiKeyConfigDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey("");
      setIsConfigured(plugin.workspace_tool?.api_key_configured || false);
    }
  }, [open, plugin]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    try {
      setLoading(true);
      
      const configKey = plugin.auth_config?.api_key?.param_name || "api_key";
      
      await workspaceToolsApi.update(workspaceId, plugin.id, {
        config_override: {
          [configKey]: apiKey,
        },
      });

      toast.success("API Key saved successfully");
      onConfigured();
    } catch (err: any) {
      console.error("Error saving API key:", err);
      toast.error("Failed to save API key", {
        description: err?.response?.data?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configure {plugin.display_name}
          </DialogTitle>
          <DialogDescription>
            Enter the API key for this service. It will be stored securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>API Key is currently configured</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              API Key ({plugin.auth_config?.api_key?.param_name || "api_key"})
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder={isConfigured ? "****************" : "Enter API Key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {plugin.description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !apiKey.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
