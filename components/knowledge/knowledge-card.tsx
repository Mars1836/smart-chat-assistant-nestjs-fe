
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KnowledgeBase } from "@/lib/api/knowledge";
import { formatDistanceToNow } from "date-fns";
import { vi as localeVi } from "date-fns/locale";
import { formatFileSize, toSafeNumber } from "@/lib/utils/format-size";
import { useLanguage } from "@/components/providers/language-provider";

interface KnowledgeCardProps {
  knowledge: KnowledgeBase;
  onDelete?: (id: string) => void;
  onClick: (knowledge: KnowledgeBase) => void;
}

export function KnowledgeCard({ knowledge, onDelete, onClick }: KnowledgeCardProps) {
  const { locale } = useLanguage();
  const documentCount = toSafeNumber(knowledge.document_count);
  const totalChunks = toSafeNumber(knowledge.total_chunks);

  return (
    <Card 
      className="relative cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onClick(knowledge)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 pr-10">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl shrink-0">
              {knowledge.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{knowledge.name}</h3>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{knowledge.description}</p>
              
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground flex-wrap">
                <Badge variant="secondary" className="font-normal">
                  {documentCount} document{documentCount !== 1 ? "s" : ""}
                </Badge>
                •
                <span>{totalChunks} chunks</span>
                •
                <span>{formatFileSize(knowledge.total_size)}</span>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(knowledge.created_at), {
                  addSuffix: true,
                  ...(locale === "vi" ? { locale: localeVi } : {}),
                })}
              </div>
            </div>
          </div>

          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  // Settings logic
                }}>
                   <Settings className="w-4 h-4 mr-2" />
                   Settings
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(knowledge.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
