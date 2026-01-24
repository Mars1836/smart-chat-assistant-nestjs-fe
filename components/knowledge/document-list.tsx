
import { Document } from "@/lib/api/knowledge";
import { formatDistanceToNow } from "date-fns";
import { FileText, Image, File, Loader2, CheckCircle2, AlertCircle, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onView: (doc: Document) => void;
}

const getFileIcon = (type: string) => {
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(type.toLowerCase())) {
    return Image;
  }
  if (type.toLowerCase() === "pdf") {
    return FileText;
  }
  return File;
};

const getStatusBadge = (status: Document["status"], progress: number) => {
  switch (status) {
    case "indexed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Indexed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing ({progress}%)
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
          <AlertCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1">
          <Loader2 className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
};

export function DocumentList({ documents, onDelete, onView }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium text-lg">No documents yet</h3>
        <p className="text-muted-foreground text-sm">Upload documents to get started</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Chunks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.type);
            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{doc.type}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {(doc.size / 1024).toFixed(1)} KB
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {doc.chunk_count}
                </TableCell>
                <TableCell>
                  {getStatusBadge(doc.status, doc.processing_progress)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(doc.uploaded_at))} ago
                  <div className="text-xs opacity-70">by {doc.user?.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView(doc)}>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => onDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
