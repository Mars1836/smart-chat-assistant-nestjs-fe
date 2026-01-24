
import { useEffect, useState } from "react";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { knowledgeApi, ChatbotKnowledge, KnowledgeBase } from "@/lib/api/knowledge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ChatbotKnowledgeSettingsProps {
  chatbotId: string;
}

export function ChatbotKnowledgeSettings({ chatbotId }: ChatbotKnowledgeSettingsProps) {
  const { selectedWorkspace } = useWorkspace();
  const [allKnowledge, setAllKnowledge] = useState<KnowledgeBase[]>([]);
  const [chatbotKnowledge, setChatbotKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedWorkspace && chatbotId) {
      loadData();
    }
  }, [selectedWorkspace, chatbotId]);

  const loadData = async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      const [all, assigned] = await Promise.all([
        knowledgeApi.list(selectedWorkspace.id),
        knowledgeApi.getChatbotKnowledge(selectedWorkspace.id, chatbotId)
      ]);
      setAllKnowledge(all);
      setChatbotKnowledge(assigned);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load knowledge settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (knowledgeId: string, enabled: boolean) => {
    setChatbotKnowledge(prev => {
      const exists = prev.find(k => k.knowledge.id === knowledgeId);
      if (exists) {
        return prev.map(k => k.knowledge.id === knowledgeId ? { ...k, is_enabled: enabled } : k);
      }
      // If not exists, find from allKnowledge to add it
      const kb = allKnowledge.find(k => k.id === knowledgeId);
      if (!kb) return prev;
      return [...prev, {
        knowledge: {
            id: kb.id,
            name: kb.name,
            icon: kb.icon,
            document_count: kb.document_count,
            total_chunks: kb.total_chunks
        },
        is_enabled: enabled,
        priority: prev.length + 1
      }];
    });
  };

  const handlePriorityChange = (knowledgeId: string, priority: number) => {
    setChatbotKnowledge(prev => 
      prev.map(k => k.knowledge.id === knowledgeId ? { ...k, priority } : k)
    );
  };

  const handleSave = async () => {
    if (!selectedWorkspace) return;
    try {
      setSaving(true);
      // In a real app we might batch update
      // for now iterate and update
      for (const item of chatbotKnowledge) {
        await knowledgeApi.updateChatbotKnowledge(
            selectedWorkspace.id, 
            chatbotId, 
            item.knowledge.id, 
            { is_enabled: item.is_enabled, priority: item.priority }
        );
      }
      toast.success("Knowledge settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Knowledge Bases</h3>
          <p className="text-sm text-muted-foreground">Select which knowledge bases this chatbot can access</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        {allKnowledge.map(kb => {
          const assigned = chatbotKnowledge.find(k => k.knowledge.id === kb.id);
          const isEnabled = assigned?.is_enabled ?? false;
          const priority = assigned?.priority ?? 0;

          return (
            <Card key={kb.id} className={isEnabled ? "border-primary/50" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <Switch 
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(kb.id, checked)}
                   />
                </div>
                
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-xl">
                  {kb.icon}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">{kb.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {kb.document_count} docs • {kb.total_chunks} chunks
                  </div>
                </div>

                {isEnabled && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Priority:</span>
                        <Input 
                            type="number" 
                            className="w-20 h-8" 
                            value={priority}
                            onChange={(e) => handlePriorityChange(kb.id, parseInt(e.target.value) || 0)}
                        />
                    </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
