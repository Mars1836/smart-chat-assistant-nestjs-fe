
import { useState, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File as FileIcon, Loader2, CheckCircle2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { knowledgeApi } from "@/lib/api/knowledge";
import { tokenStorage } from "@/lib/api/token-storage";
import { useWorkspace } from "@/lib/stores/workspace-store";
import { useParams } from "next/navigation";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
}

export function DocumentUploadDialog({ open, onOpenChange, onUpload }: DocumentUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedWorkspace } = useWorkspace();
  const params = useParams(); // To get knowledgeId if available in URL params

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const fileToRemove = files[index];
    if (fileToRemove) {
       // Clean up state
       const name = fileToRemove.name;
       setProgress(prev => { const n = {...prev}; delete n[name]; return n; });
       setStatus(prev => { const n = {...prev}; delete n[name]; return n; });
    }
  };

  const abortControllers = useRef<Record<string, AbortController>>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllers.current).forEach(controller => controller.abort());
    };
  }, []);
  const startProgressTracking = async (documentId: string, fileName: string) => {
     if (!selectedWorkspace) return;
     const token = tokenStorage.getAccessToken();
     if (!token) return;

     const controller = new AbortController();
     abortControllers.current[fileName] = controller;

     const url = knowledgeApi.getUploadProgressUrl(selectedWorkspace.id, documentId);

     await fetchEventSource(url, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
       signal: controller.signal,
       onmessage(event: { data: string }) {
         if (!event.data) return;
         try {
           const data = JSON.parse(event.data);
           // data structure: { documentId, status, progress, message }
           
           if (data.progress !== undefined) {
              setProgress(prev => ({ ...prev, [fileName]: data.progress }));
           }
           if (data.message) {
              setStatus(prev => ({ ...prev, [fileName]: data.message }));
           }
           
           if (data.status === 'indexed') {
             setStatus(prev => ({ ...prev, [fileName]: "Done" }));
             setProgress(prev => ({ ...prev, [fileName]: 100 }));
             // Stop listening
             controller.abort(); 
             delete abortControllers.current[fileName];
           } else if (data.status === 'failed') {
             setStatus(prev => ({ ...prev, [fileName]: "Failed" }));
             controller.abort();
             delete abortControllers.current[fileName];
           }
         } catch (e) {
           console.error("Error parsing SSE data", e);
         }
       },
       onerror(err: any) {
             // If aborted, ignore
             if (controller.signal.aborted) return;
             console.error("SSE Error for", fileName, err);
       }
     });
  };

  const handleUploadProcess = async () => {
    if (!selectedWorkspace) return;
    // We assume the page has knowledgeId. If not, this component might fail.
    // However, onUpload prop was doing the upload before.
    // Ideally we should use knowledgeApi.upload here.
    // Let's grab knowledgeId from params.
    const knowledgeId = params?.id as string;
    
    if (!knowledgeId) {
       // Fallback to calling onUpload (legacy behavior) if we can't find ID?
       // But user wants SSE. 
       // If no knowledgeId and we are in a context where this dialog is used without ID, it's a bug.
       console.error("Knowledge ID not found in params");
       return;
    }

    setUploading(true);
    
    // We process uploads concurrently
    const uploadPromises = files.map(async (file) => {
      try {
        setStatus(prev => ({ ...prev, [file.name]: "Uploading..." }));
        setProgress(prev => ({ ...prev, [file.name]: 0 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('knowledge_id', knowledgeId);

        // Upload
        const doc = await knowledgeApi.upload(selectedWorkspace.id, formData);
        
        // Start tracking
        setStatus(prev => ({ ...prev, [file.name]: "Processing..." }));
        startProgressTracking(doc.id, file.name);

      } catch (err) {
        console.error(err);
        setStatus(prev => ({ ...prev, [file.name]: "Upload Failed" }));
      }
    });

    try {
      await Promise.all(uploadPromises);
      
      // Auto-close after all uploads are successfully sent
      onOpenChange(false);
      
      // Reset state in case it's reopened (though unlikely with same instance logic usually)
      setFiles([]);
      setProgress({});
      setStatus({});
      
      // Notify parent to refresh list (polling will take over for status updates)
      await onUpload([]); 
      
    } catch (error) {
      console.error(error);
      // Only keep open if there was a critical error in uploading
      setUploading(false);
    } finally {
       // Cleaning up uploading state if we didn't close
       if (uploading) setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!uploading && files.length === 0 && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input 
                ref={inputRef}
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleInputChange}
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop files here or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, TXT, MD, PNG, JPG (max 20MB)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Images are automatically processed using Gemini Vision AI
                </p>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Files ({files.length})</h4>
              <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-8 h-8 text-primary/70" />
                    ) : (
                      <FileIcon className="w-8 h-8 text-primary/70" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">{file.name}</span>
                        {!uploading && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Always show progress if uploading or if there is status */}
                      {(uploading || status[file.name]) && (
                        <div className="space-y-1">
                          <Progress value={progress[file.name] || 0} className="h-2" />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {status[file.name] === "Done" ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded & Indexed
                              </span>
                            ) : status[file.name] === "Failed" ? (
                               <span className="text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Failed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> {status[file.name]} ({progress[file.name] || 0}%)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {!uploading && !status[file.name] && (
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              {uploading ? "Close (Background)" : "Cancel"}
            </Button>
            {!uploading && (
                <Button 
                onClick={handleUploadProcess} 
                disabled={files.length === 0}
                >
                Upload Files
                </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

