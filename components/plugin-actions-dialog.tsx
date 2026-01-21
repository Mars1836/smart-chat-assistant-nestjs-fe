"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Zap } from "lucide-react";
import { type Plugin, type PluginAction } from "@/lib/api";

interface PluginActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plugin: Plugin;
}

export function PluginActionsDialog({
  open,
  onOpenChange,
  plugin,
}: PluginActionsDialogProps) {
  const actions = plugin.actions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {plugin.display_name} - Actions
          </DialogTitle>
          <DialogDescription>
            Danh sách các actions có sẵn trong plugin này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Plugin này không có action nào.
            </div>
          ) : (
            actions.map((action, index) => (
              <div
                key={action.name || index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {action.display_name || action.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {action.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action.description || "No description"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
