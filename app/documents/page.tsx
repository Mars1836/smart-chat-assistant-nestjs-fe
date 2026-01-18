"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Upload,
  MoreVertical,
  Search,
  Grid,
  List,
  Trash2,
  Loader2,
  Download,
  Edit,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  workspacesApi,
  documentsApi,
  type WorkspaceResponseDto,
  type DocumentResponseDto,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponseDto[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentResponseDto | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspacesApi.list();
      setWorkspaces(response.data);
      if (response.data.length > 0) {
        setSelectedWorkspaceId(response.data[0].id);
        await loadDocuments(response.data[0].id);
      }
    } catch (err) {
      console.error("Error loading workspaces:", err);
      toast.error("Lỗi tải workspaces", {
        description: "Không thể tải danh sách workspaces",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (workspaceId: string) => {
    try {
      const response = await documentsApi.list(workspaceId, {
        page: 1,
        limit: 100,
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      setDocuments(response.data);
    } catch (err) {
      console.error("Error loading documents:", err);
      toast.error("Lỗi tải documents", {
        description: "Không thể tải danh sách tài liệu",
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedWorkspaceId) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn", {
        description: "Kích thước file tối đa là 10MB",
      });
      return;
    }

    try {
      setUploading(true);
      await documentsApi.create(selectedWorkspaceId, file);
      toast.success("Upload thành công", {
        description: `Đã tải lên ${file.name}`,
      });
      await loadDocuments(selectedWorkspaceId);
      setUploadDialogOpen(false);
    } catch (err: any) {
      console.error("Error uploading document:", err);
      toast.error("Lỗi upload", {
        description: err?.response?.data?.message || "Không thể tải file lên",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (doc: DocumentResponseDto) => {
    if (!selectedWorkspaceId) return;

    try {
      setDeleting(doc.id);
      await documentsApi.delete(selectedWorkspaceId, doc.id);
      toast.success("Đã xóa tài liệu", {
        description: `Đã xóa ${doc.file_name}`,
      });
      setDocuments(documents.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      console.error("Error deleting document:", err);
      toast.error("Lỗi xóa tài liệu", {
        description: err?.response?.data?.message || "Không thể xóa tài liệu",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleRename = async () => {
    if (!selectedWorkspaceId || !selectedDocument || !newFileName.trim())
      return;

    try {
      const updated = await documentsApi.update(
        selectedWorkspaceId,
        selectedDocument.id,
        {
          file_name: newFileName.trim(),
        }
      );
      toast.success("Đã đổi tên", {
        description: `Đã đổi tên thành ${updated.file_name}`,
      });
      setDocuments(
        documents.map((d) => (d.id === updated.id ? updated : d))
      );
      setRenameDialogOpen(false);
      setSelectedDocument(null);
      setNewFileName("");
    } catch (err: any) {
      console.error("Error renaming document:", err);
      toast.error("Lỗi đổi tên", {
        description: err?.response?.data?.message || "Không thể đổi tên tài liệu",
      });
    }
  };

  const openRenameDialog = (doc: DocumentResponseDto) => {
    setSelectedDocument(doc);
    setNewFileName(doc.file_name);
    setRenameDialogOpen(true);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout activeModule="documents">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeModule="documents">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={!selectedWorkspaceId}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload tài liệu</DialogTitle>
                <DialogDescription>
                  Chọn file để tải lên. Kích thước tối đa 10MB.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">Chọn file</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải lên...
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and View Controls */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid" ? "bg-primary hover:bg-primary/90" : ""
              }
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list" ? "bg-primary hover:bg-primary/90" : ""
              }
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "Không tìm thấy tài liệu" : "Chưa có tài liệu"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Thử tìm kiếm với từ khóa khác"
                : "Upload tài liệu đầu tiên để bắt đầu"}
            </p>
          </div>
        )}

        {/* Documents Grid */}
        {viewMode === "grid" && filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="hover:shadow-lg transition-shadow group"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          disabled={deleting === doc.id}
                        >
                          {deleting === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`${API_BASE_URL}${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tải xuống
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameDialog(doc)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Đổi tên
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(doc.size)} • {doc.type.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(doc.uploaded_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documents List */}
        {viewMode === "list" && filteredDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tất cả tài liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • {doc.type.toUpperCase()} •{" "}
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          disabled={deleting === doc.id}
                        >
                          {deleting === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`${API_BASE_URL}${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tải xuống
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameDialog(doc)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Đổi tên
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi tên tài liệu</DialogTitle>
              <DialogDescription>
                Nhập tên mới cho tài liệu
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newName">Tên mới</Label>
                <Input
                  id="newName"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Nhập tên file mới"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleRename} disabled={!newFileName.trim()}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
