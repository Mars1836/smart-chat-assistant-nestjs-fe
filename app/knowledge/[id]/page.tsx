
"use client";

import { useEffect, useState, Suspense, use } from "react";
import { AppLayout } from "@/components/app-layout";
import { DocumentList } from "@/components/knowledge/document-list";
import { DocumentUploadDialog } from "@/components/knowledge/document-upload-dialog";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { knowledgeApi, KnowledgeBase, Document } from "@/lib/api/knowledge";
import { ArrowLeft, Loader2, Upload, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// Since this is a client component, we can unscramble params using use() hook if we wanted, 
// but Next.js 13/14 client components receive params directly as prop if defined in page.tsx 
// However, in app router page.tsx props are { params: { id: string } }.
// But this is a client component, so we must be careful. 
// Standard way:
interface PageProps {
  params: Promise<{ id: string }>;
}

function KnowledgeDetailContent({ id }: { id: string }) {
  const { selectedWorkspace } = useWorkspace();
  const [knowledge, setKnowledge] = useState<KnowledgeBase & { documents?: Document[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedWorkspace && id) {
      loadDetails();
    }
  }, [selectedWorkspace, id]);

  const loadDetails = async () => {
    if (!selectedWorkspace) return;
    try {
      setLoading(true);
      const data = await knowledgeApi.get(selectedWorkspace.id, id);
      setKnowledge(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load knowledge base details");
    } finally {
      setLoading(false);
    }
  };

  const pollDetails = async () => {
    if (!selectedWorkspace) return;
    try {
      const data = await knowledgeApi.get(selectedWorkspace.id, id);
      // Only update if there are changes to avoid unnecessary re-renders or flickering
      // But for simplicity in this fix, we setKnowledge directly. 
      // React state batching handles simple object replacements well.
      setKnowledge(data);
    } catch (error) {
      console.error("Polling failed:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Check if we have documents in processing or pending state
    // AND if we are not already polling (interval will handle that)
    // The dependency array ensures this effect re-runs when knowledge changes.
    // If state changes from processing -> indexed, polling stops.
    const hasPendingDocs = knowledge?.documents?.some(doc => 
        ['processing', 'pending'].includes(doc.status) || 
        (doc.status === 'processing' && doc.processing_progress < 100)
    );

    if (hasPendingDocs) {
      interval = setInterval(pollDetails, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [knowledge, selectedWorkspace, id]);

  const handleUpload = async (files: File[]) => {
    // This callback is now mainly for refreshing the list after the Dialog handles the uploads.
    // The Dialog calls onUpload([]) when done.
    loadDetails();
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedWorkspace) return;
    if (!confirm("Delete this document?")) return;
    try {
      await knowledgeApi.deleteDocument(selectedWorkspace.id, docId);
      toast.success("Document deleted");
      loadDetails();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document");
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <AppLayout activeModule="knowledge">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!knowledge) {
    return (
      <AppLayout activeModule="knowledge">
         <div className="p-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-center py-20">Knowledge Base not found</div>
         </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="knowledge">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" onClick={handleBack} className="mb-4 pl-0 hover:pl-0 hover:bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Knowledge
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="text-4xl">{knowledge.icon}</div>
              <div>
                <h1 className="text-2xl font-bold">{knowledge.name}</h1>
                <p className="text-muted-foreground">{knowledge.description}</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
                <div className="bg-muted/50 rounded-lg px-4 py-2 text-center">
                    <div className="text-sm font-medium text-muted-foreground">Documents</div>
                    <div className="text-xl font-bold">{knowledge.document_count}</div>
                </div>
                <div className="bg-muted/50 rounded-lg px-4 py-2 text-center">
                    <div className="text-sm font-medium text-muted-foreground">Chunks</div>
                    <div className="text-xl font-bold">{knowledge.total_chunks}</div>
                </div>
                <div className="bg-muted/50 rounded-lg px-4 py-2 text-center">
                    <div className="text-sm font-medium text-muted-foreground">Size</div>
                    <div className="text-xl font-bold">{(knowledge.total_size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
            </Button>
             <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
            </Button>
          </div>
        </div>

        {/* Documents Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Documents</h2>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
          
          <DocumentList
            documents={knowledge.documents || []}
            onDelete={handleDeleteDocument}
            onView={async (doc) => {
               if (!selectedWorkspace) return;
               try {
                  const { token } = await knowledgeApi.getAccessToken(selectedWorkspace.id, doc.id);
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
                  // User confirmed no /api/v1
                  const url = `${baseUrl}/workspaces/${selectedWorkspace.id}/documents/view?token=${token}`;
                  window.open(url, '_blank');
               } catch (error) {
                 console.error("Failed to view document", error);
                 toast.error("Failed to access document. Please try again.");
               }
            }}
          />
        </div>

        <DocumentUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUpload={handleUpload}
        />
      </div>
    </AppLayout>
  );
}

export default function KnowledgeDetailPage({ params }: PageProps) {
  // Unwrapping params using React.use() in Next.js 15+ or await in Next.js 13/14 server components
  // But here we are client side? No, pages are server components by default unless "use client".
  // I put "use client" at top. So params is a promise in newer Next.js.
  // In older Next.js it was prop. 
  // Let's safe handle it with use()
  const resolvedParams = use(params);
  
  return (
     <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <KnowledgeDetailContent id={resolvedParams.id} />
     </Suspense>
  );
}
