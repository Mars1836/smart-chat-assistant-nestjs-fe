
"use client";

import { useEffect, useState, Suspense } from "react";
import { AppLayout } from "@/components/app-layout";
import { KnowledgeCard } from "@/components/knowledge/knowledge-card";
import { CreateKnowledgeDialog } from "@/components/knowledge/create-knowledge-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { knowledgeApi, KnowledgeBase, CreateKnowledgeDto } from "@/lib/api/knowledge";
import { Plus, Search, Loader2, Book } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function KnowledgeContent() {
  const { selectedWorkspace } = useWorkspace();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedWorkspace) {
      loadKnowledgeBases();
    }
  }, [selectedWorkspace]);

  const loadKnowledgeBases = async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      const data = await knowledgeApi.list(selectedWorkspace.id);
      setKnowledgeBases(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load knowledge bases");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateKnowledgeDto) => {
    if (!selectedWorkspace) return;
    try {
      await knowledgeApi.create(selectedWorkspace.id, data);
      toast.success("Knowledge base created successfully");
      loadKnowledgeBases();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create knowledge base");
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedWorkspace) return;
    if (!confirm("Are you sure you want to delete this knowledge base? All documents will be deleted.")) return;
    
    try {
      await knowledgeApi.delete(selectedWorkspace.id, id);
      toast.success("Knowledge base deleted successfully");
      loadKnowledgeBases();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete knowledge base");
    }
  };

  const filteredKnowledge = knowledgeBases.filter(kb => 
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout activeModule="knowledge">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="knowledge">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Knowledge Bases</h1>
            <p className="text-muted-foreground mt-1">Manage your documentation and external knowledge sources</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Knowledge Base
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {filteredKnowledge.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/10 border-dashed">
            <Book className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No knowledge bases found</h3>
            <p className="text-muted-foreground mb-6">Create your first knowledge base to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKnowledge.map((kb) => (
              <KnowledgeCard
                key={kb.id}
                knowledge={kb}
                onDelete={handleDelete}
                onClick={(k) => router.push(`/knowledge/${k.id}`)}
              />
            ))}
          </div>
        )}

        <CreateKnowledgeDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreate}
        />
      </div>
    </AppLayout>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <KnowledgeContent />
    </Suspense>
  );
}
